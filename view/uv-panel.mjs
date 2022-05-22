import * as actions from '/model/action.mjs'

const html = `
<div class='title-bar'>
  <div class='title'>UV Plane</div>
</div>
<div class='window-content'>
  <svg
      xmlns='http://www.w3.org/2000/svg'
      width='300px'
      height='300px'
      viewBox='-5 -5 10 10'
      width="24px"
  >
    <g stroke='#404050' stroke-width='0.1'>
      <line class='axis-line x-axis' x1='-5' y1='0' x2='5' y2='0' />
      <line class='axis-line y-axis' x1='0' y1='-5' x2='0' y2='5' />
    </g>
    <text x='4.4' y='-0.2' class='axis-label'>U</text>
    <text y='-4.5' x='-0.5' class='axis-label'>V</text>
    <g class='baselines'>
    </g>
  </svg>
</div>
<div class='control-bar'>
<span class='num-baselines'>0</span>&nbsp;baselines (0 disabled)
</div>
`

const elements = {
  view:      null,
  baselines: {},
}
let numBaselines = 0

export function init() {
  elements.view           = document.createElement('div')
  elements.view.id        = 'uv-panel'
  elements.view.innerHTML = html
  elements.view.classList.add('window', 'floating')

  elements.svg = elements.view.querySelector('svg')
  elements.baselineGroup = elements.svg.querySelector('.baselines')
  elements.numBaselines = elements.view.querySelector('.num-baselines')

  return elements.view
}

export function apply(effect) {
  switch(effect.type) {
  case 'BaselineCreated':
    return addBaseline(effect.descriptor)
  case 'BaselineMoved':
    return moveBaseline(effect.id, effect.position)
  case 'BaselineDeleted':
    return removeBaseline(effect.id)
  default:
    console.log(`[uv-panel] Ignoring effect: ${effect.type}`)
  }
}

function addBaseline(baseline) {
  const element = createSVGElement('circle')
  element.setAttribute('cx', baseline.vec[0])
  element.setAttribute('cy', baseline.vec[1])
  element.classList.add('baseline')
  elements.baselineGroup.append(element)
  elements.baselines[baseline.entityID] = {baseline, element}
  numBaselines++
  elements.numBaselines.textContent = numBaselines.toString()
}

function moveBaseline(entityID, vec) {
  const {element} = elements.baselines[entityID]
  element.setAttribute('cx', vec[0])
  element.setAttribute('cy', vec[1])
}

function removeBaseline(entityID) {
  const {element} = elements.baseslines[entityID]
  baseline.remove()
  delete elements.baselines[entityID]
  numBaselines--
  elements.numBaselines.textContent = numBaselines.toString()
}

function createSVGElement(tagName) {
  return document.createElementNS('http://www.w3.org/2000/svg', tagName)
}

