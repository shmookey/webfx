const css = `
#box {
  height:   16px;
  width:    16px;
  border:   1px solid #404050;
  position: relative;
}
`

class ColourBoxElement extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'})
    this.box = document.createElement('div')
    this.box.id = 'box'
    const style = document.createElement('style')
    style.textContent = css
    this.shadowRoot.append(style, this.box)
  }

  static get observedAttributes() {
    return ['colour']
  }

  attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
    case 'colour':
      let colour = 
        newVal.includes(',') ? JSON.parse(`[${newVal}]`)
                             : newVal
      this.setColour(colour)
      break
    }
  }

  setColour(x) {
    if(typeof x == 'string') {
      this.box.style.backgroundColor = x
    } else if(Array.isArray(x)) { 
      this.box.style.backgroundColor = rgbToHex(normaliseRGB(x))
    } else {
      throw 'Invalid colour'
    }
  }

}

const normaliseRGB = rgb => rgb.map(c => Math.max(0,Math.min(255,Math.floor(c*256))))
const rgbToHex = rgb => `#${rgb.map(c => c.toString(16).padStart(2,'0')).join('')}`

customElements.define('colour-box', ColourBoxElement)



