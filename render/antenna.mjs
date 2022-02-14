import * as config   from '/config.mjs'
import * as resource from '/render/resource.mjs'
import * as meshes   from '/render/meshes.mjs'
import {Entity}      from '/render/entity.mjs'
import {mat4}        from '/gl-matrix/dist/esm/index.js'

export class AntennaEntity {
  antenna
  footprint
  enabled
  #isSelected
  #isAnnotated

  static async init() {
    if(!Entity.isInitialised) await Entity.init()
    await Entity.createPipeline('render/entity-coloured.frag.wgsl')
    await Entity.createPipeline('render/footprint.frag.wgsl')
  }

  constructor(descriptor) {
    this.enabled = true

    this.footprintPropData = new Float32Array(12)
    this.footprintPropData.set([
      ...descriptor.colour, 0.25,
      0, 0, 0, 0,
      0, 0, 0, 0,
    ])
    this.footprintPropBuffer = webfx.gpu.device.createBuffer({
      size: 12 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    webfx.gpu.device.queue.writeBuffer(this.footprintPropBuffer, 0, this.footprintPropData)

    this.antenna = new Entity(
      descriptor.entityID,
      'render/entity-coloured.frag.wgsl',
      meshes.antenna(),
      [1, 1, 1, 1],
      descriptor.position,
      [0.1, 0.1, 0.1]
    )
    this.footprint = new Entity(
      descriptor.entityID,
      'render/footprint.frag.wgsl',
      meshes.footprint,
      [0, 0, 1, 1],
      descriptor.position,
      [0.5, 0.5, 0.5],
      this.footprintPropBuffer,
    )
  }

  setPosition(position) {
    this.antenna.setPosition(position)
    this.footprint.setPosition(position)
  }

  setScale(scale) {
    this.antenna.setScale(scale)
    this.footprint.setScale(scale)
  }

  setEnabled(enabled) {
    this.enabled = enabled
    if(enabled)
      this.antenna.setColour([1, 1, 1, 1])
    else
      this.antenna.setColour([1, 1, 1, 0.35])
  }

  get selected() {
    return this.#isSelected
  }

  set selected(on) {
    this.#isSelected = on
    if(on) {
      this.footprintPropData.set(new Float32Array([1,1,1,1]), 4)
    } else {
      this.footprintPropData.set(new Float32Array([0,0,0,0]), 4)
    }
    webfx.gpu.device.queue.writeBuffer(this.footprintPropBuffer, 0, this.footprintPropData)
  }

  get annotated() {
    return this.#isAnnotated
  }

  set annotated(on) {
    this.#isAnnotated = on
    if(on) {
      this.footprintPropData.set(new Float32Array([1,1,0,1]), 8)
    } else {
      this.footprintPropData.set(new Float32Array([0,0,0,0]), 8)
    }
    webfx.gpu.device.queue.writeBuffer(this.footprintPropBuffer, 0, this.footprintPropData)
  }

  destroy() {
    this.antenna.destroy()
    this.footprint.destroy()
  }

  render(passEncoder) {
    this.antenna.render(passEncoder)
    this.footprint.render(passEncoder)
  }

}


