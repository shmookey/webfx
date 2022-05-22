/** Base class for 2D planes. */

import {plane} from '/render/mesh.mjs'

export class Surface extends Entity {
  constructor(
      points,
      entityID,
      fragmentShader,
      colour  = new Float32Array([1, 1, 1, 1]),
      propBuf = null,
      texture = null,
      ) {
    const mesh = plane(...points)
    super(entityID, fragmentShader, mesh, colour, undefined, undefined, profBuf, texture)
  }
}
