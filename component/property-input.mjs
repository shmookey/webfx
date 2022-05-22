class PropertyInputElement extends HTMLInputElement {
  hasFocus = false
  committedValue = ''
  unit = null
  baseValue = null

  constructor() {
    super()
    this.committedValue = this.value
    this.addEventListener('focus', () => {
      this.hasFocus = true
      this.value = this.baseValue
      this.select()
    })
    this.addEventListener('blur', () => {
      this.confirmInput()
      this.hasFocus = false
    })
    this.addEventListener('keydown', ev => {
      switch(ev.key) {
      case 'Enter':
        this.confirmInput()
        this.blur()
        break
      case 'Escape':
        this.discardInput()
        break
      }
      ev.stopPropagation()
    })
  }

  confirmInput() {
    if(!this.unit)
      return

    const rawValue = this.value.trim()
    const index    = rawValue.indexOf(this.unit)
    const quantity = index == -1 
                   ? rawValue
                   : rawValue.slice(0, index).trim()

    this.value = `${quantity}${this.unit}`
    this.baseValue = quantity
  }

  discardInput() {
    this.blur()
    this.value = this.committedValue
  }

  static get observedAttributes() {
    return ['value', 'unit']
  }

  attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
    case 'value':
      this.committedValue = newVal
      this.value = newVal
      this.confirmInput()
      break
    case 'unit':
      this.unit = newVal
      break
    }
  }


}

customElements.define('property-input', PropertyInputElement, {extends: 'input'})



