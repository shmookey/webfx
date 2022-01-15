import * as wavegen    from './wavegen.mjs'
import * as waverender from './waverender.mjs'
import * as wavemix    from './wavemix.mjs'
import * as gpu        from './gpu.mjs'
import * as dft        from './dft.mjs'
import * as dftrender  from './dftrender.mjs'
import * as config     from './config.mjs'
import './waveelement.mjs'

const overlayHTML = `
<div class='row'>
  <div class='row-name'>Signal Sources</div>
  <wave-view id='source-A' view-id='0' dft-view-id='0'>Source A</wave-view>
  <wave-view id='source-B' view-id='1' dft-view-id='1'>Source B</wave-view>
</div>
<div class='row'>
  <div class='row-name'>Signal Receivers</div>
  <wave-view id='receiver-A' view-id='2' dft-view-id='2'>Receiver A</wave-view>
  <wave-view id='receiver-B' view-id='3' dft-view-id='3'>Receiver B</wave-view>
</div>
<div class='row'>
  <div class='row-name'>Correlator</div>
</div>
`

window.addEventListener('load', async () => {
  const canvas = document.querySelector('canvas')
  await gpu.init(canvas)
  const overlayElement = document.createElement('div')
  overlayElement.id = 'overlay'
  overlayElement.innerHTML = overlayHTML
  document.querySelector('#wrapper').appendChild(overlayElement)
  wavegen.setCoefficients(0, [
    0.4,   0.5,   0.5,   0.7,
    5,     10,     15,   2,
    0,     0,     0,   0
  ])
  wavegen.setCoefficients(1, [
    0.3,   0.7,   0.4,   0.2,
    1,     2,     5,   20,
    -0.2,     0,     0,   0
  ])
  wavemix.addJob(0, 1, 2, 0,   0.3, 0.7, 0.7)
  wavemix.addJob(0, 1, 3, 0.2, 0.9, 0.7, 0.7)
  dft.addJob(0, 0, config.DFT_FMAX)
  dft.addJob(1, 1, config.DFT_FMAX)
  dft.addJob(2, 2, config.DFT_FMAX)
  dft.addJob(3, 3, config.DFT_FMAX)
  waverender.setColour(0, [0.2, 1.0, 0.2])
  waverender.setColour(1, [0.4, 0.4, 1.0])
  waverender.setColour(2, [0.2, 1.0, 1.0])
  waverender.setColour(3, [1.0, 0.4, 1.0])
  waverender.setSource(0, 0)
  //waverender.setSource(1, 1)
  //waverender.setSource(2, 1)
  //waverender.setSource(3, 3)
  //dftrender.setSource(0, 0)
  //dftrender.setSource(1, 1)
  //dftrender.setSource(2, 2)
  //dftrender.setSource(3, 3)

})


