import {JobSet} from '/jobset.mjs'
import * as config from '/config.mjs'

export class RenderGroup extends JobSet {
  renderPassDescriptor   = null
  colourRenderAttachment = null
  depthRenderAttachment  = null
  renderSize             = null
  blitRegion             = null
  blitBindGroup          = null
  blitVertices           = null
  blitVertexBuffer       = null

  static device                = null
  static renderFormat          = null
  static blitPipeline          = null
  static viewportUniformBuffer = null
  static blitSampler           = null
  static initialised           = false

  constructor(renderSize, blitRegion) {
    if(!RenderGroup.initialised) throw 'Not initialised'
    this.renderSize       = renderSize
    this.blitRegion       = blitRegion
    this.blitVertices     = new Float32Array(4*6)
    this.blitVertexBuffer = device.createBuffer({
      size: this.blitVertices.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    this.updateBlitVertices()
    this.updateRenderAttachments()
  }

  static async init(device, renderFormat, viewportUniformBuffer) {
    RenderGroup.renderFormat          = renderFormat
    RenderGroup.viewportUniformBuffer = viewportUniformBuffer
    const code = await (await fetch('wgsl/render/frame.wgsl')).text()
    const module = device.createShaderModule({ code })
    this.blitPipeline = device.createRenderPipeline({
      vertex: {
        module: module,
        entryPoint: 'vert_main',
        buffers: [{   
          arrayStride: 6*4,
          stepMode: 'vertex',
          attributes: [
            { shaderLocation: 0, offset:  0, format: 'float32x4' },
            { shaderLocation: 1, offset: 16, format: 'float32x2' },
          ],
        }]
      }, fragment: {
        module: module,
        entryPoint: 'frag_main',
        targets: [{
          format: renderFormat,
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
    RenderGroup.blitSampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    })
    this.renderPassDescriptor = {
      colorAttachments: [{
        view:      null,
        loadValue: {r: 0, g: 0, b: 0, a: 1},
        storeOp:   'store'
      }],
      depthStencilAttachment: {
        view:             null,
        depthLoadValue:   1,
        depthStoreOp:     'store',
        stencilLoadValue: 0,
        stencilStoreOp:   'store',
      }
    }

    RenderGroup.initialised = true
  }

  updateBlitVertices() {
    this.blitVertices.set(meshes.rect(...this.blitRegion))
    RenderGroup.device.queue.writeBuffer(this.blitVertexBuffer, 0, this.blitVertices)
  }

  updateRenderAttachments() {
    if(this.colourRenderAttachment) this.colourRenderAttachment.destroy()
    if(this.depthRenderAttachment)  this.depthRenderAttachment.destroy()
    if(this.blitBindGroup)          this.blitBindGroup.destroy()
    this.colourRenderAttachment = RenderGroup.device.createTexture({
      size:        this.renderSize,
      format:      RenderGroup.renderFormat,
      sampleCount: config.MULTISAMPLE_COUNT,
      usage:       GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    })
    this.depthRenderAttachment = RenderGroup.device.createTexture({
      size:        this.renderSize,
      format:      'depth32float',
      sampleCount: config.MULTISAMPLE_COUNT,
      usage:       GPUTextureUsage.RENDER_ATTACHMENT
    })
    this.blitBindGroup = RenderGroup.device.createBindGroup({
      layout: RenderGroup.blitPipeline.getBindGroupLayout(0), 
      entries: [
        { binding: 0, resource: { buffer: RenderGroup.viewportUniformBuffer } },
        { binding: 1, resource: RenderGroup.sampler },
        { binding: 2, resource: this.colourRenderAttachment.createView() },
      ]
    })
    this.renderPassDescriptor.colorAttachments[0].view = this.colourRenderAttachment.createView()
    this.renderPassDescriptor.depthStencilAttachment.view = this.depthRenderAttachment.createView()
  }

  renderToTexture(commandEncoder) {
    const passEncoder = commandEncoder.beginRenderPass(this.renderPassDescriptor)
    this.all.forEach(job => job.render(passEncoder))
    passEncoder.endPass()
  }

  blit(passEncoder) {
    passEncoder.setPipeline(RenderGroup.blitPipeline)
    passEncoder.setVertexBuffer(0, this.blitVertexBuffer)
    passEncoder.setBindGroup(0,    this.blitBindGroup)
    passEncoder.draw(6, 1, 0, 0)
  }

  get rect() {
    return this.blitRegion
  }

  set rect(r) {
    this.blitRegion = r
    this.renderSize = [r[0], r[1]]
    this.updateBlitVerticies()
    this.updateRenderAttachments()
  }
}

