import * as wavegen     from '/wavegen.mjs'
import * as wavemix     from '/wavemix.mjs'
import * as gpu         from '/gpu.mjs'
import * as util        from '/util.mjs'
import * as model       from '/model/state.mjs'
import * as dispatch    from '/dispatch.mjs'
import * as dft         from '/dft.mjs'
import * as config      from '/config.mjs'
import * as memory      from '/memory.mjs'
import * as xcorrelate  from '/xcorrelate.mjs'
import * as signalsView from '/view/signals.mjs'
import * as sceneView   from '/view/scene.mjs'
import * as actions     from '/model/action.mjs'

const elements      = {}
let currentViewName = null
let referenceTime   = performance.now() / 1000
let cumulativeTime  = 0

window.addEventListener('load', async () => {
  window.webfx = {
    memory, elements,
    views: {},
    colourGenerator:         util.colourGenerator(),
    groundPositionGenerator: util.groundPositionGenerator(),
    skyPositionGenerator:    util.skyPositionGenerator(),
    currentView: null,
    state: {
      paused:     false,
      dirty:      true,
      globalTime: 0,
    }, 
    model: model.init(),
  }
  
  elements.canvas = document.querySelector('canvas')
  elements.wrapper = document.querySelector('#wrapper')
  elements.tabs = {
    signals: document.querySelector('#tabs .signals'),
    scene:   document.querySelector('#tabs .scene'),
  }
  elements.tabs.signals.addEventListener('click', () => setView('signals'))
  elements.tabs.scene.addEventListener('click', () => setView('scene'))
  elements.canvas.addEventListener('contextmenu', () => false)
  await gpu.init(elements.canvas)
  //const blocks = {
  //  waveSourceA:   memory.allocate('wave-source-a'),
  //  waveSourceB:   memory.allocate('wave-source-b'),
  //  waveSourceC:   memory.allocate('wave-source-c'),
  //  waveSourceD:   memory.allocate('wave-source-d'),
  //  waveReceiverA: memory.allocate('wave-receiver-a'),
  //  waveReceiverB: memory.allocate('wave-receiver-b'),
  //  waveReceiverC: memory.allocate('wave-receiver-c'),
  //  waveReceiverD: memory.allocate('wave-receiver-d'),
  //  waveReceiverE: memory.allocate('wave-receiver-e'),
  //  waveReceiverF: memory.allocate('wave-receiver-f'),
  //  waveReceiverG: memory.allocate('wave-receiver-g'),
  //  waveReceiverH: memory.allocate('wave-receiver-h'),
  //  dftSourceA:    memory.allocate('dft-source-a'),
  //  dftSourceB:    memory.allocate('dft-source-b'),
  //  dftSourceC:    memory.allocate('dft-source-c'),
  //  dftSourceD:    memory.allocate('dft-source-d'),
  //  dftReceiverA:  memory.allocate('dft-receiver-a'),
  //  dftReceiverB:  memory.allocate('dft-receiver-b'),
  //  dftReceiverC:  memory.allocate('dft-receiver-c'),
  //  dftReceiverD:  memory.allocate('dft-receiver-d'),
  //  dftReceiverE:  memory.allocate('dft-receiver-e'),
  //  dftReceiverF:  memory.allocate('dft-receiver-f'),
  //  dftReceiverG:  memory.allocate('dft-receiver-g'),
  //  dftReceiverH:  memory.allocate('dft-receiver-h'),
  //  cdftReceiverA:  memory.allocate('cdft-receiver-a'),
  //  cdftReceiverB:  memory.allocate('cdft-receiver-b'),
  //  cdftReceiverC:  memory.allocate('cdft-receiver-c'),
  //  cdftReceiverD:  memory.allocate('cdft-receiver-d'),
  //  cdftReceiverE:  memory.allocate('cdft-receiver-e'),
  //  cdftReceiverF:  memory.allocate('cdft-receiver-f'),
  //  cdftReceiverG:  memory.allocate('cdft-receiver-g'),
  //  cdftReceiverH:  memory.allocate('cdft-receiver-h'),
  //  cdftSourceA:    memory.allocate('dft-source-a-complex'),
  //  cdftSourceB:    memory.allocate('dft-source-b-complex'),
  //  cdftSourceC:    memory.allocate('dft-source-c-complex'),
  //  cdftSourceD:    memory.allocate('dft-source-d-complex'),
  //  correlator:    memory.allocate('correlator-output'),
  //  dftcorrelator:    memory.allocate('correlator-output-dft'),
  //  dftcorrelator2:    memory.allocate('correlator-output-dft-2'),
  //  dftcorrelator3:    memory.allocate('correlator-output-dft-3'),
  //  dftcorrelator4:    memory.allocate('correlator-output-dft-4'),
  //  dftcorrelator5:    memory.allocate('correlator-output-dft-5'),
  //  cdftcorrelator:    memory.allocate('correlator-output-dft-complex'),
  //  cdftcorrelator:    memory.allocate('correlator-output-dft-complex'),
  //  xco1:              memory.allocate('correlator-tmp-1'),
  //  xco2:              memory.allocate('correlator-tmp-2'),
  //  xco3:              memory.allocate('correlator-tmp-3'),
  //  xco4:              memory.allocate('correlator-tmp-4'),
  //  xco5:              memory.allocate('correlator-tmp-5'),
  //  xco6:              memory.allocate('correlator-tmp-6'),
  //  xco7:              memory.allocate('correlator-tmp-7'),
  //  xco8:              memory.allocate('correlator-tmp-8'),
  //}
  //window.webfx.blocks = blocks
  //webfx.views.signals = signalsView.create(blocks)
  webfx.views.scene   = sceneView.create()
  //wavegen.addJob(blocks.waveSourceA, [
  //  1.0,   0.0,   0.0,  0.0,
  //  8.0,  0.0,   0.0,  0.0,
  //  0.0,   0.0,   0.0,  0.0
  //])
  //wavegen.addJob(blocks.waveSourceB, [
  //  1.0,  0.0,   0.0,  0.0,
  // 13.0,   0.0,   0.0,  0.0,
  //  0.0,   0.0,   0.0,  0.0
  //])
  //wavegen.addJob(blocks.waveSourceC, [
  //  1.0,   0.0,   0.0,  0.0,
  // 17.0,   0.0,   0.0,  0.0,
  //  0.0,   0.0,   0.0,  0.0
  //])
  //wavegen.addJob(blocks.waveSourceD, [
  //  1.0,   0.0,   0.0,  0.0,
  //  19.0,  0.0,   0.0,  0.0,
  //  0.0,   0.0,   0.0,  0.0
  //])
  ////wavemix.addJob(blocks.waveSourceA, blocks.waveSourceB, blocks.waveReceiverA, 0, 0.3, 0.7, 0.7)

  //wavemix.addJob(
  //  blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
  //  blocks.waveReceiverA,
  //  [0.0, 0.5, 0.5, 0.3],
  //  [0.7, 0.7, 0.7, 0.7]
  //)
  //wavemix.addJob(
  //  blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
  //  blocks.waveReceiverB,
  //  [0.0, 0.3, 0.6, 0.5],
  //  [0.7, 0.7, 0.7, 0.7]
  //)
  //wavemix.addJob(
  //  blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
  //  blocks.waveReceiverC,
  //  [0.0, 0.4, 0.1, 0.7],
  //  [0.7, 0.7, 0.7, 0.7]
  //)
  //wavemix.addJob(
  //  blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
  //  blocks.waveReceiverD,
  //  [0.0, 0.6, 0.15, 0.38],
  //  [0.7, 0.7, 0.7, 0.7]
  //)
  //wavemix.addJob(
  //  blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
  //  blocks.waveReceiverE,
  //  [0.0, 0.36, 0.74, 0.82],
  //  [0.7, 0.7, 0.7, 0.7]
  //)
  //wavemix.addJob(
  //  blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
  //  blocks.waveReceiverF,
  //  [0.0, 0.22, 0.42, 0.95],
  //  [0.7, 0.7, 0.7, 0.7]
  //)
  //wavemix.addJob(
  //  blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
  //  blocks.waveReceiverG,
  //  [0.0, 0.69, 0.08, 0.19],
  //  [0.7, 0.7, 0.7, 0.7]
  //)
  //wavemix.addJob(
  //  blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
  //  blocks.waveReceiverH,
  //  [0.0, 0.13, 0.88, 0.41],
  //  [0.7, 0.7, 0.7, 0.7]
  //)

  //dft.addJob(blocks.waveSourceA, blocks.dftSourceA,     blocks.cdftSourceA, config.DFT_FMAX)
  //dft.addJob(blocks.waveSourceB, blocks.dftSourceB,     blocks.cdftSourceB, config.DFT_FMAX)
  //dft.addJob(blocks.waveSourceC, blocks.dftSourceC,     blocks.cdftSourceC, config.DFT_FMAX)
  //dft.addJob(blocks.waveSourceD, blocks.dftSourceD,     blocks.cdftSourceD, config.DFT_FMAX)
  //dft.addJob(blocks.waveReceiverA, blocks.dftReceiverA, blocks.cdftReceiverA, config.DFT_FMAX)
  //dft.addJob(blocks.waveReceiverB, blocks.dftReceiverB, blocks.cdftReceiverB, config.DFT_FMAX)
  //dft.addJob(blocks.waveReceiverC, blocks.dftReceiverC, blocks.cdftReceiverC, config.DFT_FMAX)
  //dft.addJob(blocks.waveReceiverD, blocks.dftReceiverD, blocks.cdftReceiverD, config.DFT_FMAX)
  //dft.addJob(blocks.waveReceiverE, blocks.dftReceiverE, blocks.cdftReceiverE, config.DFT_FMAX)
  //dft.addJob(blocks.waveReceiverF, blocks.dftReceiverF, blocks.cdftReceiverF, config.DFT_FMAX)
  //dft.addJob(blocks.waveReceiverG, blocks.dftReceiverG, blocks.cdftReceiverG, config.DFT_FMAX)
  //dft.addJob(blocks.waveReceiverH, blocks.dftReceiverH, blocks.cdftReceiverH, config.DFT_FMAX)
  //xcorrelate.addJob(blocks.cdftReceiverA, blocks.cdftReceiverB, blocks.xco1, 512)
  //xcorrelate.addJob(blocks.cdftReceiverC, blocks.cdftReceiverD, blocks.xco2, 512)
  //xcorrelate.addJob(blocks.cdftReceiverE, blocks.cdftReceiverF, blocks.xco3, 512)
  //xcorrelate.addJob(blocks.cdftReceiverG, blocks.cdftReceiverH, blocks.xco4, 512)
  //xcorrelate.addJob(blocks.xco1, blocks.xco2, blocks.xco5, 512)
  //xcorrelate.addJob(blocks.xco3, blocks.xco4, blocks.xco6, 512)
  //xcorrelate.addJob(blocks.xco5, blocks.xco6, blocks.xco7, 512)
  
  function frame() {
    if(!webfx.state.paused) {
      let currentTime = performance.now() / 1000
      let t = cumulativeTime + (currentTime - referenceTime)
      let dt = t - webfx.state.globalTime
      sceneView.update(t, dt)
      webfx.state.globalTime = t
    }
    if(webfx.state.dirty) {
      renderFrame()
    }
    setTimeout(dispatch.flush, 0)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
  
  let fly = false
  window.addEventListener('keydown', async ev => {
    switch(ev.code) {
    case 'Space':
      //if(webfx.state.paused) unpause()
      //else                   pause()
      post(actions.SetCameraFlyaround(!fly))
      fly = !fly
      ev.preventDefault()
      ev.stopPropagation()
      break
    }
  })

  document.querySelector('#wrapper').appendChild(webfx.views.scene)
  webfx.currentView = webfx.views.scene
  webfx.currentViewName = 'scene'
  elements.tabs[webfx.currentViewName].classList.add('active')
  setTimeout(() => { webfx.state.dirty = true }, 0)
  webfx.views.scene.addEventListener('dirty', () => { webfx.state.dirty = true })
  setView('scene')

  post(actions.CreateAntenna())
  post(actions.CreateAntenna())
  post(actions.CreateAntenna())
  post(actions.CreateAntenna())
  post(actions.SetAntennaPosition(0, [ 1, 0,  0]))
  post(actions.SetAntennaPosition(1, [-1, 0,  0]))
  post(actions.SetAntennaPosition(2, [ 0, 0,  1]))
  post(actions.SetAntennaPosition(3, [ 0, 0, -1]))
})

function setView(viewName) {
  const view = webfx.views[viewName]
  webfx.currentView.replaceWith(view)
  elements.tabs[webfx.currentViewName].classList.remove('active')
  webfx.currentView = view
  webfx.currentViewName = viewName
  requestAnimationFrame(renderFrame)
  elements.tabs[webfx.currentViewName].classList.add('active')
}

function renderFrame() {
  gpu.renderFrame(webfx.state.globalTime)
  webfx.state.dirty = false
}

function pause() {
  webfx.state.paused = true
  let currentTime = performance.now() / 1000
  cumulativeTime += currentTime - referenceTime
}

function unpause() {
  webfx.state.paused = false
  referenceTime = performance.now() / 1000
}

