import * as wavegen    from '/wavegen.mjs'
import * as wavemix    from '/wavemix.mjs'
import * as dft        from '/dft.mjs'
import * as config     from '/config.mjs'
import * as memory     from '/memory.mjs'
import * as xcorrelate from '/xcorrelate.mjs'
import * as sceneView  from '/view/scene.mjs'
import * as actions    from '/model/action.mjs'
import * as dftrender  from '/render/dft.mjs'
import * as waverender from '/render/wave.mjs'
import {RenderGroup}   from '/render/group.mjs'
import {JobSet}        from '/jobset.mjs'

const gpu = {
  canvas:                null,
  adapter:               null,
  device:                null,
  context:               null,
  renderPassDescriptor:  null,
  presentation: {
    size:                new Float32Array(2),
    pixelRatio:          null,
    format:              null,
    aspect:              null,
  },
  buffers: {
    viewportUniforms:    null,
    depthExtraction:     null,
    picker:              null,
  },
  attachments: {
    colour:              null,
    depth:               null,
    pickerMSAA:          null,
    picker:              null,
  },
  jobs: {
    render:              new JobSet(),
    compute:             new JobSet(),
  },
  renderPassDescriptor: {
    colorAttachments: [{
      view:          null,
      resolveTarget: null,
      loadValue:     {r: 0, g: 0, b: 0, a: 1},
      storeOp:       'store'
    }, {
      view:          null,
      resolveTarget: null,
      loadValue:     {r: 0, g: 0, b: 0, a: 0},
      storeOp:       'store'
    }],
    depthStencilAttachment: {
      view:             null,
      depthLoadValue:   1,
      depthStoreOp:     'store',
      stencilLoadValue: 0,
      stencilStoreOp:   'store',
    }
  }
}

export async function init(canvas) {
  webfx.gpu               = gpu
  gpu.adapter             = await navigator.gpu.requestAdapter()
  gpu.device              = await gpu.adapter.requestDevice()
  gpu.canvas              = canvas
  gpu.context             = canvas.getContext('webgpu')
  gpu.presentation.format = gpu.context.getPreferredFormat(gpu.adapter)
  initPresentationGeometry()
  initRenderAttachments()
  configureCanvasContext()
  setupBuffers()
  await sceneView.init(gpu.device, gpu.presentation.aspect, gpu.presentation.format, gpu.canvas)

  //memory.init(device)
  //await RenderGroup.init(device, presentationFormat, viewportUniformBuffer)
  //await wavegen.init(device)
  //await dft.init(device)
  //await wavemix.init(device)
  //await xcorrelate.init(device)
  //await waverender.init(device, presentationFormat)
  //await dftrender.init(device, context, presentationFormat, memory.getBuffer())
  //waverender.setViewportSize(...presentationSize)
  //dftrender.setViewportSize(...presentationSize)

  const resizeObserver = new ResizeObserver(entries => {
    const oldAspect = gpu.presentation.aspect

    initPresentationGeometry()
    initRenderAttachments()
    configureCanvasContext()
    setupBuffers()

    if(gpu.presentation.aspect != oldAspect) 
      post(actions.ChangeAspect(gpu.presentation.aspect))
    
    //const r = canvas.getBoundingClientRect()
    //presentationSize.set([r.width, r.height])
    //const aspect = r.width / r.height
    //context.configure({
    //  device,
    //  format: presentationFormat,
    //  size: presentationSize,
    //})

    //waverender.setViewportSize(r.width, r.height)
    //dftrender.setViewportSize(r.width, r.height)
    //renderTarget.destroy()
    //renderTarget = device.createTexture({
    //  size: presentationSize,
    //  format: presentationFormat,
    //  sampleCount: config.MULTISAMPLE_COUNT,
    //  usage: GPUTextureUsage.RENDER_ATTACHMENT
    //})
    //depthTexture.destroy()
    //depthTexture = device.createTexture({
    //  size: presentationSize,
    //  format: 'depth32float',
    //  usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    //  sampleCount: config.MULTISAMPLE_COUNT,
    //})
    //resolvedDepthTexture.destroy()
    //resolvedDepthTexture = device.createTexture({
    //  size: presentationSize,
    //  format: 'depth32float',
    //  usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    //  sampleCount: 1,
    //})
    //pickerTexture.destroy()
    //pickerTexture = device.createTexture({
    //  size: presentationSize,
    //  format: 'r32uint',
    //  usage: GPUTextureUsage.RENDER_ATTACHMENT,
    //  sampleCount: config.MULTISAMPLE_COUNT,
    //})
    //depthExtractBuffer.destroy()
    //depthExtractBuffer = device.createBuffer({
    //  size: 4*64*Math.ceil(presentationSize[0]/64)*presentationSize[1],
    //  usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    //})
    //device.queue.writeBuffer(viewportUniformBuffer, 0, new Float32Array(presentationSize))

    //renderPassDescriptor.colorAttachments[0].view = renderTarget.createView()
    //renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView()
    //renderPassDescriptor.colorAttachments[1].view = pickerTexture.createView()
    //renderPassDescriptor.depthStencilAttachment.view = depthTexture.createView()
    //renderPassDescriptor.depthStencilAttachment.resolveTarget = resolvedDepthTexture.createView()

    //document.querySelectorAll('wave-view').forEach(e => e.updateRect())
  })
  resizeObserver.observe(document.querySelector('body'))

}

function initRenderAttachments() {
  if(gpu.attachments.colour)     gpu.attachments.colour.destroy()
  if(gpu.attachments.depth)      gpu.attachments.depth.destroy()
  if(gpu.attachments.pickerMSAA) gpu.attachments.pickerMSAA.destroy()
  if(gpu.attachments.picker)     gpu.attachments.picker.destroy()

  gpu.attachments.colour = gpu.device.createTexture({
    size:        gpu.presentation.size,
    format:      gpu.presentation.format,
    usage:       GPUTextureUsage.RENDER_ATTACHMENT,
    sampleCount: config.MULTISAMPLE_COUNT,
  })
  gpu.attachments.depth = gpu.device.createTexture({
    size:        gpu.presentation.size,
    format:      'depth32float',
    usage:       GPUTextureUsage.RENDER_ATTACHMENT,
    sampleCount: config.MULTISAMPLE_COUNT,
  })
  gpu.attachments.pickerMSAA = gpu.device.createTexture({
    size:        gpu.presentation.size,
    format:      'r32uint',
    usage:       GPUTextureUsage.RENDER_ATTACHMENT,
    sampleCount: config.MULTISAMPLE_COUNT,
  })
  gpu.attachments.picker = gpu.device.createTexture({
    size:        gpu.presentation.size,
    format:      'r32uint',
    usage:       GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    sampleCount: 1,
  })

  const descriptor = gpu.renderPassDescriptor
  descriptor.colorAttachments[0].view          = gpu.attachments.colour.createView()
  descriptor.colorAttachments[1].view          = gpu.attachments.pickerMSAA.createView()
  descriptor.colorAttachments[1].resolveTarget = gpu.attachments.picker.createView()
  descriptor.depthStencilAttachment.view       = gpu.attachments.depth.createView()
}

function initPresentationGeometry() {
  const pixelRatio            = window.devicePixelRatio || 1
  const clientSize            = [gpu.canvas.clientWidth, gpu.canvas.clientHeight]
  const presentationSize      = [clientSize[0] * pixelRatio, clientSize[1] * pixelRatio]
  gpu.presentation.pixelRatio = pixelRatio
  gpu.presentation.size[0]    = clientSize[0] * pixelRatio 
  gpu.presentation.size[1]    = clientSize[1] * pixelRatio 
  gpu.presentation.aspect     = clientSize[0] / clientSize[1]
}

function configureCanvasContext() {
  gpu.context.configure({
    device: gpu.device,
    format: gpu.presentation.format,
    size:   gpu.presentation.size,
  })
}

function setupBuffers() { 
  // Depth extraction
  if(gpu.buffers.depthExtraction) gpu.buffers.depthExtraction.destroy()
  gpu.buffers.depthExtraction = gpu.device.createBuffer({
    size:  64*Math.ceil(gpu.presentation.size[0]/64)*gpu.presentation.size[1],
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  })

  // Don't bother recreating viewport uniform or picker buffer if already set up
  if(!gpu.buffers.viewportUniforms) {
    gpu.buffers.viewportUniforms = gpu.device.createBuffer({
      size:  8,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
  }
  gpu.device.queue.writeBuffer(gpu.buffers.viewportUniforms, 0, gpu.presentation.size)
  if(!gpu.buffers.picker) {
    gpu.buffers.picker = gpu.device.createBuffer({
      size:  4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    })
  }
}


export function addRenderJob(job) {
  gpu.jobs.render.add(job)
}

export function removeRenderJob(job) {
  gpu.jobs.render.remove(job)
}

export function addComputeJob(job) {
  gpu.jobs.compute.add(job)
}

export function removeComputeJob(job) {
  gpu.jobs.compute.remove(job)
}

export function renderFrame(time) {
  //wavegen.setTime(time)
  gpu.renderPassDescriptor.colorAttachments[0].resolveTarget = 
    gpu.context.getCurrentTexture().createView()
  //renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView()
  //{
  //  const commandEncoder = device.createCommandEncoder()
  //  wavegen.queueComputePass(commandEncoder)
  //  wavemix.queueComputePass(commandEncoder)
  //  dft.queueComputePass(commandEncoder)
  //  xcorrelate.queueComputePass(commandEncoder)
  //  device.queue.submit([commandEncoder.finish()])
  //}
  {
    const commandEncoder = gpu.device.createCommandEncoder()
    const passEncoder    = commandEncoder.beginRenderPass(gpu.renderPassDescriptor)
    gpu.jobs.render.all.forEach(job => job.render(passEncoder))
    passEncoder.endPass()
    gpu.device.queue.submit([commandEncoder.finish()])
  }
}

export async function getDepthAt(x, y) {
  const outputTexelsPerRow = Math.ceil(presentationSize[0] / 64) * 64
  const bytesPerRow = outputTexelsPerRow * 4
  const p = (y * outputTexelsPerRow + x)
  const commandEncoder = device.createCommandEncoder()
  commandEncoder.copyTextureToBuffer(
    { texture: resolvedDepthTexture, origin: [0,0], aspect: 'depth-only' },
    { buffer: depthExtractBuffer, bytesPerRow },
    presentationSize
  )
  device.queue.submit([commandEncoder.finish()])
  await depthExtractBuffer.mapAsync(GPUMapMode.READ)
  const data = depthExtractBuffer.getMappedRange()
  const arr = new Float32Array(data)
  const z = arr[p]
  depthExtractBuffer.unmap()
  return z
}

export async function getEntityAt(x, y) {
  const commandEncoder = gpu.device.createCommandEncoder()
  commandEncoder.copyTextureToBuffer(
    { texture: gpu.attachments.picker, origin: [x, y] },
    { buffer: gpu.buffers.picker },
    [1, 1]
  )
  gpu.device.queue.submit([commandEncoder.finish()])
  await gpu.buffers.picker.mapAsync(GPUMapMode.READ)
  const data = gpu.buffers.picker.getMappedRange()
  const arr = new Uint32Array(data)
  const id = arr[0] - 1
  gpu.buffers.picker.unmap()
  return id
}

