import * as gpu from '/gpu.mjs'

const css = `
#wrapper {
  position: relative;
}
`

class RenderTargetElement extends HTMLElement {
  #renderer = null

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

  get renderer() {
    return this.#renderer
  }

  set renderer(job) {
    if(this.#renderer && this.isConnected) {
      gpu.removeRenderJob(this.#renderer)
    }
    this.#renderer = job
    if(this.isConnected) {
      gpu.addRenderJob(this.#renderer)
    }
  }

  connectedCallback() {
    if(!this.isConnected) return
    if(this.#renderer) gpu.addRenderJob(this.#renderer)
    this.updateRect()
  }
  
  disconnectedCallback() {
    if(this.isConnected) return
    if(this.#renderer) gpu.removeRenderJob(this.#renderer)
  }

  attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
    }
  }

  updateRect() {
    const r = this.getBoundingClientRect()
    if(this.#renderer)
      this.#renderer.rect = [r.x, r.y, r.width, r.height]
  }
}

customElements.define('render-target', RenderTargetElement)

