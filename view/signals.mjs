import * as waverender from '/render/wave.mjs'
import * as dftrender  from '/render/dft.mjs'
import * as config     from '/config.mjs'

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

export function create(blocks) {
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
  
  return overlay  
}
