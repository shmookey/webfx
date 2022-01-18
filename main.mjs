import * as wavegen    from './wavegen.mjs'
import * as waverender from './waverender.mjs'
import * as wavemix    from './wavemix.mjs'
import * as gpu        from './gpu.mjs'
import * as dft        from './dft.mjs'
import * as dftrender  from './dftrender.mjs'
import * as config     from './config.mjs'
import * as memory     from './memory.mjs'
import * as xcorrelate from './xcorrelate.mjs'
import './waveelement.mjs'

const overlayHTML = `
<div class='row'>
  <div class='row-name'>Sources</div>
  <wave-view id='source-A' view-id='0' dft-view-id='0'>Source 1</wave-view>
  <wave-view id='source-B' view-id='1' dft-view-id='1'>Source 2</wave-view>
  <wave-view id='source-C' view-id='2' dft-view-id='2'>Source 3</wave-view>
  <wave-view id='source-D' view-id='3' dft-view-id='3'>Source 4</wave-view>
</div>
<div class='row'>
  <div class='row-name'>Receivers</div>
  <wave-view id='receiver-A' view-id='4' dft-view-id='4'>Receiver A</wave-view>
  <wave-view id='receiver-B' view-id='5' dft-view-id='5'>Receiver B</wave-view>
  <wave-view id='receiver-C' view-id='6' dft-view-id='6'>Receiver C</wave-view>
</div>
<div class='row'>
  <div class='row-name'>Correlator</div>
  <wave-view id='correlator-output' dft-view-id='7'>A * B</wave-view>
  <wave-view id='correlator-output-2' dft-view-id='8'>A * C</wave-view>
  <wave-view id='correlator-output-3' dft-view-id='9'>(A * B) * (A * C)</wave-view>
</div>
`

window.addEventListener('load', async () => {
  window.webfx = {memory}
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
    dftSourceA:    memory.allocate('dft-source-a'),
    dftSourceB:    memory.allocate('dft-source-b'),
    dftSourceC:    memory.allocate('dft-source-c'),
    dftSourceD:    memory.allocate('dft-source-d'),
    dftReceiverA:  memory.allocate('dft-receiver-a'),
    dftReceiverB:  memory.allocate('dft-receiver-b'),
    dftReceiverC:  memory.allocate('dft-receiver-c'),
    cdftSourceA:    memory.allocate('dft-source-a-complex'),
    cdftSourceB:    memory.allocate('dft-source-b-complex'),
    cdftSourceC:    memory.allocate('dft-source-c-complex'),
    cdftSourceD:    memory.allocate('dft-source-d-complex'),
    cdftReceiverA:  memory.allocate('dft-receiver-a-complex'),
    cdftReceiverB:  memory.allocate('dft-receiver-b-complex'),
    cdftReceiverC:  memory.allocate('dft-receiver-c-complex'),
    correlator:    memory.allocate('correlator-output'),
    dftcorrelator:    memory.allocate('correlator-output-dft'),
    dftcorrelator2:    memory.allocate('correlator-output-dft-2'),
    dftcorrelator3:    memory.allocate('correlator-output-dft-3'),
    cdftcorrelator:    memory.allocate('correlator-output-dft-complex'),
    cdftcorrelator:    memory.allocate('correlator-output-dft-complex'),
  }
  window.webfx.blocks = blocks
  const overlayElement = document.createElement('div')
  overlayElement.id = 'overlay'
  overlayElement.innerHTML = overlayHTML
  document.querySelector('#wrapper').appendChild(overlayElement)
  //wavegen.addJob(blocks.waveSourceA, [
  //  0.4,   0.5,   0.5,  0.7,
  //  5.0,  10.0,  15.0,  2.0,
  //  0.0,   0.0,   0.0,  0.0
  //])
  //wavegen.addJob(blocks.waveSourceB, [
  //   0.3,   0.7,   0.4,   0.2,
  //   1.0,   2.0,   5.0,  20.0,
  //  -0.2,   0.0,   0.0,   0.0
  //])
  wavegen.addJob(blocks.waveSourceA, [
    0.9,   0.0,   0.0,  0.0,
    13.0,   0.0,   0.0,  0.0,
    0.0,   0.0,   0.0,  0.0
  ])
  wavegen.addJob(blocks.waveSourceB, [
    0.45,  0.0,   0.0,  0.0,
   11.0,   0.0,   0.0,  0.0,
    0.0,   0.0,   0.0,  0.0
  ])
  wavegen.addJob(blocks.waveSourceC, [
    0.7,   0.0,   0.0,  0.0,
   17.0,   0.0,   0.0,  0.0,
    0.0,   0.0,   0.0,  0.0
  ])
  wavegen.addJob(blocks.waveSourceD, [
    1.0,   0.0,   0.0,  0.0,
    19.0,   0.0,   0.0,  0.0,
    0.0,   0.0,   0.0,  0.0
  ])
  //wavemix.addJob(blocks.waveSourceA, blocks.waveSourceB, blocks.waveReceiverA, 0, 0.3, 0.7, 0.7)

  wavemix.addJob(
    blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
    blocks.waveReceiverA,
    [0.0, 0.5, 0.3, 0.7],
    [0.7, 0.7, 0.7, 0.7]
  )
  wavemix.addJob(
    blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
    blocks.waveReceiverB,
    [0.0, 0.3, 0.5, 0.4],
    [0.7, 0.7, 0.7, 0.7]
  )
  wavemix.addJob(
    blocks.waveSourceA, blocks.waveSourceB, blocks.waveSourceC, blocks.waveSourceD,
    blocks.waveReceiverC,
    [0.0, 0.4, 0.7, 0.3],
    [0.7, 0.7, 0.7, 0.7]
  )

  dft.addJob(blocks.waveSourceA, blocks.dftSourceA,     blocks.cdftSourceA, config.DFT_FMAX)
  dft.addJob(blocks.waveSourceB, blocks.dftSourceB,     blocks.cdftSourceB, config.DFT_FMAX)
  dft.addJob(blocks.waveSourceC, blocks.dftSourceC,     blocks.cdftSourceC, config.DFT_FMAX)
  dft.addJob(blocks.waveSourceD, blocks.dftSourceD,     blocks.cdftSourceD, config.DFT_FMAX)
  dft.addJob(blocks.waveReceiverA, blocks.dftReceiverA, blocks.cdftReceiverA, config.DFT_FMAX)
  dft.addJob(blocks.waveReceiverB, blocks.dftReceiverB, blocks.cdftReceiverB, config.DFT_FMAX)
  dft.addJob(blocks.waveReceiverC, blocks.dftReceiverC, blocks.cdftReceiverC, config.DFT_FMAX)
  //xcorrelate.addJob(blocks.cdftReceiverA, blocks.cdftReceiverB, blocks.dftcorrelator, 512)
  xcorrelate.addJob(blocks.cdftReceiverA, blocks.cdftReceiverB, blocks.dftcorrelator, 512)
  xcorrelate.addJob(blocks.cdftReceiverA, blocks.cdftReceiverC, blocks.dftcorrelator2, 512)
  xcorrelate.addJob(blocks.dftcorrelator, blocks.dftcorrelator2, blocks.dftcorrelator3, 512)
  //xcorrelate.addJob(blocks.waveReceiverA, blocks.waveReceiverB, blocks.correlator, 512)
  //dft.addJob(blocks.correlator, blocks.dftcorrelator, blocks.cdftcorrelator, config.DFT_FMAX)
  waverender.setColour(0, [0.2, 0.8, 0.1])
  waverender.setColour(1, [0.4, 0.4, 1.0])
  waverender.setColour(2, [0.9, 0.6, 0.3])
  waverender.setColour(3, [1.0, 0.4, 1.0])
  waverender.setColour(4, [0.4, 0.6, 0.7])
  waverender.setColour(5, [0.9, 0.2, 0.4])
  waverender.setColour(6, [0.3, 0.9, 0.6])
  waverender.setColour(7, [0.5, 0.3, 0.9])
  waverender.setSource(0, blocks.waveSourceA.slot)
  waverender.setSource(1, blocks.waveSourceB.slot)
  waverender.setSource(2, blocks.waveSourceC.slot)
  waverender.setSource(3, blocks.waveSourceD.slot)
  waverender.setSource(4, blocks.waveReceiverA.slot)
  waverender.setSource(5, blocks.waveReceiverB.slot)
  waverender.setSource(6, blocks.waveReceiverC.slot)
  waverender.setSource(7, blocks.correlator.slot)
  dftrender.setSource(0, blocks.cdftSourceA.slot)
  dftrender.setSource(1, blocks.cdftSourceB.slot)
  dftrender.setSource(2, blocks.cdftSourceC.slot)
  dftrender.setSource(3, blocks.cdftSourceD.slot)
  dftrender.setSource(4, blocks.cdftReceiverA.slot)
  dftrender.setSource(5, blocks.cdftReceiverB.slot)
  dftrender.setSource(6, blocks.cdftReceiverC.slot)
  dftrender.setSource(7, blocks.dftcorrelator.slot)
  dftrender.setSource(8, blocks.dftcorrelator2.slot)
  dftrender.setSource(9, blocks.dftcorrelator3.slot)
})


