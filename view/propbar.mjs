import * as actions from '/model/action.mjs'

const html = `
  <div class='section camera'>
    <div class='section-label'>Camera</div>
    <div class='prop button-group camera-mode'>
      <button class='enabled selected landscape' data-tooltip='View landscape (L)'></button>
      <button class='enabled map' data-tooltip='View map (M)'></button>
      <button class='enabled sky' data-tooltip='View sky (S)'></button>
    </div>
    <button class='flyaround toggle enabled' data-tooltip='Rotate camera around selection'></button>
    <button class='resetpos action enabled' data-tooltip='Reset camera orientation'></button>
    <button class='unfocus action enabled' data-tooltip='Look at origin'></button>
    <div class='prop button-group drag-mode'>
      <button class='enabled selected drag-pan' data-tooltip='Drag mode: Pan'></button>
      <button class='enabled drag-look' data-tooltip='Drag mode: Look (CTRL)'></button>
      <button class='enabled drag-pivot' data-tooltip='Drag mode: Pivot (ALT)'></button>
    </div>
  </div>
  <div class='section identifier'>
    <div class='section-label'>Selection</div>
    <button class='lookat action enabled' data-tooltip='Look at selection'></button>
    <colour-box class='prop'></colour-box>
    <div class='entity-name'></div>
  </div>
  <div class='section signal'>
    <div class='prop prop-coefficients'>Edit signal</div>
  </div>
  <div class='section position'>
    <div class='prop prop-x'>
      <label>X</label>
      <input is='property-input' type='text' unit='m' />
    </div>
    <div class='prop prop-y'>
      <label>Y</label>
      <input is='property-input' type='text' unit='m' />
    </div>
    <div class='prop prop-z'>
      <label>Z</label>
      <input is='property-input' type='text' unit='m' />
    </div>
  </div>
  <div class='section uv'>
    <div class='section-label'>UV Coverage</div>
    <div class='prop prop-wavelength'>
      <label>λ</label>
      <input is='property-input' type='text' unit='mm' />
    </div>
    <div class='prop prop-h0'>
      <label>h₀</label>
      <input is='property-input' type='text' unit='h' />
    </div>
    <div class='prop prop-h1'>
      <label>h₁</label>
      <input is='property-input' type='text' unit='h' />
    </div>
  </div>
  <div class='section aperture'>
    <div class='section-label'>Beam</div>
    <div class='prop prop-dec'>
      <label>δ</label>
      <input is='property-input' type='text' unit='°' />
    </div>
    <div class='prop prop-ra'>
      <label>α</label>
      <input is='property-input' type='text' unit='°' />
    </div>
    <div class='prop prop-beamwidth'>
      <label>Ω</label>
      <input is='property-input' type='text' unit='°' />
    </div>
  </div>
`

let elements = {}
const viewState = {
  visible: false,
  descriptor: null,
  entityColour: null,
  entityName: null,
  entityHasCoefficients: false,
  entityX: null,
  entityY: null,
  entityZ: null,
  flyaroundEnabled: false,
  cameraMode: 'landscape',
}

export function init() {
  const elem     = document.createElement('div')
  elem.id        = 'prop-bar'
  elem.innerHTML = html

  elements.view              = elem
  elements.colourBox         = elem.querySelector('colour-box')
  elements.entityName        = elem.querySelector('.entity-name')
  elements.editCoefficients  = elem.querySelector('.prop-coefficients span')
  elements.inputX            = elem.querySelector('.prop-x input')
  elements.inputY            = elem.querySelector('.prop-y input')
  elements.inputZ            = elem.querySelector('.prop-z input')
  elements.propX             = elem.querySelector('.prop-x')
  elements.propY             = elem.querySelector('.prop-y')
  elements.propZ             = elem.querySelector('.prop-z')
  elements.propCoefficients  = elem.querySelector('.prop-coefficients')
  elements.cameraSection     = elem.querySelector('.section.camera')
  elements.signalSection     = elem.querySelector('.section.signal')
  elements.positionSection   = elem.querySelector('.section.position')
  elements.identifierSection = elem.querySelector('.section.identifier')
  elements.uvSection         = elem.querySelector('.section.uv')
  elements.apertureSection   = elem.querySelector('.section.aperture')
  elements.camModeLandscape  = elem.querySelector('.camera-mode .landscape')
  elements.camModeMap        = elem.querySelector('.camera-mode .map')
  elements.camModeSky        = elem.querySelector('.camera-mode .sky')
  elements.camFlyaround      = elem.querySelector('button.flyaround')
  elements.camResetPosition  = elem.querySelector('button.resetpos')
  elements.camReorient       = elem.querySelector('button.unfocus')
  elements.camLookAt         = elem.querySelector('button.lookat')
  elements.dragModePan       = elem.querySelector('.drag-mode .drag-pan')
  elements.dragModeLook      = elem.querySelector('.drag-mode .drag-look')
  elements.dragModePivot     = elem.querySelector('.drag-mode .drag-pivot')
  elements.inputWavelength   = elem.querySelector('.prop-wavelength input')
  elements.inputDEC          = elem.querySelector('.prop-dec input')
  elements.inputRA           = elem.querySelector('.prop-ra input')
  elements.inputH0           = elem.querySelector('.prop-h0 input')
  elements.inputH1           = elem.querySelector('.prop-h1 input')
  elements.inputBeamwidth    = elem.querySelector('.prop-beamwidth input')
 
  elements.inputWavelength.value = webfx.model.aperture.wavelength.toString()
  elements.inputDEC.value        = webfx.model.aperture.declination.toString()
  elements.inputRA.value         = webfx.model.aperture.ascension.toString()
  elements.inputH0.value         = webfx.model.aperture.h0.toString()
  elements.inputH1.value         = webfx.model.aperture.h1.toString()
  elements.inputBeamwidth.value  = webfx.model.aperture.beamwidth.toString()
  elements.inputWavelength.confirmInput()
  elements.inputDEC.confirmInput()
  elements.inputRA.confirmInput()
  elements.inputH0.confirmInput()
  elements.inputH1.confirmInput()
  elements.inputBeamwidth.confirmInput()
 
  elements.inputX.addEventListener('change', submitChange('x'))
  elements.inputY.addEventListener('change', submitChange('y'))
  elements.inputZ.addEventListener('change', submitChange('z'))
  elements.camModeLandscape.addEventListener('click',
    () => post(actions.SetCameraMode('landscape')))
  elements.camModeMap.addEventListener('click', 
    () => post(actions.SetCameraMode('map')))
  elements.camModeSky.addEventListener('click',
    () => post(actions.SetCameraMode('sky')))
  elements.camFlyaround.addEventListener('click',
    () => post(actions.SetCameraFlyaround(!viewState.flyaroundEnabled)))
  elements.camReorient.addEventListener('click',
    () => post(actions.ResetCameraOrientation()))
  elements.camResetPosition.addEventListener('click',
    () => post(actions.ResetCameraPosition()))
  elements.camLookAt.addEventListener('click',
    () => post(actions.SetCameraTarget(viewState.descriptor.type, viewState.descriptor.id)))
  elements.dragModePan.addEventListener('click',
    () => post(actions.SetDragMode('pan')))
  elements.dragModeLook.addEventListener('click',
    () => post(actions.SetDragMode('look')))
  elements.dragModePivot.addEventListener('click',
    () => post(actions.SetDragMode('pivot')))
  
  useDefaultControls()
  return elem
}

export function useSource(descriptor) {
  viewState.descriptor = descriptor

  elements.propCoefficients.style.display = 'block'
  elements.propX.style.display            = 'block'
  elements.propY.style.display            = 'block'
  elements.propZ.style.display            = 'block'
  elements.cameraSection.classList.add('enabled')
  elements.positionSection.classList.add('enabled')
  elements.identifierSection.classList.add('enabled')
  elements.signalSection.classList.add('enabled')
  elements.uvSection.classList.remove('enabled')
  elements.apertureSection.classList.remove('enabled')

  elements.entityName.textContent = descriptor.name
  elements.colourBox.setAttribute('colour', descriptor.colour)
  elements.inputX.setAttribute('value', descriptor.position[0].toString())
  elements.inputY.setAttribute('value', descriptor.position[1].toString())
  elements.inputZ.setAttribute('value', descriptor.position[2].toString())
}

export function useAntenna(descriptor) {
  viewState.descriptor = descriptor
  elements.propCoefficients.style.display = 'none'
  elements.propX.style.display = 'block'
  elements.propY.style.display = 'none'
  elements.propZ.style.display = 'block'
  elements.cameraSection.classList.add('enabled')
  elements.positionSection.classList.add('enabled')
  elements.identifierSection.classList.add('enabled')
  //elements.apertureSection.classList.remove('enabled')
  elements.signalSection.classList.remove('enabled')
  //elements.uvSection.classList.remove('enabled')
  elements.colourBox.setAttribute('colour', descriptor.colour)
  elements.entityName.textContent = descriptor.name
  elements.inputX.setAttribute('value', descriptor.position[0].toString())
  elements.inputZ.setAttribute('value', descriptor.position[2].toString())
}

export function useDefaultControls() {
  elements.propCoefficients.style.display = 'none'
  elements.propX.style.display = 'none'
  elements.propY.style.display = 'none'
  elements.propZ.style.display = 'none'
  elements.cameraSection.classList.add('enabled')
  elements.apertureSection.classList.add('enabled')
  elements.uvSection.classList.add('enabled')
  elements.signalSection.classList.remove('enabled')
  elements.positionSection.classList.remove('enabled')
  elements.identifierSection.classList.remove('enabled')
}

function submitChange(prop) {
  return function(ev) {
    const descriptor = viewState.descriptor
    const val = Number.parseFloat(ev.srcElement.baseValue)
    if(descriptor.type == 'source') {
      if(prop == 'x')      post(actions.SetSourceX(descriptor.id, val))
      else if(prop == 'y') post(actions.SetSourceY(descriptor.id, val))
      else if(prop == 'z') post(actions.SetSourceZ(descriptor.id, val))
    } else if(descriptor.type == 'antenna') {
      if(prop == 'x')      post(actions.SetAntennaX(descriptor.id, val))
      else if(prop == 'z') post(actions.SetAntennaZ(descriptor.id, val))
    } 
  }
}

export function apply(effect) {
  switch(effect.type) {
  case 'SourceMoved':
    if(viewState.descriptor?.type != 'source' || viewState.descriptor.id != effect.id) {
      break
    }
    elements.inputX.setAttribute('value', effect.position[0].toString())
    elements.inputY.setAttribute('value', effect.position[1].toString())
    elements.inputZ.setAttribute('value', effect.position[2].toString())
    break
  case 'AntennaMoved':
    if(viewState.descriptor?.type != 'antenna' || viewState.descriptor.id != effect.id) {
      break
    }
    elements.inputX.setAttribute('value', effect.position[0].toString())
    elements.inputZ.setAttribute('value', effect.position[2].toString())
    break
  case 'CameraModeChanged':
    if(effect.mode == 'landscape') elements.camModeLandscape.classList.add('selected')
    else                           elements.camModeLandscape.classList.remove('selected')
    if(effect.mode == 'map')       elements.camModeMap.classList.add('selected')
    else                           elements.camModeMap.classList.remove('selected')
    if(effect.mode == 'sky')       elements.camModeSky.classList.add('selected')
    else                           elements.camModeSky.classList.remove('selected')
    viewState.cameraMode = effect.mode
    break
  case 'CameraFlyaroundEnabled':
    elements.camFlyaround.classList.add('selected')
    viewState.flyaroundEnabled = true
    break
  case 'CameraFlyaroundDisabled':
    elements.camFlyaround.classList.remove('selected')
    viewState.flyaroundEnabled = false
    break
  case 'DragModeChanged':
    if(effect.mode == 'pan')       elements.dragModePan.classList.add('selected')
    else                           elements.dragModePan.classList.remove('selected')
    if(effect.mode == 'look')      elements.dragModeLook.classList.add('selected')
    else                           elements.dragModeLook.classList.remove('selected')
    if(effect.mode == 'pivot')     elements.dragModePivot.classList.add('selected')
    else                           elements.dragModePivot.classList.remove('selected')
    viewState.dragMode = effect.mode
    break
  default:
    console.info(`[view.propbar] Ignoring effect: ${effect.type}`)
  }

}


