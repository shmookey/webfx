
const css = `

#contents {
  display:        flex;
  flex-direction: column;
  font-size:      12px;
  background:     #101020;
  user-select:    none;
}
.item {
  height:  26px;
  display: flex;
}
/*.item:nth-child(even) {
  background: #202030;
}*/
.item.selected {
  background: #303040;
}
.item.selected colour-box {
  outline: 1px solid white;
}
.item .colour-area {
  width:           40px;
  display:         flex;
  align-items:     center;
  justify-content: center;
}
.item .colour-box {
  height:   16px;
  width:    16px;
  border:   1px solid #404050;
  position: relative;
}
.item .name-area {
  display:         flex;
  align-items:     center;
  justify-content: center;
  flex-grow:       1;
}
.item input {
  background: none;
  border:     none;
  outline:    0;
  color:      white;
  cursor:     default;
}
.item input:focus {
  cursor:     auto;
  outline:    auto;
}
`

const elementHTML = `
<style>${css}</style>
<div id='contents'></div>
<template id='item-template'>
  <div class='item'>
    <div class='colour-area'>
      <colour-box></colour-box>
    </div>
    <div class='name-area'>
      <input type='text' value='' />
    </div>
  </div>
</template>
`.trim()


class ItemSelectElement extends HTMLElement {
  #entries      = null
  #itemTemplate = null
  #contents     = null
  #selected     = null

  constructor() {
    super()
    this.#entries = []
    this.attachShadow({mode: 'open'})
    const tmpElement = document.createElement('div')
    tmpElement.innerHTML = elementHTML
    this.#contents = tmpElement.querySelector('#contents')
    this.#itemTemplate = tmpElement.querySelector('#item-template')
    this.shadowRoot.append(...tmpElement.children)
  }

  static get observedAttributes() {
    return []
  }

  attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
    }
  }

  set selection(id) {
    if(id == null) {
      return this.clearSelection(true)
    } 
    if(this.#selected) {
      this.#selected.element.classList.remove('selected')
    }
    const entry = this.#entries[id]
    entry.element.classList.add('selected')
    this.#selected = entry
    const event = new CustomEvent('select', {
      bubbles: true,
      detail: {id, type: entry.descriptor.type }
    })
    this.dispatchEvent(event)
  }

  clearSelection(emitDeselection) {
    if(!this.#selected) {
      return
    }
    this.#selected.element.classList.remove('selected')
    this.#selected = null
    if(emitDeselection) {
      const event = new CustomEvent('select', {
        bubbles: true,
        detail: null,
      })
      this.dispatchEvent(event)
    }
  }

  add(descriptor) {
    const clone        = this.#itemTemplate.content.cloneNode(true)
    const itemElement  = clone.querySelector('.item')
    const nameArea     = clone.querySelector('.name-area')
    const inputElement = clone.querySelector('input')
    const colourBox    = clone.querySelector('colour-box')
    const id           = descriptor.id
    itemElement.dataset.id = id
    inputElement.value = descriptor.name
    colourBox.setAttribute('colour', descriptor.colour)
    itemElement.addEventListener('click', () => {
      if(!this.#selected) {
        this.selection = id
      } else if(this.#selected.id == id) {
        this.clearSelection(true)
      } else {
        this.selection = id
      }
    })
    nameArea.awaitingDblClick = false
    inputElement.disabled = true
    nameArea.addEventListener('click', () => {
      if(nameArea.awaitingDblClick) {
        inputElement.disabled = false
        inputElement.select()
        nameArea.awaitingDblClick = false
      } else {
        nameArea.awaitingDblClick = true
        setTimeout(() => { nameArea.awaitingDblClick = false }, 500)
      }
    })
    inputElement.addEventListener('blur', () => {
      inputElement.disabled = true
      window.getSelection().removeAllRanges()
    })
    this.#contents.append(itemElement)
    this.#entries[id] = {
      descriptor, id,
      element: itemElement,
    }
  }

  remove(id) {
    const entry = this.#entries[id]
    if(this.#selected != null && this.#selected.id == id) {
      this.clearSelection(true)
    }
    entry.element.remove()
    delete this.#entries[id]
  }

}

customElements.define('item-select', ItemSelectElement)


