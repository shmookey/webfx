import * as config from './config.mjs'

let device    = null
let buffer    = null
let outputBuf = null
let slotsFree = Array(config.DATA_BUFFER_SLOTS).fill(0).map((_,i) => i)
let slotsUsed = []
let lastID    = 0

export function init(deviceRef) {
  device = deviceRef
  buffer = device.createBuffer({
    size:  config.DATA_BUFFER_SLOTS * config.DATA_BLOCK_SIZE,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  })
  outputBuf = device.createBuffer({
    size:  config.DATA_BLOCK_SIZE,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  })
}

export function allocate(name) {
  if(slotsFree.length == 0) throw 'No slots available'
  const slot = slotsFree.shift()
  const id = lastID
  lastID++
  const descriptor = {
    id, name, slot,
    resourceEntry: {
      buffer,
      offset: slot * config.DATA_BLOCK_SIZE,
      size: config.DATA_BLOCK_SIZE
    },
    free:  () => free(id),
    fetch: () => fetch(id),
  }
  slotsUsed.push(descriptor)
  return descriptor
}

export function free(block) {
  const id = block.id ?? block
  const idx = slotsUsed.findIndex(x => x.id == id)
  if(idx == -1) throw 'Invalid block'
  block = slotsUsed[idx]
  slotsFree.unshift(block.slot)
  block.slot = null
  block.resourceEntry.buffer = null
}

export function getBuffer() {
  return buffer
}

export async function fetch(id) {
  const idx = slotsUsed.findIndex(x => x.id == id)
  if(idx == -1) throw 'Invalid block'
  const block = slotsUsed[idx]
  const commandEncoder = device.createCommandEncoder()
  const sz = config.DFT_ALIGN
  const slot = block.slot
  commandEncoder.copyBufferToBuffer(buffer, slot*sz, outputBuf, 0, sz)
  device.queue.submit([commandEncoder.finish()])
  await outputBuf.mapAsync(GPUMapMode.READ, 0, sz)
  const buf = (new Float32Array(outputBuf.getMappedRange(0, sz))).slice()
  outputBuf.unmap()
  return buf
}

export function getUsedSlots() {
  return slotsUsed.slice()
}

