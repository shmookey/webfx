import * as config from '/config.mjs'
import * as meshes from '/render/meshes.mjs'
import {fetchImage} from '/util.mjs'
import {mat4} from '/node_modules/gl-matrix/esm/index.js'

let device          = null
let pipeline        = null
let globalsBuffer   = null
let sampler         = null
let cubeTexture     = null

export async function init(deviceRef, presentationFormat, globalsBufferRef) {
  device          = deviceRef
  globalsBuffer   = globalsBufferRef
  const code      = await (await fetch('wgsl/render/skybox.wgsl')).text()
  const module = device.createShaderModule({ code })
  pipeline = device.createRenderPipeline({
    vertex: {
      module: module,
      entryPoint: 'vert_main',
      buffers: [{   
        arrayStride: 4*3 + 4*2,
        stepMode: 'vertex',
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x3' },
          { shaderLocation: 1, offset: 12, format: 'float32x2' },
        ],
      }]
    }, fragment: {
      module: module,
      entryPoint: 'frag_main',
      targets: [{
        format: presentationFormat,
      }, {
        format: 'r32uint',
      }]
    }, primitive: {
      topology: 'triangle-list',
    }, multisample: {
      count: config.MULTISAMPLE_COUNT,
      alphaToCoverageEnabled: config.MULTISAMPLE_ALPHA_TO_COVERAGE,
    }, depthStencil: {
      depthWriteEnabled: false,
      format: 'depth32float',
    },
  })
  const imgTop    = await fetchImage('/img/skybox/top.png')
  const imgBottom = await fetchImage('/img/skybox/bottom.png')
  const imgLeft   = await fetchImage('/img/skybox/left.png')
  const imgRight  = await fetchImage('/img/skybox/right.png')
  const imgFront  = await fetchImage('/img/skybox/front.png')
  const imgBack   = await fetchImage('/img/skybox/back.png')
  cubeTexture = device.createTexture({
    size:      [imgTop.width, imgTop.height, 6],
    dimension: '2d',
    format:    'rgba8unorm',
    usage:     GPUTextureUsage.TEXTURE_BINDING 
             | GPUTextureUsage.COPY_DST
             | GPUTextureUsage.RENDER_ATTACHMENT,
  })
  const copyTo = (img, z) => device.queue.copyExternalImageToTexture(
    {source: img},
    {texture: cubeTexture, origin: {z}},
    [img.width, img.height]
  )
  copyTo(imgRight,  0)
  copyTo(imgLeft,   1)
  copyTo(imgTop,    2)
  copyTo(imgBottom, 3)
  copyTo(imgFront,  4)
  copyTo(imgBack,   5)
  sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  })
}

export function create() {
  const modelMatrix   = mat4.create()
  const uniformData   = new Float32Array(modelMatrix)
  const vertexData    = meshes.cube
  const vertexBuffer  = device.createBuffer({
    size:  vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  })
  const uniformBuffer = device.createBuffer({
    size:  uniformData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0), 
    entries: [
      { binding: 0, resource: { buffer: globalsBuffer } },
//      { binding: 1, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: cubeTexture.createView({
          dimension: 'cube',
          arrayLayerCount: 6,
      }) },
    ]
  })
  const job = {
    vertexBuffer, bindGroup, uniformBuffer, vertexData, uniformData,
    nVertices: vertexData.length/5,
    destroy()     { return destroy(job) },
    render(enc)   { return render(job, enc) },
  }
  device.queue.writeBuffer(vertexBuffer,  0, vertexData)
  device.queue.writeBuffer(uniformBuffer, 0, uniformData)
  return job
}

export function destroy(job) {
  job.vertexBuffer.destroy()
  job.uniformBuffer.destroy()
}

export function render(job, passEncoder) {
  passEncoder.setPipeline(pipeline)
  passEncoder.setVertexBuffer(0, job.vertexBuffer)
  passEncoder.setBindGroup(0, job.bindGroup)
  passEncoder.draw(job.nVertices, 1, 0, 0)
}

