export class SVGTexture {
  element   // SVGElement
  texture   // GPUTexture
  width
  height

  constructor(element, width, height) {
    this.width = width
    this.height = height
    this.texture = webfx.gpu.device.createTexture({
      size:      [width, height, 1],
      dimension: '2d',
      format:    'rgba8unorm',
      usage:     GPUTextureUsage.TEXTURE_BINDING 
               | GPUTextureUsage.COPY_DST,
    })
    this.update()
  }

  /** Rasterise the SVG and upload image data. */
  update() {
    const image = createImageBitmap(this.element, {
      resizeWidth:   this.width,
      resizeHeight:  this.height,
      resizeQuality: 'high',
    })
    webfx.gpu.device.queue.copyExternalImageToTexture(
      { source: image },
      { texture: this.texture },
      [this.width, this.height, 1],
    )
  }

}

