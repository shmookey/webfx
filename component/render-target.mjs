//import * as gpu from '/gpu.mjs'

const css = `
#wrapper {
  position: relative;
}
`

class RenderTargetElement extends HTMLElement {
  #renderer     = null
  #jobInstalled = false

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
    const gpu = webfx.gpu
    if(this.#renderer && this.isConnected) {
      gpu.jobs.render.remove(this.#renderer)
      this.#jobInstalled = false
    }
    this.#renderer = job
    if(this.isConnected) {
      gpu.jobs.render.add(this.#renderer)
      this.#jobInstalled = true
    }
  }

  connectedCallback() {
    const gpu = webfx.gpu
    if(!this.isConnected) return
    if(this.#renderer && !this.#jobInstalled) {
      gpu.jobs.render.add(this.#renderer)
      this.#jobInstalled = true
    }
    this.updateRect()
  }
  
  disconnectedCallback() {
    const gpu = webfx.gpu
    if(this.isConnected) return
    if(this.#renderer && this.#jobInstalled) { 
      gpu.jobs.render.remove(this.#renderer)
      this.#jobInstalled = false
    }
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

