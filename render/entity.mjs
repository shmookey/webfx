import * as config   from '/config.mjs'
import * as resource from '/render/resource.mjs'
import {mat4}        from '/gl-matrix/dist/esm/index.js'


/* Generic renderable 3D object with a user-defined fragment shader.

VERTEX SPECIFICATION: vertices consist of position, normal and UV attributes.
Position and normal are 3-component vectors and UV is a 2-component vector. All
components are 32-bit floats. A total of 8 floats specify a vertex, for a step
size of 32 bytes in the vertex buffer.

VERTEX SHADER: a generic vertex shader is used for all Entity instances. The
shader uses the view and projection matrices from the Globals uniform object
along with the Entity's model matrix to generate vertex positions. The output
position, as well as the input normal and UV attributes, are passed through to
the fragment shader. An additional vertex output for "world position" is also
provided, corresponding to the input position attribute transformed by the
model matrix only.

VERTEX ATTRIBUTES
NAME     LOCATION TYPE      OFFSET  SIZE  DESCRIPTION
position        0 vec3<f32>      0    12  Position in local (model) space
normal          1 vec3<f32>     12    12  Normal vector, for lighting etc.
uv              2 vec2<f32>     24     8  UV coordinates (for textures)

VERTEX OUTPUTS
NAME     LOCATION TYPE      OFFSET  SIZE  DESCRIPTION
position        0 vec3<f32>      0    12  Position in local (model) space
normal          1 vec3<f32>     12    12  Normal vector, for lighting etc.
uv              2 vec2<f32>     24     8  UV coordinates (for textures)
worldpos        3 vec2<f32>     24     8  Position in world space


*/
export class Entity {
  entityID
  modelMatrix
  pipeline
  position
  colour
  scale
  uniformBuffer
  uniformData
  vertexBuffer
  vertexData
  #destroyed
  static isInitialised = false
  static pipelines     = {}
  static vertexState   = null

  constructor(
      entityID,
      fragmentShader,
      vertexData,
      colour,
      position,
      scale,
      propBuf) {
    if(!Entity.isInitialised) throw 'Entity class is not initialised'

    const device  = webfx.gpu.device
    this.entityID = entityID
    this.colour   = colour
    this.position = position
    this.scale    = scale
    this.propBuf  = propBuf
    this.pipeline = Entity.getPipeline(fragmentShader)
    
    // Set up uniforms
    this.modelMatrix = mat4.create()
    this.uniformData = new Float32Array(16 + 4)
    mat4.fromTranslation(this.modelMatrix, this.position)
    mat4.scale(this.modelMatrix, this.modelMatrix, this.scale)
    this.uniformData.set(this.modelMatrix, 0)
    this.uniformData.set(this.colour, 16)
    this.uniformBuffer = device.createBuffer({
      size:  this.uniformData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData)

    // Set up vertex array
    this.vertexData = new Float32Array(vertexData)
    this.vertexBuffer = device.createBuffer({
      size:  this.vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(this.vertexBuffer, 0, vertexData)
    this.nVertices = this.vertexData.length / 8

    // Set up bind groups
    const bindGroupEntries = [
      { binding: 0, resource: { buffer: webfx.globalsBuffer } },
      { binding: 1, resource: { buffer: this.uniformBuffer } },
    ]
    if(propBuf)
      bindGroupEntries.push({binding: 2, resource: { buffer: propBuf }})
    this.vertexBindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0), 
      entries: [
        { binding: 0, resource: { buffer: webfx.globalsBuffer } },
        { binding: 1, resource: { buffer: this.uniformBuffer } },
      ]
    })
    this.fragmentBindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(1), 
      entries: bindGroupEntries,
    })
  }

  setPosition(position) {
    this.#assertActive()
    mat4.fromTranslation(this.modelMatrix, position)
    mat4.scale(this.modelMatrix, this.modelMatrix, this.scale)
    this.uniformData.set(this.modelMatrix)
    webfx.gpu.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData)
    this.position = position
  }

  setScale(scale) {
    this.#assertActive()
    mat4.fromTranslation(this.modelMatrix, scale)
    mat4.scale(this.modelMatrix, this.modelMatrix, this.position)
    this.uniformData.set(this.modelMatrix)
    device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData)
    this.scale = scale
  }

  setColour(colour) {
    this.#assertActive()
    this.colour = colour
    this.uniformData.set(this.colour, 16)
    webfx.gpu.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData)
  }

  destroy() {
    this.#assertActive()
    this.vertexBuffer.destroy()
    this.uniformBuffer.destroy()
    this.#destroyed = true
  }

  render(passEncoder) {
    this.#assertActive()
    passEncoder.setPipeline(this.pipeline)
    passEncoder.setVertexBuffer(0, this.vertexBuffer)
    passEncoder.setBindGroup(0, this.vertexBindGroup)
    passEncoder.setBindGroup(1, this.fragmentBindGroup)
    passEncoder.draw(this.nVertices, 1, 0, 0)
  }

  #assertActive() {
    if(this.#destroyed) throw 'Method call on destroyed entity'
  }

  static async init() {
    Entity.vertexShader  = await resource.getShader('render/entity.vert.wgsl')
    Entity.isInitialised = true
  }

  static getPipeline(name) {
    if(!Entity.isInitialised) throw 'Entity classs is not initialised'
    if(name in Entity.pipelines) {
      return Entity.pipelines[name]
    }
    throw `Pipeline not initialised for fragment shader '${name}'`
  }

  static async createPipeline(name) {
    if(!Entity.isInitialised) throw 'Entity classs is not initialised'
    if(name in Entity.pipelines) 
      return Entity.pipelines[name]
    const module           = await resource.getShader(name)
    const desc             = Entity.createPipelineDescriptor(module)
    const pipeline         = webfx.gpu.device.createRenderPipeline(desc)
    Entity.pipelines[name] = pipeline
    return pipeline
  }

  static createPipelineDescriptor(fragmentShader) {
    return {
      vertex: {
        module: Entity.vertexShader,
        entryPoint: 'main',
        buffers: [{   
          arrayStride: 32,
          stepMode: 'vertex',
          attributes: [
            { shaderLocation: 0, offset: 0,  format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'float32x3' },
            { shaderLocation: 2, offset: 24, format: 'float32x2' },
          ],
        }]
      },
      fragment: {
        module: fragmentShader,
        entryPoint: 'main',
        targets: [{
          format: webfx.gpu.presentation.format,
          blend: {
            color: { operation: 'add', srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
            alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one' }
          }
        }, {
          format: 'r32uint',
        }]
      }, 
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
      multisample: {
        count:                  config.MULTISAMPLE_COUNT,
        alphaToCoverageEnabled: config.MULTISAMPLE_ALPHA_TO_COVERAGE,
      },
      depthStencil: {
        depthWriteEnabled: true,
        format:            'depth32float',
        depthCompare:      'less',
      }
    }
  }

}


