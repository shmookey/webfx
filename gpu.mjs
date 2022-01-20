import * as wavegen    from './wavegen.mjs'
import * as waverender from './waverender.mjs'
import * as wavemix    from './wavemix.mjs'
import * as dft        from './dft.mjs'
import * as dftrender  from './dftrender.mjs'
import * as config     from './config.mjs'
import * as memory     from './memory.mjs'
import * as xcorrelate from './xcorrelate.mjs'
import {JobSet}        from './jobset.mjs'

let adapter              = null
let device               = null
let context              = null
let devicePixelRatio     = null
let presentationSize     = null
let presentationFormat   = null
let renderPassDescriptor = null
let renderTarget         = null
let renderTargetView     = null
let renderJobs           = new JobSet()
let computeJobs          = new JobSet()

export async function init(canvas) {
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
  renderPassDescriptor = {
    colorAttachments: [{
        view: renderTargetView,
        resolveTarget: null,
        loadValue: { r: 0.06, g: 0.06, b: 0.09, a: 1.0 },
        storeOp: 'store'
    }]
  }
  memory.init(device)
  await wavegen.init(device)
  await dft.init(device)
  await wavemix.init(device)
  await xcorrelate.init(device)
  await waverender.init(device, presentationFormat)
  await dftrender.init(device, context, presentationFormat, memory.getBuffer())
  waverender.setViewportSize(...presentationSize)
  dftrender.setViewportSize(...presentationSize)

  const resizeObserver = new ResizeObserver(entries => {
    const r = canvas.getBoundingClientRect()
    presentationSize = [r.width, r.height]
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
    renderTargetView = renderTarget.createView()
    renderPassDescriptor.colorAttachments[0].view = renderTargetView
    document.querySelectorAll('wave-view').forEach(e => e.updateRect())
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



