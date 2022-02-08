import * as actions from '/model/action.mjs'

const html = `
<div class='title-bar'>
  <div class='title'>Objects</div>
</div>
<div class='window-content'>
  <div class='group-heading sources'>
    <div class='group-name'>Sources</div>
    <button class='add right enabled' data-tooltip='Add source'></button>
  </div>
  <item-select class='sources'></item-select>
  <div class='group-heading antennas'>
    <div class='group-name'>Antennas</div>
    <button class='add right enabled' data-tooltip='Add antenna'></button>
  </div>
  <item-select class='antennas'></item-select>
</div>
<div class='control-bar'>
  <button class='duplicate left' data-tooltip='Duplicate object'></button>
  <button class='delete right' data-tooltip='Delete object'></button>
</div>
`

const elements = {}
let selected = null

export function init() {
  elements.view = document.createElement('div')
  elements.view.classList.add('window', 'floating', 'source-list')
  elements.view.id = 'objects-panel'
  elements.view.innerHTML = html
  elements.btnAddSource   = elements.view.querySelector('.sources button.add')
  elements.btnAddAntenna  = elements.view.querySelector('.antennas button.add')
  elements.btnDelete      = elements.view.querySelector('button.delete')
  elements.btnDuplicate   = elements.view.querySelector('button.duplicate')
  elements.sourceList     = elements.view.querySelector('item-select.sources')
  elements.antennaList    = elements.view.querySelector('item-select.antennas')
  elements.btnAddSource.addEventListener('click', () => post(actions.CreateSource()))
  elements.btnAddAntenna.addEventListener('click', () => post(actions.CreateAntenna()))
  elements.sourceList.addEventListener('select', ev => {
    elements.antennaList.clearSelection(false)
    selected = ev.detail
    updateControlButtons()
  })
  elements.antennaList.addEventListener('select', ev => {
    elements.sourceList.clearSelection(false)
    selected = ev.detail
    updateControlButtons()
  })
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
    break
  case 'SourceDeleted':
    elements.sourceList.remove(effect.id)
    break
  case 'AntennaCreated':
    elements.antennaList.add(effect.descriptor)
    break
  case 'AntennaDeleted':
    elements.antennaList.remove(effect.id)
    break
  }
}


