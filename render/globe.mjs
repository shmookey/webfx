import * as config from '/config.mjs'
import {mat4} from '/node_modules/gl-matrix/esm/index.js'

let device          = null
let pipeline        = null
let globalsBuffer   = null

export async function init(deviceRef, presentationFormat, globalsBufferRef) {
  device        = deviceRef
  globalsBuffer = globalsBufferRef
  const code = await (await fetch('wgsl/render/globe.wgsl')).text()
  const module = device.createShaderModule({ code })
  pipeline = device.createRenderPipeline({
    vertex: {
      module: module,
      entryPoint: 'vert_main',
      buffers: [{   
        arrayStride: 40,
        stepMode: 'vertex',
        attributes: [
          { shaderLocation: 0, offset: 0,  format: 'float32x3' }, // pos
          { shaderLocation: 1, offset: 12, format: 'float32x2' }, // lat/lon
          { shaderLocation: 2, offset: 20, format: 'float32x3' }, // norm
          { shaderLocation: 3, offset: 32, format: 'float32x2' }, // uv
        ],
      }]
    }, fragment: {
      module: module,
      entryPoint: 'frag_main',
      targets: [{
        format: presentationFormat,
//        blend: {
//          color: { operation: 'add', srcFactor: 'one', dstFactor: 'one' },
//          alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one' }
//        }
      }, {
        format: 'r32uint',
      }]
    }, primitive: {
      topology: 'triangle-list',
      cullMode: 'back'
    }, multisample: {
      count: config.MULTISAMPLE_COUNT,
      alphaToCoverageEnabled: config.MULTISAMPLE_ALPHA_TO_COVERAGE,
    }, depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth32float',
    },
  })
}

export function create(mesh, colour, position, scale) {
  const modelMatrix = mat4.create()
  mat4.fromTranslation(modelMatrix, position)
  mat4.scale(modelMatrix, modelMatrix, scale)
  const uniformData = new Float32Array(4*4 + 4)
  uniformData.set(modelMatrix, 0)
  uniformData.set(colour, 16)
  const uniformBuffer = device.createBuffer({
    size:  uniformData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })
  device.queue.writeBuffer(uniformBuffer, 0, uniformData)
  const vertexData    = new Float32Array(mesh)
  const vertexBuffer  = device.createBuffer({
    size:  vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  })
  const vertexBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0), 
    entries: [
      { binding: 0, resource: { buffer: globalsBuffer } },
      { binding: 1, resource: { buffer: uniformBuffer } },
    ]
  })
  const fragmentBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(1), 
    entries: [
      { binding: 0, resource: { buffer: globalsBuffer } },
      { binding: 1, resource: { buffer: uniformBuffer } },
    ]
  })
  const job = {
    vertexBuffer, vertexData, uniformBuffer, uniformData,
    vertexBindGroup, fragmentBindGroup, modelMatrix,
    nVertices: vertexData.length/10,
    position,
    scale,
    destroy()      { return destroy(job) },
    transform(m)   { return transform(job, m) },
    render(enc)    { return render(job, enc) },
    setPosition(p) { return setPosition(job, p) },
    setScale(s)    { return setScale(job, s) },
  }
  device.queue.writeBuffer(vertexBuffer,  0, vertexData)
  device.queue.writeBuffer(uniformBuffer, 0, uniformData)
  return job
}

export function transform(job, transformMatrix) {
  const tmpMatrix = mat4.create()
  mat4.mul(tmpMatrix, job.modelMatrix, transformMatrix)
  job.modelMatrix.set(tmpMatrix)
  job.uniformData.set(job.modelMatrix)
  device.queue.writeBuffer(job.uniformBuffer, 0, job.uniformData)
}

export function setPosition(job, position) {
  mat4.fromTranslation(job.modelMatrix, position)
  mat4.scale(job.modelMatrix, job.modelMatrix, job.scale)
  job.uniformData.set(job.modelMatrix)
  device.queue.writeBuffer(job.uniformBuffer, 0, job.uniformData)
  job.position = position
}

export function setScale(job, scale) {
  mat4.fromTranslation(job.modelMatrix, scale)
  mat4.scale(job.modelMatrix, job.modelMatrix, job.position)
  job.uniformData.set(job.modelMatrix)
  device.queue.writeBuffer(job.uniformBuffer, 0, job.uniformData)
  job.scale = scale
}

export function destroy(job) {
  job.vertexBuffer.destroy()
  job.uniformBuffer.destroy()
}

export function render(job, passEncoder) {
  passEncoder.setPipeline(pipeline)
  passEncoder.setVertexBuffer(0, job.vertexBuffer)
  passEncoder.setBindGroup(0, job.vertexBindGroup)
  passEncoder.setBindGroup(1, job.fragmentBindGroup)
  passEncoder.draw(job.nVertices, 1, 0, 0)
}

