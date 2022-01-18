import * as config from './config.mjs'

let capacity = 12

const INSTANCE_VERTEX_SIZE = 7 * 4
const SHAPE_VERTEX_SIZE    = 4 * 4
const VIEWPORT_BUFFER_SIZE = 2 * 4

let device = null
let context = null

let pipeline = null            // Render pipeline
let bindGroup  = []            // Uniform binding group
let vertexBuffer = null        // Shape vertices
let instanceData = new Float32Array(capacity * INSTANCE_VERTEX_SIZE)
let instanceBuffer = null      // Instance vertices
let instanceMapBuffer = null   // Instance -> Waveform mappings
let instanceMapData = null
let renderPassDescriptor = null
let viewportBuffer = null

export async function init(deviceRef, contextRef, presentationFormat, waveBuffer) {
  device = deviceRef
  context = contextRef
  const code = await (await fetch('wgsl/wave.wgsl')).text()
  const module = device.createShaderModule({ code })
  pipeline = device.createRenderPipeline({
    vertex: {
      module: module,
      entryPoint: 'vert_main',
      buffers: [{   
        arrayStride: SHAPE_VERTEX_SIZE,
        stepMode: 'vertex',
        attributes: [{
          shaderLocation: 0,
          offset: 0,
          format: 'float32x2'
        }, {
          shaderLocation: 1,
          offset: 2*4,
          format: 'float32x2'
        }]
      }, {
        arrayStride: INSTANCE_VERTEX_SIZE,
        stepMode: 'instance',
        attributes: [{
          shaderLocation: 2,
          offset: 0,
          format: 'float32x2'
        }, {
          shaderLocation: 3,
          offset: 2*4,
          format: 'float32x2'
        }, {
          shaderLocation: 4,
          offset: 4*4,
          format: 'float32x3'
        }]
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
  const vertexData = new Float32Array([
//   xy        uv
    -1,1,      0,0,
     1,0,      1,1,
     1,1,      1,0,
    -1,1,      0,0,
    -1,0,      0,1,
     1,0,      1,1,
  ])
  vertexBuffer = device.createBuffer({
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  })
  new Float32Array(vertexBuffer.getMappedRange()).set(new Float32Array(vertexData))
  vertexBuffer.unmap()

  instanceBuffer = device.createBuffer({
    size: instanceData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  })
  new Float32Array(instanceBuffer.getMappedRange()).set(new Float32Array(instanceData))
  instanceBuffer.unmap()

  instanceMapData = new Uint32Array(capacity)

  instanceMapBuffer = device.createBuffer({
    size: instanceMapData.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  })
  new Uint32Array(instanceMapBuffer.getMappedRange()).set(new Uint32Array(instanceMapData))
  instanceMapBuffer.unmap()

  viewportBuffer = device.createBuffer({
    size: VIEWPORT_BUFFER_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  })
  new Float32Array(viewportBuffer.getMappedRange()).set(new Float32Array(2))
  viewportBuffer.unmap()
  
  bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: waveBuffer
      }
    }, {
      binding: 1,
      resource: {
        buffer: instanceMapBuffer,
        size: instanceMapData.length * 4
      }
    }, {
      binding: 2,
      resource: {
        buffer: viewportBuffer,
        size: VIEWPORT_BUFFER_SIZE
      }
    }]
  })
  
  renderPassDescriptor = {
    colorAttachments: [{
        view: null,
        loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        storeOp: 'store'
    }]
  }
}

export function setPosition(id, x, y, w, h) {
  device.queue.writeBuffer(
    instanceBuffer,
    id * INSTANCE_VERTEX_SIZE,
    new Float32Array([x,y,w,h])
  )
}

export function setColour(id, rgb) {
  device.queue.writeBuffer(
    instanceBuffer,
    id * INSTANCE_VERTEX_SIZE + 16,
    new Float32Array(rgb)
  )
}

export function setViewportSize(w, h) {
  device.queue.writeBuffer(
    viewportBuffer,
    0,
    new Float32Array([w, h])
  )
}

export function setSource(id, x) {
  instanceMapData[id] = x
  device.queue.writeBuffer(
    instanceMapBuffer,
    0,
    instanceMapData
  )
}

export function queueRenderPass(passEncoder) {
  passEncoder.setPipeline(pipeline);
  passEncoder.setVertexBuffer(0, vertexBuffer);
  passEncoder.setVertexBuffer(1, instanceBuffer);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.draw(6, capacity, 0, 0);
}

