import * as config from '/config.mjs'
import * as meshes from '/render/meshes.mjs'
import {mat4} from '/node_modules/gl-matrix/esm/index.js'

let device          = null
let pipeline        = null
let globalsBuffer   = null

export async function init(deviceRef, presentationFormat, globalsBufferRef) {
  device        = deviceRef
  globalsBuffer = globalsBufferRef
  const code = await (await fetch('wgsl/render/grid.wgsl')).text()
  const module = device.createShaderModule({ code })
  pipeline = device.createRenderPipeline({
    vertex: {
      module: module,
      entryPoint: 'vert_main',
      buffers: [{   
        arrayStride: 4*4,
        stepMode: 'vertex',
        attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x4' }],
      }]
    }, fragment: {
      module: module,
      entryPoint: 'frag_main',
      targets: [{
        format: presentationFormat,
//        blend: {
//          color: { operation: 'add', srcFactor: 'one', dstFactor: 'one' },
//          alpha: { operation: 'add', srcFactor: 'one-minus-dst-alpha', dstFactor: 'one-minus-src-alpha' }
//        }
      }, {
        format: 'r32uint',
      }]
    }, primitive: {
      topology: 'triangle-list',
//      cullMode: 'back',
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

export function create(width, depth, tickSpacing, lineThickness) {
  const modelMatrix   = mat4.create()
  const uniformData   = new Float32Array(modelMatrix)
  const vertexData    = meshes.makeGrid(width, depth, tickSpacing, lineThickness)
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
      { binding: 1, resource: { buffer: uniformBuffer } },
    ]
  })
  const job = {
    vertexBuffer, bindGroup, uniformBuffer, vertexData, uniformData,
    nVertices: vertexData.length/4,
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

//// Create line vertices for a planar grid at y=0 centered on the origin
//function makeVertices(width, depth, tickSpacing) {
//  const vertices = [
//  // Origin
//           0,    0,    -depth/2,   1,
//           0,    0,     depth/2,   1,
//    -width/2,    0,           0,   1,
//     width/2,    0,           0,   1,
//  // Border
//    -width/2,    0,    -depth/2,   1,
//     width/2,    0,    -depth/2,   1,
//     width/2,    0,    -depth/2,   1,
//     width/2,    0,     depth/2,   1,
//     width/2,    0,     depth/2,   1,
//    -width/2,    0,     depth/2,   1,
//    -width/2,    0,     depth/2,   1,
//    -width/2,    0,    -depth/2,   1,
//  ]
//  for(let x=tickSpacing; x<width/2; x += tickSpacing) {
//    vertices.push(
//       x, 0,  depth/2, 1,
//       x, 0, -depth/2, 1,
//      -x, 0,  depth/2, 1,
//      -x, 0, -depth/2, 1,
//    )          
//  }
//  for(let z=tickSpacing; z<depth/2; z += tickSpacing) {
//    vertices.push(
//      -width/2, 0,  z, 1,
//       width/2, 0,  z, 1,
//      -width/2, 0, -z, 1,
//       width/2, 0, -z, 1,
//    )          
//  }
//  return new Float32Array(vertices)
//}
//
//
