import * as gpu              from '/gpu.mjs'
import * as actions          from '/model/action.mjs'
import * as config           from '/config.mjs'
import * as grid             from '/render/grid.mjs'
import * as renderObject     from '/render/object.mjs'
import * as renderGlobe      from '/render/globe.mjs'
import * as renderSkybox     from '/render/skybox.mjs'
import * as meshes           from '/render/meshes.mjs'
import * as propbarView      from '/view/propbar.mjs'
import * as objectsPanelView from '/view/objects-panel.mjs'
import * as uvPanelView      from '/view/uv-panel.mjs'
import {Entity}              from '/render/entity.mjs'
import {AntennaEntity}       from '/render/antenna.mjs'
import {mat4,vec3}           from '/gl-matrix/dist/esm/index.js'

const {abs, sqrt, asin, acos, atan2, sin, tan, cos} = Math

let device              = null
let projectionMatrix    = mat4.create()
let invProjectionMatrix = mat4.create()
let viewMatrix          = mat4.create()
let globalsData         = new Float32Array(4*4*4 + 4*4*4 + 3*4)
let globalsBuffer       = null
let upVector            = vec3.fromValues(0,1,0)
let cameraFocus         = vec3.fromValues(config.CAMERA_FOCUS)
let gridJob             = null
let skyboxJob           = null
let tempMatrix          = mat4.create()
let viewElement         = null
let elems               = []
let jobs                = {antennas: {}, sources: {}}
let canvas              = null

const DRAG_STATE_IDLE     = 0,
      DRAG_STATE_PENDING  = 1,
      DRAG_STATE_DRAGGING = 2

const viewState = {
  aspect:                  1,
  cameraPosition:          new Float32Array([0, 2.0, 2]),
  cameraTarget:            new Float32Array([0, 0.0, 0]),
  cameraRelPosition:       new Float32Array([0, 2.0, 2]),
  cameraMode:              'landscape',
  cameraFlyaroundRotation: null,
  cameraFlyaroundOrigin:   null,
  cameraFlyaroundStart:    null,
  cameraFlyaroundEnabled:  false,
  animationTime:           0,
  lightSourcePosition:     [0, 3, 0],
  gridWidth:               12,
  gridDepth:               12,
  gridTickSpacing:         0.05,
  gridLineThickness:       0.005,
  dragging:                false,
  dragMode:                'pan',
  selected:                null,
  selection:               null,
  dragThreshold:           -1,
  dragState:               DRAG_STATE_IDLE,
  draggingEntity:          false,
}

const viewHTML = `
<div id='rendered-area'></div>
<render-target id='skybox'></render-target>
<render-target id='grid'></render-target>
`

export async function init(deviceRef, aspect, presentationFormat, canvasElement) {
  webfx.scene = viewState
  device = deviceRef
  viewState.aspect = aspect
  canvas = canvasElement
  usePerspectiveProjection()
  globalsData.set(viewState.lightSourcePosition, 32)
  globalsBuffer = device.createBuffer({
    size:  globalsData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })
  webfx.globalsBuffer = globalsBuffer
  webfx.device = device
  await AntennaEntity.init()
  await grid.init(deviceRef, presentationFormat, globalsBuffer)
  await renderSkybox.init(deviceRef, presentationFormat, globalsBuffer)
  await renderObject.init(deviceRef, presentationFormat, globalsBuffer)
  await renderGlobe.init(deviceRef, presentationFormat, globalsBuffer)
  skyboxJob = renderSkybox.create()
  gridJob = grid.create(
    viewState.gridWidth,
    viewState.gridDepth,
    viewState.gridTickSpacing,
    viewState.gridLineThickness,
  )
}

export function create(device) {
  viewElement = document.createElement('div')
  viewElement.id = 'scene-view'
  viewElement.classList.add('top-level-view')
  viewElement.innerHTML = viewHTML
  elems = {
    skybox:       viewElement.querySelector('#skybox'),
    grid:         viewElement.querySelector('#grid'),
    renderedArea: viewElement.querySelector('#rendered-area'),
    propBar:      propbarView.init(),
    objectsPanel: objectsPanelView.init(),
    uvPanel:      uvPanelView.init(),
  }

  elems.renderedArea.addEventListener('mousedown',   onMouseDown)
  elems.renderedArea.addEventListener('mouseup',     onMouseUp)
  elems.renderedArea.addEventListener('mousemove',   onMouseMove)
  document.addEventListener('keydown',               onKeyDown)
  document.addEventListener('keyup',                 onKeyUp)
  elems.renderedArea.addEventListener('contextmenu', e => e.preventDefault())

  viewElement.append(elems.objectsPanel, elems.uvPanel)
  viewElement.prepend(elems.propBar)
  elems.skybox.renderer = skyboxJob
  elems.grid.renderer = gridJob
  viewElement.apply = apply
  updateCamera()
  return viewElement  
}

function select(entity) {
  const obj = entity.type == 'source'
            ? jobs.sources[entity.id]
            : jobs.antennas[entity.id]

  if(viewState.selected && viewState.selected != obj)
    viewState.selected.job.selected = false
  viewState.selected = obj
  viewState.selected.job.selected = true

  if(entity.type == 'source')
    propbarView.useSource(entity)
  else
    propbarView.useAntenna(entity)

  emitDirty()
}

function deselect() {
  if(viewState.selected)
    viewState.selected.job.selected = false
  viewState.selected = null
  propbarView.useDefaultControls()
  emitDirty()
}

function setDragMode(mode) {
  // Don't change the drag mode during a drag operation
  if(viewState.dragState != DRAG_STATE_IDLE)
    return

  if(mode == 'look' || mode == 'pivot' || mode == 'pan') {
    viewState.dragMode = mode
  } else {
    throw 'Invalid drag mode'
  }
}

function swivelCamera(subject, object, dx, dy) {
  { // up-down axis
    const dist = sqrt((object[0]-subject[0])**2 
                    + (object[1]-subject[1])**2
                    + (object[2]-subject[2])**2)
    let rise = object[1] - subject[1]
    let yAngle = asin(rise / dist)
    yAngle += dy/500
    rise = sin(yAngle) * dist
    object[1] = subject[1] + rise
  } 
  { // left-right axis
    const dist = sqrt((object[0]-subject[0])**2 
                    + (object[2]-subject[2])**2)
    let xRise = object[0] - subject[0]
    let zRise = object[2] - subject[2]
    let xAngle = atan2(xRise, zRise)
    xAngle += dx/700
    xRise = sin(xAngle) * dist
    zRise = cos(xAngle) * dist
    object[0] = subject[0] + xRise
    object[2] = subject[2] + zRise
  }
  return object
}

export function update(time, delta) {
  viewState.animationTime = time
  if(viewState.cameraFlyaroundEnabled) {
    updateCamera()
  }
}

export function apply(effect) {
  switch(effect.type) {
  case 'SourceCreated':
    objectsPanelView.apply(effect)
    addSource(effect.descriptor)
    break
  case 'SourceMoved':
    propbarView.apply(effect)
    jobs.sources[effect.id].job.setPosition(effect.position)
    emitDirty()
    break
  case 'SourceDeleted':
    objectsPanelView.apply(effect)
    removeSource(effect.id)
    break
  case 'SourceEnabled':
    objectsPanelView.apply(effect)
    jobs.sources[effect.id].job.setEnabled(true)
    emitDirty()
    break
  case 'SourceDisabled':
    objectsPanelView.apply(effect)
    jobs.sources[effect.id].job.setEnabled(false)
    emitDirty()
    break
  case 'SourceSetAnnotations':
    objectsPanelView.apply(effect)
    break
  case 'AntennaCreated':
    objectsPanelView.apply(effect)
    addAntenna(effect.descriptor)
    break
  case 'AntennaMoved':
    propbarView.apply(effect)
    jobs.antennas[effect.id].job.setPosition(effect.position)
    emitDirty()
    break
  case 'AntennaDeleted':
    objectsPanelView.apply(effect)
    removeAntenna(effect.id)
    break
  case 'AntennaEnabled':
    objectsPanelView.apply(effect)
    jobs.antennas[effect.id].job.setEnabled(true)
    emitDirty()
    break
  case 'AntennaDisabled':
    objectsPanelView.apply(effect)
    jobs.antennas[effect.id].job.setEnabled(false)
    emitDirty()
    break
  case 'AntennaSetAnnotations':
    objectsPanelView.apply(effect)
    jobs.antennas[effect.id].job.annotated = effect.enabled
    emitDirty()
    break
  case 'CameraModeChanged':
    propbarView.apply(effect)
    setCameraMode(effect.mode)
    break
  case 'CameraFlyaroundEnabled':
    propbarView.apply(effect)
    enableCameraFlyaround(false)
    break
  case 'CameraFlyaroundDisabled':
    propbarView.apply(effect)
    disableCameraFlyaround()
    break
  case 'CameraOrientationReset':
    resetCameraOrientation()
    updateCamera()
    break
  case 'CameraPositionReset':
    resetCameraPosition()
    updateCamera()
    break
  case 'CameraTargetSet':
    setCameraTarget(effect.entityType, effect.id)
    break
  case 'AspectChanged':
    viewState.aspect = effect.aspect
    updateProjection()
    updateCamera()
    break
  case 'DragModeChanged':
    propbarView.apply(effect)
    setDragMode(effect.mode)
    break
  case 'BaselineCreated':
  case 'BaselineMoved':
  case 'BaselineDeleted':
    uvPanelView.apply(effect)
    break
  case 'EntitySelected':
    objectsPanelView.apply(effect)
    select(effect.entity)
    break
  case 'EntityDeselected':
    objectsPanelView.apply(effect)
    deselect()
    break
  default:
    console.info(`[view.scene] Ignoring effect: ${effect.type}`)
  }
}

function addAntenna(descriptor) {
  const job = new AntennaEntity(descriptor) 
  const element = document.createElement('render-target')
  element.renderer = job
  viewElement.appendChild(element)
  jobs.antennas[descriptor.id] = {job, descriptor, element}
  emitDirty()
}

function addSource(descriptor) {
  const job = renderGlobe.create(
    meshes.globe(4, 16),
    [1.0, 1.0, 1.0, 1],
    descriptor.position,
    [1.0, 1.0, 1.0],
  )
  const element = document.createElement('render-target')
  element.renderer = job
  viewElement.appendChild(element)
  jobs.sources[descriptor.id] = {job, descriptor, element}
  emitDirty()
}

function removeAntenna(id) {
  const entry = jobs.antennas[id]
  entry.element.remove()
  entry.job.destroy()
  emitDirty()
}

function removeSource(id) {
  const entry = jobs.sources[id]
  entry.element.remove()
  entry.job.destroy()
  emitDirty()
}

function emitDirty() {
  const ev = new CustomEvent('dirty')
  viewElement.dispatchEvent(ev)
}

function updateCamera() {
  let up = vec3.fromValues(0,1,0)
  if(viewState.cameraMode == 'map') up.set([0,0,-1])

  if(viewState.cameraFlyaroundEnabled) {
    const t = viewState.animationTime
    const start = viewState.cameraFlyaroundStart
    viewState.cameraFlyaroundRotation = ((t - start) / 10) % (2*Math.PI)
    if(viewState.cameraMode == 'landscape') {
      const matrix = mat4.create()
      mat4.fromTranslation(matrix, viewState.cameraTarget)
      mat4.rotateY(matrix, matrix, viewState.cameraFlyaroundRotation)
      vec3.transformMat4(viewState.cameraPosition, viewState.cameraFlyaroundOrigin, matrix)
    } else if(viewState.cameraMode == 'map') {
      vec3.rotateY(up, up, [0,0,0], viewState.cameraFlyaroundRotation)
    }
  }
  //const dx = viewState.cameraPosition[0] - viewState.cameraTarget[0]
  //const dz = viewState.cameraPosition[2] - viewState.cameraTarget[2]
  //const up = dx == 0 && dz == 0 ? [0,1,0.00001] : [0,1,0]
  mat4.lookAt(
    viewMatrix,
    viewState.cameraPosition,
    viewState.cameraTarget,
    up
  )
  globalsData.set(viewMatrix, 0)
  device.queue.writeBuffer(globalsBuffer, 0, globalsData.buffer)

  emitDirty()
}

function enableCameraFlyaround(reset=true) {
  viewState.cameraFlyaroundEnabled = true
  viewState.cameraFlyaroundStart   = viewState.animationTime
  viewState.cameraFlyaroundOrigin  = viewState.cameraRelPosition.slice()
  if(reset)
    viewState.cameraFlyaroundRotation = 0
}

function disableCameraFlyaround() {
  viewState.cameraFlyaroundEnabled  = false
  viewState.cameraFlyaroundStart    = null
  //viewState.cameraFlyaroundRotation = null
  //viewState.cameraFlyaroundOrigin   = null
}

function setCameraMode(mode, force=false) {
  if(!force && viewState.cameraMode == mode) return
  else viewState.cameraMode = mode

  switch(mode) {
  case 'landscape':
    viewState.cameraRelPosition.set([0, 1, 2])
    setCameraTarget('coords', [0, 0, 0])
    usePerspectiveProjection()
    break
  case 'map':
    viewState.cameraRelPosition.set([0, 2.5, 0])
    setCameraTarget('coords', [0, 0, 0])
    useOrthographicProjection()
    break
  case 'sky':
    viewState.cameraRelPosition.set([1, -1, 0])
    setCameraTarget('coords', [0, 2, 0])
    usePerspectiveProjection()
    break
  default:
    throw `Invalid camera mode: ${mode}`
  }

  resetCameraPosition()
  if(viewState.cameraFlyaroundEnabled)
    enableCameraFlyaround(false)
  updateCamera()
}

/** Reset both the position and direction of the camera. */
function resetCameraOrientation() {
  viewState.cameraTarget.set([0,0,0])
  resetCameraPosition()
}

/** Make sure to call updateCamera afterwards. */
function resetCameraPosition() {
  if(viewState.cameraMode == 'sky') {
    viewState.cameraPosition.set([0.01, 0.1, 0])
  } else {
    viewState.cameraPosition.set([
      viewState.cameraTarget[0] + viewState.cameraRelPosition[0],
      viewState.cameraTarget[1] + viewState.cameraRelPosition[1],
      viewState.cameraTarget[2] + viewState.cameraRelPosition[2],
    ])
  }
}

function usePerspectiveProjection() {
  mat4.perspectiveZO(
    projectionMatrix,
    (2 * Math.PI) / 5,
    viewState.aspect,
    0.25,
    100.0
  )
  globalsData.set(projectionMatrix, 16)
}

function useOrthographicProjection() {
  mat4.orthoZO(
    projectionMatrix,
     -5,
      5,
     -5 / viewState.aspect,
      5 / viewState.aspect,
    0.1,
    100,
  )
  globalsData.set(projectionMatrix, 16)
}

function updateProjection() {
  if(viewState.cameraMode == 'landscape')
    usePerspectiveProjection()
  else if(viewState.cameraMode == 'map')
    useOrthographicProjection()
  else
    usePerspectiveProjection()
}

function setCameraPosition(coords) {
  viewState.cameraPosition.set(coords)
  updateCamera()
}

function setCameraTarget(type, id, keepRelativePosition=true) {
  let pos = null

  switch(type) {
  case 'antenna':
    pos = jobs.antennas[id].descriptor.position
    break
  case 'source':
    pos = jobs.sources[id].descriptor.position
    break
  case 'coords':
    pos = id
    break
  default:
    throw `Invalid camera target: ${type}`
  }

  viewState.cameraTarget.set(pos)
  if(keepRelativePosition) {
    resetCameraPosition()
  }
  updateCamera()
}

function setCameraRelPosition(position) {
  
}

/* 
 *
 * UI events
 *
 */


/** Handle the mousedown event on the scene.

Dragging and clicking are distinguished by mouse movement. In both cases, the
mousedown event fires first. At this point we set the `dragThreshold` value to
a small number, representing a number of pixels of mouse movement required to
start a drag operation. The mousemove event decrements it by the sum of
movements in both axes. If it reaches zero, a drag operation begins. If a
mouseup event occurs first, it is treated as a click.
*/
async function onMouseDown(ev) {
  viewState.dragThreshold = 5
  viewState.dragState     = DRAG_STATE_PENDING
  const id = await gpu.getEntityAt(ev.x, ev.y)
  if(id == -1) {
    viewState.draggingEntity = false
  } else {
    viewState.draggingEntity = true
    post(actions.SelectEntity(id))
  }
}

/** Handle a click event on the scene.

Clicking and dragging an entity both have the effect of selecting it, so the
only behaviour special to clicking is deselection. Selection is implemented
anyway, since there isn't really any cost to it and it may be useful in certain
cases such as with synthetic events.

See the documentation for onMouseDown for more information about how mouse
events are handled.
*/
async function onClick(ev) {
  viewState.dragThreshold = -1
  viewState.dragState     = DRAG_STATE_IDLE

  const id = await gpu.getEntityAt(ev.x, ev.y)
  if(id == -1)
    post(actions.DeselectEntity())
  else
    post(actions.SelectEntity(id))
}

/** Handle the mouseup event on the scene.

See the documentation for onMouseDown for how mouse events are handled.
*/
function onMouseUp(ev) {
  if(viewState.dragState != DRAG_STATE_DRAGGING)
    onClick(ev)
  else
    endDrag()
}

/** Handle the mousemove event on the scene.

See the documentation for onMouseDown for how mouse events are handled.
*/
function onMouseMove(ev) {
  if(viewState.dragState == DRAG_STATE_PENDING) {
    viewState.dragThreshold -= abs(ev.movementX) + abs(ev.movementY)
    if(viewState.dragThreshold <= 0)
      beginDrag(ev)
  } else if(viewState.dragState == DRAG_STATE_DRAGGING) {
    drag(ev)
  }
}

/** Begin a drag operation. 

See the documentation for onMouseDown for how mouse events are handled.
*/
function beginDrag(ev) {
  viewState.dragThreshold = -1
  viewState.dragState     = DRAG_STATE_DRAGGING
  elems.renderedArea.requestPointerLock()
  if((ev.ctrlKey || ev.buttons == 2) && viewState.dragMode != 'look') {
    post(actions.SetDragMode('look'))
  } else if(ev.altKey && viewState.dragMode != 'pivot') {
    post(actions.SetDragMode('pivot'))
  }
}

/** End a drag operation. 

See the documentation for onMouseDown for how mouse events are handled.
*/
function endDrag() {
  viewState.dragThreshold = -1
  viewState.dragState     = DRAG_STATE_IDLE
  document.exitPointerLock()
}

/** Handle drag movement.

See the documentation for onMouseDown for how mouse events are handled.
*/
function drag(ev) {
  const [dx,dy] = [ev.movementX, ev.movementY]
  let target = viewState.cameraTarget.slice()
  const position = viewState.cameraPosition.slice()
  if(viewState.draggingEntity) {
    dragSelected(ev)
  } else if(viewState.dragMode == 'look') {
    setCameraTarget('coords', swivelCamera(position, target, dx, dy), false)
  } else if(viewState.dragMode == 'pivot') {
    setCameraPosition(swivelCamera(target, position, dx, dy))
  } else if(viewState.dragMode == 'pan') {
    const [cdx, cdy, cdz] = [target[0]-position[0], target[1]-position[1], target[2]-position[2]]
    if(viewState.cameraMode == 'landscape') {
      const a = atan2(cdx, cdz)
      const mx = (dy*sin(a) + dx*cos(a))/100
      const mz = (dy*cos(a) + dx*sin(a))/100
      position[0] += mx
      target[0]   += mx
      position[2] += mz
      target[2]   += mz
      setCameraTarget('coords', target, false)
      setCameraPosition(position)
    } else if(viewState.cameraMode == 'map') {
      const a = atan2(cdx, -cdz)
      const mx = (dy*sin(a) + dx*cos(a))/100
      const mz = (dy*cos(a) + dx*sin(a))/100
      position[0] += mx
      target[0]   += mx
      position[2] += mz
      target[2]   += mz
      setCameraTarget('coords', target, false)
      setCameraPosition(position)
    }
  }
}

function dragSelected(ev) {
  const entity = viewState.selected.descriptor
  if(!entity.type == 'antenna')
    return

  const [mx, my] = [ev.movementX, ev.movementY]
  const targetPos = entity.position.slice()
  const cameraDir = [
    viewState.cameraTarget[0] - viewState.cameraPosition[0],
    viewState.cameraTarget[2] - viewState.cameraPosition[2],
  ]
  const a = atan2(cameraDir[1], cameraDir[0])
  const dx = (mx*sin(a) + my*cos(a))/100
  const dz = (mx*cos(a) + my*sin(a))/100
  targetPos[0] -= dx
  targetPos[2] -= dz

  post(actions.SetAntennaPosition(entity.id, targetPos))
}

function onKeyDown(ev) {
  switch(ev.key) {
  case 'Control':
    post(actions.SetDragMode('look'))
    break
  case 'Alt':
    post(actions.SetDragMode('pivot'))
    break
  case 'M':
  case 'm':
    post(actions.SetCameraMode('map'))
    break
  case 'L':
  case 'l':
    post(actions.SetCameraMode('landscape'))
    break
  case 'S':
  case 's':
    post(actions.SetCameraMode('sky'))
    break
  }
}

function onKeyUp(ev) {
  switch(ev.key) {
  case 'Control':
  case 'Alt':
    post(actions.SetDragMode('pan'))
    break
  }
}
