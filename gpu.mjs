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

let adapter               = null
let device                = null
let context               = null
let devicePixelRatio      = null
let presentationSize      = null
let presentationFormat    = null
let renderPassDescriptor  = null
let renderTarget          = null
let renderTargetView      = null
let renderJobs            = new JobSet()
let computeJobs           = new JobSet()
let depthTexture          = null
let resolvedDepthTexture  = null
let pickerTexture         = null
let viewportUniformBuffer = null
let depthExtractBuffer    = null

export async function init(canvas) {
  const aspect = canvas.width / canvas.height
  webfx.renderJobs = renderJobs
  webfx.computeJobs = computeJobs
  adapter = await navigator.gpu.requestAdapter()
  device = await adapter.requestDevice()
  context = canvas.getContext('webgpu')
  devicePixelRatio = window.devicePixelRatio || 1
  presentationSize = [
    canvas.clientWidth * devicePixelRatio,
    canvas.clientHeight * devicePixelRatio,
  ]
  presentationFormat = context.getPreferredFormat(adapter)
  context.configure({
    device,
    format: presentationFormat,
    size: presentationSize,
  })
  renderTarget = device.createTexture({
    size: presentationSize,
    format: presentationFormat,
    sampleCount: config.MULTISAMPLE_COUNT,
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  })
  renderTargetView = renderTarget.createView()
  depthTexture = device.createTexture({
    size: presentationSize,
    format: 'depth32float',
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    sampleCount: config.MULTISAMPLE_COUNT,
  })
  resolvedDepthTexture = device.createTexture({
    size: presentationSize,
    format: 'depth32float',
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    sampleCount: 1,
  })
  pickerTexture = device.createTexture({
    size: presentationSize,
    format: 'r32uint',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    sampleCount: config.MULTISAMPLE_COUNT,
  })
  viewportUniformBuffer = device.createBuffer({
    size: 2*4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
  depthExtractBuffer = device.createBuffer({
    size: 64*Math.ceil(presentationSize[0]/64)*presentationSize[1],
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  })
  device.queue.writeBuffer(viewportUniformBuffer, 0, new Float32Array(presentationSize))
  renderPassDescriptor = {
    colorAttachments: [{
        view: renderTargetView,
        resolveTarget: null,
        loadValue: { r: 0.06, g: 0.06, b: 0.09, a: 1.0 },
        storeOp: 'store'
    }, {
        view: pickerTexture.createView(),
        loadValue: { r: 0, g:0, b:0, a:0 },
        storeOp: 'store'
    }],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      resolveTarget: resolvedDepthTexture.createView(),
      depthLoadValue: 1.0,
      depthStoreOp: 'store',
      stencilLoadValue: 0,
      stencilStoreOp: 'store',
    },
  }
  memory.init(device)
  await RenderGroup.init(device, presentationFormat, viewportUniformBuffer)
  await wavegen.init(device)
  await dft.init(device)
  await wavemix.init(device)
  await xcorrelate.init(device)
  await waverender.init(device, presentationFormat)
  await dftrender.init(device, context, presentationFormat, memory.getBuffer())
  await sceneView.init(device, aspect, presentationFormat, canvas)
  waverender.setViewportSize(...presentationSize)
  dftrender.setViewportSize(...presentationSize)

  const resizeObserver = new ResizeObserver(entries => {
    const r = canvas.getBoundingClientRect()
    presentationSize = [r.width, r.height]
    const aspect = r.width / r.height
    context.configure({
      device,
      format: presentationFormat,
      size: presentationSize,
    })
    waverender.setViewportSize(r.width, r.height)
    dftrender.setViewportSize(r.width, r.height)
    renderTarget.destroy()
    renderTarget = device.createTexture({
      size: presentationSize,
      format: presentationFormat,
      sampleCount: config.MULTISAMPLE_COUNT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    })
    depthTexture.destroy()
    depthTexture = device.createTexture({
      size: presentationSize,
      format: 'depth32float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      sampleCount: config.MULTISAMPLE_COUNT,
    })
    resolvedDepthTexture.destroy()
    resolvedDepthTexture = device.createTexture({
      size: presentationSize,
      format: 'depth32float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      sampleCount: 1,
    })
    pickerTexture.destroy()
    pickerTexture = device.createTexture({
      size: presentationSize,
      format: 'r32uint',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      sampleCount: config.MULTISAMPLE_COUNT,
    })
    depthExtractBuffer.destroy()
    depthExtractBuffer = device.createBuffer({
      size: 4*64*Math.ceil(presentationSize[0]/64)*presentationSize[1],
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    })
    device.queue.writeBuffer(viewportUniformBuffer, 0, new Float32Array(presentationSize))
    renderPassDescriptor.colorAttachments[0].view = renderTarget.createView()
    //renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView()
    renderPassDescriptor.colorAttachments[1].view = pickerTexture.createView()
    renderPassDescriptor.depthStencilAttachment.view = depthTexture.createView()
    renderPassDescriptor.depthStencilAttachment.resolveTarget = resolvedDepthTexture.createView()
    document.querySelectorAll('wave-view').forEach(e => e.updateRect())
    post(actions.ChangeAspect(aspect))
  })
  resizeObserver.observe(document.querySelector('body'))

}

export function addRenderJob(job) {
  renderJobs.add(job)
}

export function removeRenderJob(job) {
  renderJobs.remove(job)
}

export function addComputeJob(job) {
  computeJobs.add(job)
}

export function removeComputeJob(job) {
  computeJobs.remove(job)
}

export function renderFrame(time) {
  wavegen.setTime(time)
  renderPassDescriptor.colorAttachments[0].resolveTarget = context.getCurrentTexture().createView()
  //renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView()
  {
    const commandEncoder = device.createCommandEncoder()
    wavegen.queueComputePass(commandEncoder)
    wavemix.queueComputePass(commandEncoder)
    dft.queueComputePass(commandEncoder)
    xcorrelate.queueComputePass(commandEncoder)
    device.queue.submit([commandEncoder.finish()])
  }
  {
    const commandEncoder = device.createCommandEncoder()
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    renderJobs.all.forEach(job => job.render(passEncoder))
    passEncoder.endPass()
    device.queue.submit([commandEncoder.finish()])
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

