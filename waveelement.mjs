import * as waverender from './waverender.mjs'
import * as dftrender from './dftrender.mjs'

const css = `
#wrapper {
  position: relative;
}
`

class WaveViewElement extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'})
    const slot = document.createElement('slot')
    const style = document.createElement('style')
    style.textContent = css
    this.shadowRoot.append(style, slot)
    const resizeObserver = new ResizeObserver(() => this.updateRect())
    resizeObserver.observe(this)
  }
  static get observedAttributes() {
    return ['view-id','wave-id','dft-view-id']
  }
  connectedCallback() {
    if(!this.isConnected) return
    this.updateRect()
  }
  attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
      case 'view-id':
        if(this.hasOwnProperty('viewID'))
          throw 'WaveViewElement.prototype.viewID must not be changed'
        this.viewID = Number.parseInt(newVal)
        if(this.isConnected)
          this.updateRect()
        break
      case 'dft-view-id':
        if(this.hasOwnProperty('dftViewID'))
          throw 'WaveViewElement.prototype.dftViewID must not be changed'
        this.dftViewID = Number.parseInt(newVal)
        if(this.isConnected)
          this.updateRect()
        break
    }
  }
  updateRect() {
    const r = this.getBoundingClientRect()
    if(this.hasOwnProperty('viewID'))
      waverender.setPosition(this.viewID, r.x, r.y, r.width, r.height)
    if(this.hasOwnProperty('dftViewID'))
      dftrender.setPosition(this.dftViewID, r.x, r.y, r.width, r.height)
  }
}

customElements.define('wave-view', WaveViewElement)

