import * as config from './config.mjs'
import {JobSet} from './jobset.mjs'

let jobs     = new JobSet()
let device   = null
let pipeline = null

const PARAM_BLOCK_SIZE   = 4*4 + 4*4

export async function init(deviceRef) {
  device     = deviceRef
  
  const code = await (await fetch('wgsl/wavemix.wgsl')).text()
  pipeline = device.createComputePipeline({
    compute: {
      module: device.createShaderModule({ code }),
      entryPoint: 'main'
    }
  })
}

export function addJob(inA, inB, inC, inD, out, delays, fades) {
  const paramBuffer = device.createBuffer({
    size:  PARAM_BLOCK_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })
  device.queue.writeBuffer(paramBuffer, 0, new Float32Array([...delays, ...fades]))
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: {buffer: paramBuffer} },
      { binding: 1, resource: inA.resourceEntry },
      { binding: 2, resource: inB.resourceEntry },
      { binding: 3, resource: inC.resourceEntry },
      { binding: 4, resource: inD.resourceEntry },
      { binding: 5, resource: out.resourceEntry }
    ]
  })
  return jobs.add({ bindGroup, paramBuffer })
}

export function removeJob(id) {
  const job = jobs.get(id)
  job.paramBuffer.destroy()
  jobs.remove(id)
}

export function queueComputePass(commandEncoder) {
  const passEncoder = commandEncoder.beginComputePass()
  passEncoder.setPipeline(pipeline)
  jobs.all.forEach(job => {
    passEncoder.setBindGroup(0, job.bindGroup)
    passEncoder.dispatch(4)
  })
  passEncoder.endPass()
}

export function runOnce() {
  const commandEncoder = device.createCommandEncoder()
  dft.queueComputePass(commandEncoder)
  device.queue.submit([commandEncoder.finish()])
}

