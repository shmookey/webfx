import * as Effect from '/model/effect.mjs'

/** State management for baseline records

A baseline represents the separation between two antennas on the ground. Only
fully coplanar arrangements are currently supported. A baseline is thus fully
defined for the purpose of interferometry by an X and a Y component, or in
wavelength units as a vector on the UV plane.

Fields

  KEY       TYPE          VALUE
  entityID  number        Unique entity ID for baseline
  a         Antenna       Antenna A
  b         Antenna       Antenna B
  vec       Float32Array  Distance vector on XY plane
  enabled   bool          Enabled for processing 
  show      Bool          Show on floorplanner? 
*/

/* Initialise a baseline record between antennas `a` and `b`. */
const initBaseline = (entityID, a, b) => {
  [a, b] = a.entityID < b.entityID ? [a, b] : [b, a]
  const vec = new Float32Array(2)
  vec[0] = b.position[0] - a.position[0]
  vec[1] = b.position[2] - a.position[2]
  const enabled = a.enabled && b.enabled
  const show    = enabled && a.annotations && b.annotations
  return {entityID, a, b, vec, enabled, show}
}

export const applyAntennaCreated = (state, descriptor) => {
  const antA = descriptor
  const fx = []
  for(let i=0; i<state.antennas.length; i++) {
    const antB = state.antennas[i]
    if(antA.entityID === antB.entityID) continue
    const entityID = state.nextEntityID
    state.nextEntityID++
    const baseline = initBaseline(entityID, antA, antB)
    state.baselines[entityID] = baseline
    fx.push(Effect.BaselineCreated(baseline))
  }
  return [state, fx]
}

export const applyAntennaDeleted = (state, id) => {
  const fx = []
  const baselines = Object.values(state.baselines)
    .filter(bl => bl.a.entityID == id || bl.b.entityID == id)
    .forEach(bl => {
      delete state.baselines[bl.entityID]
      fx.push(Effect.BaselineDeleted(bl.entityID))
    })
  return [state, fx]
}

export const applyAntennaMoved = (state, antA) => {
  const fx = []
  const id = antA.entityID
  const baselines = Object.values(state.baselines)
    .filter(bl => bl.a.entityID == id || bl.b.entityID == id)
    .forEach(bl => {
      bl.vec[0] = bl.b.position[0] - bl.a.position[0]
      bl.vec[1] = bl.b.position[2] - bl.a.position[2]
      fx.push(Effect.BaselineMoved(bl.entityID, bl.vec))
    })
  return [state, fx]
}

export const applyAntennaSetEnabled = (state, antenna) => {
  const fx = []
  const id = antenna.entityID
  const baselines = Object.values(state.baselines)
    .filter(bl => bl.a.entityID == id || bl.b.entityID == id)
    .forEach(bl => {
      const old = bl.enabled
      bl.enabled = bl.a.enabled && bl.b.enabled
      if(old != bl.enabled) {
        fx.push(Effect.BaselineSetEnabled(bl.entityID, bl.enabled))
      }
    })
  return [state, fx]
}

export const applyAntennaSetAnnotations = (state, antenna) => {
  const fx = []
  const id = antenna.entityID
  const baselines = Object.values(state.baselines)
    .filter(bl => bl.a.entityID == id || bl.b.entityID == id)
    .forEach(bl => {
      const old = bl.show
      bl.show = bl.enabled && bl.a.annotations && bl.b.annotations
      if(old != bl.show) {
        fx.push(Effect.BaselineSetAnnotations(bl.entityID, bl.show))
      }
    })
  return [state, fx]
}

