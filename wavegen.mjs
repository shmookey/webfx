import * as config from './config.mjs'
import * as memory from './memory.mjs'
import {JobSet} from './jobset.mjs'

let jobs          = new JobSet()
let pipeline      = null
let globalsBuffer = null 
let device        = null

const GLOBALS_BLOCK_SIZE = 2*4
const PARAM_BLOCK_SIZE   = 3*4*4 + 4 // 4x 3 float wave parameters

export async function init(deviceRef) {
  device = deviceRef
  const code = await (await fetch('wgsl/wavegen.wgsl')).text()
  pipeline = device.createComputePipeline({
    compute: {
      module:     device.createShaderModule({ code }),
      entryPoint: 'main'
    }
  })
  globalsBuffer = device.createBuffer({
    size:  GLOBALS_BLOCK_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })
  device.queue.writeBuffer(globalsBuffer, 0, new Float32Array([config.WAVE_RESOLUTION, 0]))
}

export function addJob(output, coefficients) {
  const paramBuffer = device.createBuffer({
    size:  PARAM_BLOCK_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })
  device.queue.writeBuffer(paramBuffer, 0, new Float32Array(coefficients))
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: {buffer: paramBuffer} },
      { binding: 1, resource: output.resourceEntry  },
      { binding: 2, resource: {buffer: globalsBuffer} }
    ]
  })
  return jobs.add({ bindGroup, paramBuffer })
}

export function removeJob(id) {
  const job = jobs.get(id)
  job.paramBuffer.destroy()
  jobs.remove(id)
}


export function setTime(t) {
  device.queue.writeBuffer(globalsBuffer, 4, new Float32Array([t]))
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

