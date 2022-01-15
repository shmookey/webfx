import * as config from './config.mjs'

const PARAM_BLOCK_ALIGN  = 256
const PARAM_BLOCK_SIZE   = 5 * 4
const SLOTS              = 4

let device       = null
let paramBuffer  = null
let waveBuffer   = null
let dftBuffer    = null
let outputBuffer = null
let pipeline     = null
let bindGroups   = Array(SLOTS)
let unusedSlots  = Array(SLOTS).fill(0).map((_,i) => i)
let activeSlots  = []

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

  paramBuffer = device.createBuffer({
    size:  SLOTS * PARAM_BLOCK_ALIGN,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })
  dftBuffer = device.createBuffer({
    size:  SLOTS * config.DFT_ALIGN,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  })
  outputBuffer = device.createBuffer({
    size:  SLOTS * config.DFT_ALIGN,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  })

  for(let i=0; i<SLOTS; i++) {
    bindGroups[i] = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ 
        binding: 0,
        resource: {
          buffer: paramBuffer,
          size:   PARAM_BLOCK_SIZE,
          offset: i*PARAM_BLOCK_ALIGN 
        }
      }, {
        binding: 1,
        resource: {
          buffer: waveBuffer,
        }
      }, {
        binding: 2,
        resource: {
          buffer: dftBuffer,
        }
      }]
    })
  }

  return dftBuffer
}

export function addJob(input, output, fMax) {
  if(unusedSlots.length == 0) throw 'Out of slots'
  const slotID = unusedSlots.shift()
  activeSlots.push(slotID)
  const iStart = input * (config.WAVE_ALIGN/4)
  const iSize  = config.WAVE_RESOLUTION
  const oStart = output * (config.DFT_ALIGN/8)
  const oSize  = config.DFT_RESOLUTION

  const data = new ArrayBuffer(PARAM_BLOCK_SIZE)
  const view = new DataView(data)
  view.setUint32(   0, iStart,  true)
  view.setUint32(   4, iSize,   true)
  view.setUint32(   8, oStart,  true)
  view.setUint32(  12, oSize,   true)
  view.setFloat32( 16, fMax,    true)
  device.queue.writeBuffer(
    paramBuffer,
    slotID * PARAM_BLOCK_ALIGN,
    data
  )

  return slotID
}

export function removeJob(slotID) {
  const idx = activeSlots.indexOf(slotID)
  if(idx == -1) throw 'Invalid slot'
  activeSlots.splice(idx, 1)
  unusedSlots.push(slotID)
}

export function queueComputePass(commandEncoder) {
  const passEncoder = commandEncoder.beginComputePass()
  passEncoder.setPipeline(pipeline)
  for(let i=0; i<activeSlots.length; i++) {
    passEncoder.setBindGroup(0, bindGroups[activeSlots[i]])
    passEncoder.dispatch(4)
  }
  passEncoder.endPass()
}

export function runOnce() {
  const commandEncoder = device.createCommandEncoder()
  dft.queueComputePass(commandEncoder)
  device.queue.submit([commandEncoder.finish()])
}

export async function getResults(id) {
  const commandEncoder = device.createCommandEncoder()
  const align = config.DFT_ALIGN
  commandEncoder.copyBufferToBuffer(dftBuffer, id*align, outputBuffer, id*align, align)
  device.queue.submit([commandEncoder.finish()])
  await outputBuffer.mapAsync(GPUMapMode.READ, id*align, align)
  const buf = (new Float32Array(outputBuffer.getMappedRange(id*align, align))).slice()
  outputBuffer.unmap()
  return buf
}

