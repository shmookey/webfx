import * as config from './config.mjs'
import {JobSet} from './jobset.mjs'

const PARAM_BLOCK_SIZE = 5*4

let jobs         = new JobSet()
let device       = null
let waveBuffer   = null
let pipeline     = null

export async function init(deviceRef, waveDataBuffer) {
  device     = deviceRef
  waveBuffer = waveDataBuffer
  
  const code = await (await fetch('wgsl/dft.wgsl')).text()
  pipeline = device.createComputePipeline({
    compute: {
      module: device.createShaderModule({ code }),
      entryPoint: 'main'
    }
  })
}

export function addJob(input, output, complexOutput, fMax) {
  const paramBuffer = device.createBuffer({
    size:  PARAM_BLOCK_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })
  const data = new ArrayBuffer(PARAM_BLOCK_SIZE)
  const view = new DataView(data)
  view.setUint32( 0, config.WAVE_RESOLUTION, true)
  view.setUint32( 4, config.DFT_RESOLUTION,  true)
  view.setFloat32(8, fMax,                   true)
  device.queue.writeBuffer(paramBuffer, 0, data)
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [ 
      { binding: 0, resource: {buffer: paramBuffer} },
      { binding: 1, resource: input.resourceEntry   },
      { binding: 2, resource: output.resourceEntry  },
      { binding: 3, resource: complexOutput.resourceEntry  }
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

