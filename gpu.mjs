import * as wavegen    from './wavegen.mjs'
import * as waverender from './waverender.mjs'
import * as wavemix    from './wavemix.mjs'
import * as dft        from './dft.mjs'
import * as dftrender  from './dftrender.mjs'
import * as config     from './config.mjs'
import * as memory     from './memory.mjs'
import * as xcorrelate from './xcorrelate.mjs'

let readyCallbacks       = []
let adapter              = null
let device               = null
let context              = null
let devicePixelRatio     = null
let presentationSize     = null
let presentationFormat   = null
let waveBuffer           = null
let dftBuffer            = null
let dataBuffer           = null
let renderPassDescriptor = null
let renderTarget         = null
let renderTargetView     = null

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
        loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        storeOp: 'store'
    }]
  }
  memory.init(device)
  waveBuffer = await wavegen.init(device)
  await dft.init(device)
  await wavemix.init(device)
  await xcorrelate.init(device)
  await waverender.init(device, context, presentationFormat, memory.getBuffer())
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

  window.addEventListener('keydown', async ev => {
    switch(ev.code) {
    case 'KeyD':
      const r = await dft.getResults(1)
      console.log(r)
      break
    }
  })

  let startTime = performance.now()
  function frame() {
    let t = (performance.now() - startTime)/1000
    //wavegen.setTime(t)
    renderPassDescriptor.colorAttachments[0].resolveTarget = context.getCurrentTexture().createView()
    const commandEncoder = device.createCommandEncoder()

    wavegen.queueComputePass(commandEncoder)
    wavemix.queueComputePass(commandEncoder)
    dft.queueComputePass(commandEncoder)
    xcorrelate.queueComputePass(commandEncoder)

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    dftrender.queueRenderPass(passEncoder)
    waverender.queueRenderPass(passEncoder)
    passEncoder.endPass()

    device.queue.submit([commandEncoder.finish()])
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

