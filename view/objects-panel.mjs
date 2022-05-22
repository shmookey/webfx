import * as actions from '/model/action.mjs'

const html = `
<div class='title-bar'>
  <div class='title'>Objects</div>
</div>
<div class='window-content scrollable grow'>
  <div class='group sources'>
    <div class='group-heading sources'>
      <button class='expand-group'></button>
      <div class='group-name'>Sources (<span class='source-count'>0</span>)</div>
      <button class='add right enabled' data-tooltip='Add source'></button>
    </div>
  <item-select class='sources'></item-select>
  </div>
  <div class='group antennas'>
    <div class='group-heading antennas'>
      <button class='expand-group'></button>
      <div class='group-name'>Antennas (<span class='antenna-count'>0</span>)</div>
      <button class='add right enabled' data-tooltip='Add antenna'></button>
    </div>
    <item-select class='antennas'></item-select>
  </div>
</div>
<div class='control-bar'>
  <button class='duplicate left' data-tooltip='Duplicate object'></button>
  <button class='delete right' data-tooltip='Delete object'></button>
</div>
`

const elements = {}
let selected = null
let expandSources = true
let expandAntennas = true
let sourceCount = 0
let antennaCount = 0

export function init() {
  elements.view = document.createElement('div')
  elements.view.classList.add('window', 'floating', 'source-list')
  elements.view.id = 'objects-panel'
  elements.view.innerHTML = html

  elements.btnAddSource      = elements.view.querySelector('.sources button.add')
  elements.btnAddAntenna     = elements.view.querySelector('.antennas button.add')
  elements.btnDelete         = elements.view.querySelector('button.delete')
  elements.btnDuplicate      = elements.view.querySelector('button.duplicate')
  elements.sourceGroup       = elements.view.querySelector('.group.sources')
  elements.btnExpandSources  = elements.view.querySelector('.group.sources  .expand-group')
  elements.sourceList        = elements.view.querySelector('.group.sources  item-select')
  elements.sourceCount       = elements.view.querySelector('.source-count')
  elements.antennaGroup      = elements.view.querySelector('.group.antennas')
  elements.btnExpandAntennas = elements.view.querySelector('.group.antennas .expand-group')
  elements.antennaList       = elements.view.querySelector('.group.antennas item-select')
  elements.antennaCount      = elements.view.querySelector('.antenna-count')

  elements.btnAddSource.addEventListener('click',      () => post(actions.CreateSource()))
  elements.btnAddAntenna.addEventListener('click',     () => post(actions.CreateAntenna()))
  elements.btnExpandSources.addEventListener('click',  toggleExpandSources)
  elements.btnExpandAntennas.addEventListener('click', toggleExpandAntennas)
  elements.sourceList.addEventListener('select', onSelect)
  elements.antennaList.addEventListener('select', onSelect)
  //elements.sourceList.addEventListener('select', ev => {
  //  elements.antennaList.clearSelection(false)
  //  selected = ev.detail
  //  updateControlButtons()
  //})
  //elements.antennaList.addEventListener('select', ev => {
  //  elements.sourceList.clearSelection(false)
  //  selected = ev.detail
  //  updateControlButtons()
  //})
  elements.sourceList.addEventListener('togglevisibility', ev => 
    post(actions.SetSourceEnabled(ev.detail.id, !ev.detail.enabled)))
  elements.sourceList.addEventListener('toggleannotations', ev => 
    post(actions.SetSourceAnnotations(ev.detail.id, !ev.detail.annotations)))
  elements.antennaList.addEventListener('togglevisibility', ev => 
    post(actions.SetAntennaEnabled(ev.detail.id, !ev.detail.enabled)))
  elements.antennaList.addEventListener('toggleannotations', ev => 
    post(actions.SetAntennaAnnotations(ev.detail.id, !ev.detail.annotations)))
  elements.btnDelete.addEventListener('click', () => {
    if(selected == null) return
    else if(selected.type == 'source')  post(actions.DeleteSource(selected.id))
    else if(selected.type == 'antenna') post(actions.DeleteAntenna(selected.id))
  })
  elements.btnDuplicate.addEventListener('click', () => {
    if(selected == null) return
    else if(selected.type == 'source')  post(actions.CloneSource(selected.id))
    else if(selected.type == 'antenna') post(actions.CloneAntenna(selected.id))
  })

  return elements.view
}

function onSelect(ev) {
  if(ev.detail == null) {
    post(actions.DeselectEntity())
  } else {
    post(actions.SelectEntity(ev.detail))
  }
  ev.stopPropagation()
}

function applySelect(entity) {
  if(entity.type == 'source') {
    elements.antennaList.clearSelection(false)
    elements.sourceList.setSelection(entity.entityID, false)
  } else {
    elements.sourceList.clearSelection(false)
    elements.antennaList.setSelection(entity.entityID, false)
  }
  selected = entity
  updateControlButtons()
}

function applyDeselect() {
  elements.antennaList.clearSelection(false)
  elements.sourceList.clearSelection(false)
  selected = null
  updateControlButtons()
}

function toggleExpandSources() {
  if(expandSources) {
    elements.sourceGroup.classList.add('collapsed')
    expandSources = false
  } else {
    elements.sourceGroup.classList.remove('collapsed')
    expandSources = true
  }
}

function toggleExpandAntennas() {
  if(expandAntennas) {
    elements.antennaGroup.classList.add('collapsed')
    expandAntennas = false
  } else {
    elements.antennaGroup.classList.remove('collapsed')
    expandAntennas = true
  }
}

function updateControlButtons() {
  if(selected == null) {
    elements.btnDelete.classList.remove('enabled')
    elements.btnDuplicate.classList.remove('enabled')
  } else {
    elements.btnDelete.classList.add('enabled')
    elements.btnDuplicate.classList.add('enabled')
  }
}

export function apply(effect) {
  switch(effect.type) {
  case 'SourceCreated':
    elements.sourceList.add(effect.descriptor)
    sourceCount++
    elements.sourceCount.textContent = sourceCount
    break
  case 'SourceDeleted':
    elements.sourceList.remove(effect.id)
    sourceCount--
    elements.sourceCount.textContent = sourceCount
    break
  case 'SourceEnabled':
    elements.sourceList.updateVisibility(effect.id, true)
    break
  case 'SourceDisabled':
    elements.sourceList.updateVisibility(effect.id, false)
    break
  case 'SourceSetAnnotations':
    elements.sourceList.updateAnnotations(effect.id, effect.enabled)
    break
  case 'AntennaCreated':
    elements.antennaList.add(effect.descriptor)
    antennaCount++
    elements.antennaCount.textContent = antennaCount
    break
  case 'AntennaDeleted':
    elements.antennaList.remove(effect.id)
    antennaCount--
    elements.antennaCount.textContent = antennaCount
    break
  case 'AntennaEnabled':
    elements.antennaList.updateVisibility(effect.id, true)
    break
  case 'AntennaDisabled':
    elements.antennaList.updateVisibility(effect.id, false)
    break
  case 'AntennaSetAnnotations':
    elements.antennaList.updateAnnotations(effect.id, effect.enabled)
    break
  case 'EntitySelected':
    applySelect(effect.entity)
    break
  case 'EntityDeselected':
    applyDeselect()
    break
  default:
    console.log(`[view.objectsPanel] Ignoring effect: ${effect.type}`)
    break
  }
}


