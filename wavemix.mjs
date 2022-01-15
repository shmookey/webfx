import * as config from './config.mjs'

let slots         = 4
let device        = null
let paramBuffer   = null
let dataBuffer    = null
let pipeline      = null
const bindGroups  = Array(slots)
const unusedSlots = Array(slots).fill(0).map((_,i) => i)
const activeSlots = []

const PARAM_BLOCK_SIZE   = 2*4 + 2*4 + 2*4 + 4
const PARAM_BLOCK_ALIGN  = 256

export async function init(deviceRef, waveDataBuffer) {
  device     = deviceRef
  dataBuffer = waveDataBuffer
  
  const code = await (await fetch('wgsl/wavemix.wgsl')).text()
  pipeline = device.createComputePipeline({
    compute: {
      module: device.createShaderModule({ code }),
      entryPoint: 'main'
    }
  })

  paramBuffer = device.createBuffer({
    size:  slots * PARAM_BLOCK_ALIGN,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })

  for(let i=0; i<slots; i++) {
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
          buffer: dataBuffer,
        }
      }]
    })
  }
}

export function addJob(inA, inB, out, delayA, delayB, fadeA, fadeB) {
  if(unusedSlots.length == 0) throw 'Out of slots'
  const slotID = unusedSlots.shift()
  activeSlots.push(slotID)

  const data = new ArrayBuffer(PARAM_BLOCK_SIZE)
  const view = new DataView(data)
  view.setUint32(   0, inA, true)
  view.setUint32(   4, inB, true)
  view.setFloat32(  8, delayA, true)
  view.setFloat32( 12, delayB, true)
  view.setFloat32( 16, fadeA, true)
  view.setFloat32( 20, fadeB, true)
  view.setUint32(  24, out, true)
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
    passEncoder.dispatch(8)
  }
  passEncoder.endPass()
}

