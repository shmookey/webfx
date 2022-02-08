class PropertyInputElement extends HTMLInputElement {
  hasFocus = false
  committedValue = ''

  constructor() {
    super()
    this.committedValue = this.value
    this.addEventListener('focus', () => {
      this.hasFocus = true
      this.select()
    })
    this.addEventListener('blur', () => {
      this.hasFocus = false
    })
    this.addEventListener('keydown', ev => {
      switch(ev.key) {
      case 'Enter':
        this.blur()
        break
      case 'Escape':
        this.blur()
        this.value = this.committedValue
        break
      }
    })
  }

  static get observedAttributes() {
    return ['value']
  }

  attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
    case 'value':
      this.committedValue = newVal
      this.value = newVal
      break
    }
  }


}

customElements.define('property-input', PropertyInputElement, {extends: 'input'})



