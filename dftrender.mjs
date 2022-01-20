import * as config from './config.mjs'
import {JobSet} from './jobset.mjs'

let device          = null
let pipeline        = null
let uvVertexBuffer  = null
let globalsBuffer   = null
const uvVertexData  = new Float32Array([0,0,  1,1,  1,0,  0,0,  0,1,  1,1])
const globalsData   = new Float32Array([0,0, config.DFT_RESOLUTION])

export async function init(deviceRef, contextRef, presentationFormat, dftBuffer) {
  device = deviceRef
  const code = await (await fetch('wgsl/dftview.wgsl')).text()
  const module = device.createShaderModule({ code })
  pipeline = device.createRenderPipeline({
    vertex: {
      module: module,
      entryPoint: 'vert_main',
      buffers: [{   
        arrayStride: 2*4,
        stepMode: 'vertex',
        attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
      }, {
        arrayStride: 2*4,
        stepMode: 'vertex',
        attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x2' }],
      }]
    }, fragment: {
      module: module,
      entryPoint: 'frag_main',
      targets: [{
        format: presentationFormat,
        blend: {
          color: { operation: 'add', srcFactor: 'one', dstFactor: 'one' },
          alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one' }
        }
      }]
    }, primitive: {
      topology: 'triangle-list'
    }, multisample: {
      count: config.MULTISAMPLE_COUNT,
      alphaToCoverageEnabled: config.MULTISAMPLE_ALPHA_TO_COVERAGE,
    },
  })
  globalsBuffer = device.createBuffer({
    size: globalsData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
  uvVertexBuffer = device.createBuffer({
    size: uvVertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  })
  device.queue.writeBuffer(globalsBuffer, 0, globalsData)
  device.queue.writeBuffer(uvVertexBuffer, 0, uvVertexData)

}

export function create(input, scaleFactor) {
  const vertexData = new Float32Array(12)
  const paramsData = new Float32Array([scaleFactor])
  const vertexBuffer = device.createBuffer({
    size:  2*4*6,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  })
  const paramsBuffer = device.createBuffer({
    size:  4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })
  device.queue.writeBuffer(paramsBuffer, 0, paramsData)
  const vertexBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0), 
    entries: [{ binding: 0, resource: { buffer: globalsBuffer } }],
  })
  const fragmentBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(1), 
    entries: [
      { binding: 0, resource: { buffer: globalsBuffer } },
      { binding: 1, resource: { buffer: paramsBuffer } },
      { binding: 2, resource: input.resourceEntry       },
    ]
  })
  const job = {
    vertexBuffer, vertexBindGroup, fragmentBindGroup, vertexData, paramsData,
    get colour()  { return getColour(job) },
    set colour(c) { return setColour(job, c) },
    get rect()    { return getRect(job) },
    set rect(r)   { return setRect(job, r) },
    destroy()     { return destroy(job) },
    render(enc)   { return render(job, enc) },
  }
  return job
}

export function getRect(job) {
  const v = job.vertices
  return [v[0], v[1], v[2]-v[0], v[3]-v[1]]
}

export function setRect(job, r) {
  job.vertexData.set([
    r[0]         , r[1]        ,
    r[0] + r[2]  , r[1] + r[3] ,
    r[0] + r[2]  , r[1]        ,
    r[0]         , r[1]        ,
    r[0]         , r[1] + r[3] ,
    r[0] + r[2]  , r[1] + r[3] ,
  ])
  device.queue.writeBuffer(job.vertexBuffer, 0, job.vertexData)
}

export function destroy(job) {
  job.vertexBuffer.destroy()
  job.paramsBuffer.destroy()
}

export function setViewportSize(w, h) {
  globalsData[0] = w
  globalsData[1] = h
  device.queue.writeBuffer(globalsBuffer, 0, globalsData)
}

export function render(job, passEncoder) {
  passEncoder.setPipeline(pipeline)
  passEncoder.setVertexBuffer(0, job.vertexBuffer)
  passEncoder.setVertexBuffer(1, uvVertexBuffer)
  passEncoder.setBindGroup(0, job.vertexBindGroup)
  passEncoder.setBindGroup(1, job.fragmentBindGroup)
  passEncoder.draw(6, 1, 0, 0)
}


