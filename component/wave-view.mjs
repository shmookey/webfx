import * as gpu from '/gpu.mjs'

const css = `
#wrapper {
  position: relative;
}
`

class WaveViewElement extends HTMLElement {
  #waveRenderer = null
  #dftRenderer  = null

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
    return []
  }

  get waveRenderer() {
    return this.#waveRenderer
  }

  set waveRenderer(job) {
    if(this.#waveRenderer && this.isConnected) {
      gpu.removeRenderJob(this.#waveRenderer)
    }
    this.#waveRenderer = job
  }

  get dftRenderer() {
    return this.#dftRenderer
  }

  set dftRenderer(job) {
    if(this.#dftRenderer && this.isConnected) {
      gpu.removeRenderJob(this.#dftRenderer)
    }
    this.#dftRenderer = job
  }

  connectedCallback() {
    if(!this.isConnected) return
    if(this.#dftRenderer)  gpu.addRenderJob(this.#dftRenderer)
    if(this.#waveRenderer) gpu.addRenderJob(this.#waveRenderer)
    this.updateRect()
  }
  
  disconnectedCallback() {
    if(this.isConnected) return
    if(this.#waveRenderer) gpu.removeRenderJob(this.#waveRenderer)
    if(this.#dftRenderer)  gpu.removeRenderJob(this.#dftRenderer)
  }

  attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
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
    if(this.#waveRenderer)
      this.#waveRenderer.rect = [r.x, r.y, r.width, r.height]
    if(this.#dftRenderer)
      this.#dftRenderer.rect = [r.x, r.y, r.width, r.height]
  }
}

customElements.define('wave-view', WaveViewElement)

