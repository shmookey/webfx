import * as config from './config.mjs'

let capacity    = 4    // Number of waveforms to allocate memory for
let pipeline    = null // Compute pipeline
let bindGroups  = []   // Uniform binding groups, 1 for each waveform
let paramBuffer = null // Uniform parameter buffer
let paramData   = null // Float32Array of parameter data
let waveBuffer  = null // Output buffer

let device      = null

const PARAM_BLOCK_SIZE  = 3*4*4 + 4 // 4x 3 float wave parameters + time float
const PARAM_BLOCK_ALIGN = 256

export async function init(deviceRef) {
  device = deviceRef
  const code = await (await fetch('wgsl/wavegen.wgsl')).text()
  pipeline = device.createComputePipeline({
    compute: {
      module: device.createShaderModule({ code }),
      entryPoint: 'main'
    }
  })

  paramBuffer = device.createBuffer({
    size: capacity * PARAM_BLOCK_ALIGN,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })
  waveBuffer = device.createBuffer({
    size: capacity * config.WAVE_ALIGN,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  })

  for(let i=0; i<capacity; i++) {
    bindGroups[i] = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0,
          resource: { buffer: paramBuffer,
                      size:   PARAM_BLOCK_SIZE,
                      offset: i*PARAM_BLOCK_ALIGN }},
        { binding: 1,
          resource: { buffer: waveBuffer,
                      offset: i*config.WAVE_ALIGN,
                      size:   config.WAVE_SIZE }}]
    })
  }

  return waveBuffer
}

export function setCoefficients(id, params) {
  device.queue.writeBuffer(
    paramBuffer,
    id * PARAM_BLOCK_ALIGN,
    new Float32Array(params)
  )
}
export function setTime(t) {
  for(let i=0; i<capacity; i++) {
    device.queue.writeBuffer(
      paramBuffer,
      i * PARAM_BLOCK_ALIGN + (PARAM_BLOCK_SIZE-4),
      new Float32Array([t])
    )
  }
}

export function queueComputePass(commandEncoder) {
  const passEncoder = commandEncoder.beginComputePass()
  passEncoder.setPipeline(pipeline)
  for(let i=0; i<capacity; i++) {
    passEncoder.setBindGroup(0, bindGroups[i])
    passEncoder.dispatch(4)
  }
  passEncoder.endPass()
}

