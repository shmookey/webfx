import * as wavegen    from './wavegen.mjs'
import * as waverender from './render/wave.mjs'
import * as dftrender  from './render/dft.mjs'
import * as wavemix    from './wavemix.mjs'
import * as gpu        from './gpu.mjs'
import * as dft        from './dft.mjs'
import * as config     from './config.mjs'
import * as memory     from './memory.mjs'
import * as xcorrelate from './xcorrelate.mjs'
import './waveelement.mjs'

const overlayHTML = `
<div class='row'>
  <div class='row-name'>Sources</div>
  <wave-view id='source-A'>Source 1</wave-view>
  <wave-view id='source-B'>Source 2</wave-view>
  <wave-view id='source-C'>Source 3</wave-view>
  <wave-view id='source-D'>Source 4</wave-view>
</div>
<div class='row'>
  <div class='row-name'>Receivers</div>
  <wave-view id='receiver-A'>Receiver A</wave-view>
  <wave-view id='receiver-B'>Receiver B</wave-view>
  <wave-view id='receiver-C'>Receiver C</wave-view>
  <wave-view id='receiver-D'>Receiver D</wave-view>
</div>
<div class='row'>
  <div class='row-name'></div>
  <wave-view id='receiver-E'>Receiver E</wave-view>
  <wave-view id='receiver-F'>Receiver F</wave-view>
  <wave-view id='receiver-G'>Receiver G</wave-view>
  <wave-view id='receiver-H'>Receiver H</wave-view>
</div>
<div class='row'>
  <div class='row-name'>Correlator</div>
  <wave-view id='correlator-output-1'>A٭B</wave-view>
  <wave-view id='correlator-output-2'>C٭D</wave-view>
  <wave-view id='correlator-output-3'>E٭F</wave-view>
  <wave-view id='correlator-output-4'>G٭H</wave-view>
</div>
<div class='row'>
  <div class='row-name'></div>
  <wave-view id='correlator-output-5'>(A٭B)٭(C٭D)</wave-view>
  <wave-view id='correlator-output-6'>(E٭F)٭(G٭H)</wave-view>
  <wave-view id='correlator-output-7'>((A٭B)٭(C٭D))٭((E٭F)٭(G٭H))</wave-view>
</div>
`

window.addEventListener('load', async () => {
  window.webfx = {
    memory,
    state: {
      paused: false,
    },
  }
  const canvas = document.querySelector('canvas')
  await gpu.init(canvas)
  const blocks = {
    waveSourceA:   memory.allocate('wave-source-a'),
    waveSourceB:   memory.allocate('wave-source-b'),
    waveSourceC:   memory.allocate('wave-source-c'),
    waveSourceD:   memory.allocate('wave-source-d'),
    waveReceiverA: memory.allocate('wave-receiver-a'),
    waveReceiverB: memory.allocate('wave-receiver-b'),
    waveReceiverC: memory.allocate('wave-receiver-c'),
    waveReceiverD: memory.allocate('wave-receiver-d'),
    waveReceiverE: memory.allocate('wave-receiver-e'),
    waveReceiverF: memory.allocate('wave-receiver-f'),
    waveReceiverG: memory.allocate('wave-receiver-g'),
    waveReceiverH: memory.allocate('wave-receiver-h'),
    dftSourceA:    memory.allocate('dft-source-a'),
    dftSourceB:    memory.allocate('dft-source-b'),
    dftSourceC:    memory.allocate('dft-source-c'),
    dftSourceD:    memory.allocate('dft-source-d'),
    dftReceiverA:  memory.allocate('dft-receiver-a'),
    dftReceiverB:  memory.allocate('dft-receiver-b'),
    dftReceiverC:  memory.allocate('dft-receiver-c'),
    dftReceiverD:  memory.allocate('dft-receiver-d'),
    dftReceiverE:  memory.allocate('dft-receiver-e'),
    dftReceiverF:  memory.allocate('dft-receiver-f'),
    dftReceiverG:  memory.allocate('dft-receiver-g'),
    dftReceiverH:  memory.allocate('dft-receiver-h'),
    cdftReceiverA:  memory.allocate('cdft-receiver-a'),
    cdftReceiverB:  memory.allocate('cdft-receiver-b'),
    cdftReceiverC:  memory.allocate('cdft-receiver-c'),
    cdftReceiverD:  memory.allocate('cdft-receiver-d'),
    cdftReceiverE:  memory.allocate('cdft-receiver-e'),
    cdftReceiverF:  memory.allocate('cdft-receiver-f'),
    cdftReceiverG:  memory.allocate('cdft-receiver-g'),
    cdftReceiverH:  memory.allocate('cdft-receiver-h'),
    cdftSourceA:    memory.allocate('dft-source-a-complex'),
    cdftSourceB:    memory.allocate('dft-source-b-complex'),
    cdftSourceC:    memory.allocate('dft-source-c-complex'),
    cdftSourceD:    memory.allocate('dft-source-d-complex'),
    correlator:    memory.allocate('correlator-output'),
    dftcorrelator:    memory.allocate('correlator-output-dft'),
    dftcorrelator2:    memory.allocate('correlator-output-dft-2'),
    dftcorrelator3:    memory.allocate('correlator-output-dft-3'),
    dftcorrelator4:    memory.allocate('correlator-output-dft-4'),
    dftcorrelator5:    memory.allocate('correlator-output-dft-5'),
    cdftcorrelator:    memory.allocate('correlator-output-dft-complex'),
    cdftcorrelator:    memory.allocate('correlator-output-dft-complex'),
    xco1:              memory.allocate('correlator-tmp-1'),
    xco2:              memory.allocate('correlator-tmp-2'),
    xco3:              memory.allocate('correlator-tmp-3'),
    xco4:              memory.allocate('correlator-tmp-4'),
    xco5:              memory.allocate('correlator-tmp-5'),
    xco6:              memory.allocate('correlator-tmp-6'),
    xco7:              memory.allocate('correlator-tmp-7'),
    xco8:              memory.allocate('correlator-tmp-8'),
  }
  window.webfx.blocks = blocks
  const overlay = document.createElement('div')
  overlay.id = 'overlay'
  overlay.innerHTML = overlayHTML
  const elems = {
    src1: overlay.querySelector('#source-A'),
    src2: overlay.querySelector('#source-B'),
    src3: overlay.querySelector('#source-C'),
    src4: overlay.querySelector('#source-D'),
    antA: overlay.querySelector('#receiver-A'),
    antB: overlay.querySelector('#receiver-B'),
    antC: overlay.querySelector('#receiver-C'),
    antD: overlay.querySelector('#receiver-D'),
    antE: overlay.querySelector('#receiver-E'),
    antF: overlay.querySelector('#receiver-F'),
    antG: overlay.querySelector('#receiver-G'),
    antH: overlay.querySelector('#receiver-H'),
    xco1: overlay.querySelector('#correlator-output-1'),
    xco2: overlay.querySelector('#correlator-output-2'),
    xco3: overlay.querySelector('#correlator-output-3'),
    xco4: overlay.querySelector('#correlator-output-4'),
    xco5: overlay.querySelector('#correlator-output-5'),
    xco6: overlay.querySelector('#correlator-output-6'),
    xco7: overlay.querySelector('#correlator-output-7'),
  }
  elems.src1.dftRenderer  = dftrender.create(blocks.cdftSourceA,    1)
  elems.src2.dftRenderer  = dftrender.create(blocks.cdftSourceB,    1)
  elems.src3.dftRenderer  = dftrender.create(blocks.cdftSourceC,    1)
  elems.src4.dftRenderer  = dftrender.create(blocks.cdftSourceD,    1)
  elems.antA.dftRenderer  = dftrender.create(blocks.cdftReceiverA,  1)
  elems.antB.dftRenderer  = dftrender.create(blocks.cdftReceiverB,  1)
  elems.antC.dftRenderer  = dftrender.create(blocks.cdftReceiverC,  1)
  elems.antD.dftRenderer  = dftrender.create(blocks.cdftReceiverD,  1)
  elems.antE.dftRenderer  = dftrender.create(blocks.cdftReceiverE,  1)
  elems.antF.dftRenderer  = dftrender.create(blocks.cdftReceiverF,  1)
  elems.antG.dftRenderer  = dftrender.create(blocks.cdftReceiverG,  1)
  elems.antH.dftRenderer  = dftrender.create(blocks.cdftReceiverH,  1)
  elems.xco1.dftRenderer  = dftrender.create(blocks.xco1, 100)
  elems.xco2.dftRenderer  = dftrender.create(blocks.xco2, 100)
  elems.xco3.dftRenderer  = dftrender.create(blocks.xco3, 100)
  elems.xco4.dftRenderer  = dftrender.create(blocks.xco4, 100)
  elems.xco5.dftRenderer  = dftrender.create(blocks.xco5, 4000000)
  elems.xco6.dftRenderer  = dftrender.create(blocks.xco6, 4000000)
  elems.xco7.dftRenderer  = dftrender.create(blocks.xco7, 3000000000000000)
  elems.src1.waveRenderer = waverender.create(blocks.waveSourceA,   [0.2, 0.8, 0.1])
  elems.src2.waveRenderer = waverender.create(blocks.waveSourceB,   [0.4, 0.4, 1.0])
  elems.src3.waveRenderer = waverender.create(blocks.waveSourceC,   [0.9, 0.6, 0.3])
  elems.src4.waveRenderer = waverender.create(blocks.waveSourceD,   [1.0, 0.4, 1.0])
  elems.antA.waveRenderer = waverender.create(blocks.waveReceiverA, [0.4, 0.6, 0.7])
  elems.antB.waveRenderer = waverender.create(blocks.waveReceiverB, [0.9, 0.2, 0.4])
  elems.antC.waveRenderer = waverender.create(blocks.waveReceiverC, [0.3, 0.9, 0.6])
  elems.antD.waveRenderer = waverender.create(blocks.waveReceiverD, [0.3, 0.7, 0.6])
  elems.antE.waveRenderer = waverender.create(blocks.waveReceiverE, [0.4, 0.8, 0.7])
  elems.antF.waveRenderer = waverender.create(blocks.waveReceiverF, [0.2, 0.5, 0.9])
  elems.antG.waveRenderer = waverender.create(blocks.waveReceiverG, [0.4, 0.9, 0.4])
  elems.antH.waveRenderer = waverender.create(blocks.waveReceiverH, [0.4, 0.8, 0.6])
  wavegen.addJob(blocks.waveSourceA, [
    1.0,   0.0,   0.0,  0.0,
    8.0,  0.0,   0.0,  0.0,
    0.0,   0.0,   0.0,  0.0
  ])
  wavegen.addJob(blocks.waveSourceB, [
    1.0,  0.0,   0.0,  0.0,
   13.0,   0.0,   0.0,  0.0,
    0.0,   0.0,   0.0,  0.0
  ])
  wavegen.addJob(blocks.waveSourceC, [
    1.0,   0.0,   0.0,  0.0,
   17.0,   0.0,   0.0,  0.0,
    0.0,   0.0,   0.0,  0.0
  ])
  wavegen.addJob(blocks.waveSourceD, [
    1.0,   0.0,   0.0,  0.0,
    19.0,  0.0,   0.0,  0.0,
    0.0,   0.0,   0.0,  0.0
  ])
  //wavemix.addJob(blocks.waveSourceA, blocks.waveSourceB, blocks.waveReceiverA, 0, 0.3, 0.7, 0.7)

  wavemix.addJob(
    blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
    blocks.waveReceiverA,
    [0.0, 0.5, 0.5, 0.3],
    [0.7, 0.7, 0.7, 0.7]
  )
  wavemix.addJob(
    blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
    blocks.waveReceiverB,
    [0.0, 0.3, 0.6, 0.5],
    [0.7, 0.7, 0.7, 0.7]
  )
  wavemix.addJob(
    blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
    blocks.waveReceiverC,
    [0.0, 0.4, 0.1, 0.7],
    [0.7, 0.7, 0.7, 0.7]
  )
  wavemix.addJob(
    blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
    blocks.waveReceiverD,
    [0.0, 0.6, 0.15, 0.38],
    [0.7, 0.7, 0.7, 0.7]
  )
  wavemix.addJob(
    blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
    blocks.waveReceiverE,
    [0.0, 0.36, 0.74, 0.82],
    [0.7, 0.7, 0.7, 0.7]
  )
  wavemix.addJob(
    blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
    blocks.waveReceiverF,
    [0.0, 0.22, 0.42, 0.95],
    [0.7, 0.7, 0.7, 0.7]
  )
  wavemix.addJob(
    blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
    blocks.waveReceiverG,
    [0.0, 0.69, 0.08, 0.19],
    [0.7, 0.7, 0.7, 0.7]
  )
  wavemix.addJob(
    blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
    blocks.waveReceiverH,
    [0.0, 0.13, 0.88, 0.41],
    [0.7, 0.7, 0.7, 0.7]
  )

  //dft.addJob(blocks.waveSourceA, blocks.dftSourceA,     blocks.cdftSourceA, config.DFT_FMAX)
  //dft.addJob(blocks.waveSourceB, blocks.dftSourceB,     blocks.cdftSourceB, config.DFT_FMAX)
  //dft.addJob(blocks.waveSourceC, blocks.dftSourceC,     blocks.cdftSourceC, config.DFT_FMAX)
  //dft.addJob(blocks.waveSourceD, blocks.dftSourceD,     blocks.cdftSourceD, config.DFT_FMAX)
  dft.addJob(blocks.waveReceiverA, blocks.dftReceiverA, blocks.cdftReceiverA, config.DFT_FMAX)
  dft.addJob(blocks.waveReceiverB, blocks.dftReceiverB, blocks.cdftReceiverB, config.DFT_FMAX)
  dft.addJob(blocks.waveReceiverC, blocks.dftReceiverC, blocks.cdftReceiverC, config.DFT_FMAX)
  dft.addJob(blocks.waveReceiverD, blocks.dftReceiverD, blocks.cdftReceiverD, config.DFT_FMAX)
  dft.addJob(blocks.waveReceiverE, blocks.dftReceiverE, blocks.cdftReceiverE, config.DFT_FMAX)
  dft.addJob(blocks.waveReceiverF, blocks.dftReceiverF, blocks.cdftReceiverF, config.DFT_FMAX)
  dft.addJob(blocks.waveReceiverG, blocks.dftReceiverG, blocks.cdftReceiverG, config.DFT_FMAX)
  dft.addJob(blocks.waveReceiverH, blocks.dftReceiverH, blocks.cdftReceiverH, config.DFT_FMAX)
  xcorrelate.addJob(blocks.cdftReceiverA, blocks.cdftReceiverB, blocks.xco1, 512)
  xcorrelate.addJob(blocks.cdftReceiverC, blocks.cdftReceiverD, blocks.xco2, 512)
  xcorrelate.addJob(blocks.cdftReceiverE, blocks.cdftReceiverF, blocks.xco3, 512)
  xcorrelate.addJob(blocks.cdftReceiverG, blocks.cdftReceiverH, blocks.xco4, 512)
  xcorrelate.addJob(blocks.xco1, blocks.xco2, blocks.xco5, 512)
  xcorrelate.addJob(blocks.xco3, blocks.xco4, blocks.xco6, 512)
  xcorrelate.addJob(blocks.xco5, blocks.xco6, blocks.xco7, 512)
  
  let startTime = performance.now()
  function frame() {
    if(!webfx.state.paused) {
      let t = (performance.now() - startTime)/1000
      gpu.renderFrame(t)
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
  
  window.addEventListener('keydown', async ev => {
    switch(ev.code) {
    case 'Space':
      webfx.state.paused = !webfx.state.paused;
      break
    }
  })

  document.querySelector('#wrapper').appendChild(overlay)
  setTimeout(() => { webfx.state.paused = true }, 100)
})


