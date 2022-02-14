import * as Effect from '/model/effect.mjs'
import * as Baseline from '/model/baseline.mjs'

/* Note to developers

In the future, this project will implement a functional-reactive state model,
with an immutable state object. Until then, we merely pretend that it does, so
that the transition later will not be too painful. This is why the functions
here both mutate and return the state object - callers should only rely on the
returned state object, since mutation will eventually go away.
*/

const initSource = (id, entityID) => ({
  id, entityID,                       // Unique identifier
  type:         'source',             // Entity type
  name:         `Source ${id+1}`,     // Display name of source
  position:     new Float64Array(3),  // XYZ coordinates of source in space
  colour:       new Float32Array(3),  // RGB display colour
  enabled:      true,                 // Signal emission toggle
  coefficients: new Float32Array(12), // Amplitude, frequency, phase for 4 sine components
  annotations:  false,                // Show annotations in floorplanner
})

const initAntenna = (id, entityID) => ({
  id, entityID,                       // Unique identifier
  type:         'antenna',            // Entity type
  name:         `Antenna ${id+1}`,    // Display name of antenna
  position:     new Float64Array(3),  // XYZ coordinates of antenna in space
  colour:       new Float32Array(3),  // RGB display colour
  enabled:      true,                 // Signal reception toggle
  annotations:  false,                // Show annotations in floorplanner
})

export const init = () => ({
  sources:        [],
  antennas:       [],
  entities:       {},
  baselines:      {},
  nextSourceID:   0,
  nextAntennaID:  0,
  nextEntityID:   0,
  aperture: {
    wavelength:   1000, // in mm
    declination:  0,
    ascension:    0,
  },
})


export const update = (state, action) => {
  switch(action.type) {
    case 'CreateSource': {
      const id = state.nextSourceID
      const entityID = state.nextEntityID
      const source = initSource(id, entityID)
      const colour = webfx.colourGenerator.next()
      const position = webfx.skyPositionGenerator.next()
      source.colour.set(colour.value)
      source.position.set(position.value)
      state.sources.push(source)
      state.entities[entityID] = source
      state.nextSourceID += 1
      state.nextEntityID += 1
      return [state, [Effect.SourceCreated(source)]]
    }
    case 'DeleteSource': {
      const idx = state.sources.findIndex(s => s.id == action.id)
      const entity = state.sources[idx]
      state.sources.splice(idx, 1)
      delete state.entities[entity.entityID]
      return [state, [Effect.SourceDeleted(action.id)]]
    }
    case 'CloneSource': {
      const source = state.sources.find(s => s.id == action.id)
      const id = state.nextSourceID
      const entityID = state.nextEntityID
      const clone  = initSource(id, entityID)
      clone.name = `Copy of ${source.name}`
      clone.position.set(source.position)
      clone.colour.set(source.colour)
      clone.coefficients.set(source.coefficients)
      clone.enabled = source.enabled
      state.sources.push(clone)
      state.entities[entityID] = source
      state.nextSourceID += 1
      state.nextEntityID += 1
      return [state, [Effect.SourceCreated(clone)]]
    }
    case 'SetSourceName': {
      const source = state.sources.find(s => s.id == action.id)
      source.name = action.name
      return [state, [Effect.SourceRenamed(source.id, source.name)]]
    }
    case 'SetSourceColour': {
      const source = state.sources.find(s => s.id == action.id)
      source.colour.set(action.colour)
      return [state, [Effect.SourceSetColour(source.id, source.colour)]]
    }
    case 'SetSourceCoefficients': {
      const source = state.sources.find(s => s.id == action.id)
      source.coefficients.set(action.coefficients)
      return [state, [Effect.SourceSetCoefficients(source.id, source.coefficients)]]
    }
    case 'SetSourcePosition': {
      const source = state.sources.find(s => s.id == action.id)
      source.position.set(action.position)
      return [state, [Effect.SourceMoved(source.id, source.position)]]
    }
    case 'SetSourceX': {
      const source = state.sources.find(s => s.id == action.id)
      source.position[0] = action.x
      return [state, [Effect.SourceMoved(source.id, source.position)]]
    }
    case 'SetSourceY': {
      const source = state.sources.find(s => s.id == action.id)
      source.position[1] = action.y
      return [state, [Effect.SourceMoved(source.id, source.position)]]
    }
    case 'SetSourceZ': {
      const source = state.sources.find(s => s.id == action.id)
      source.position[2] = action.z
      return [state, [Effect.SourceMoved(source.id, source.position)]]
    }
    case 'SetSourceEnabled': {
      const source = state.sources.find(s => s.id == action.id)
      source.enabled = action.enabled
      return [state, [source.enabled ? Effect.SourceEnabled(source.id)
                                     : Effect.SourceDisabled(source.id)]]
    }
    case 'SetSourceAnnotations': {
      const source = state.sources.find(s => s.id == action.id)
      source.annotations = action.enabled
      return [state, [Effect.SourceSetAnnotations(action.id, action.enabled)]]
    }

    case 'CreateAntenna': {
      const id = state.nextAntennaID
      const entityID = state.nextEntityID
      const antenna = initAntenna(id, entityID)
      const colour = webfx.colourGenerator.next()
      const position = webfx.groundPositionGenerator.next()
      antenna.colour.set(colour.value)
      antenna.position.set(position.value)
      state.antennas.push(antenna)
      state.entities[entityID] = antenna
      state.nextAntennaID += 1
      state.nextEntityID += 1
      let [state_, effects] = Baseline.applyAntennaCreated(state, antenna)
      return [state_, [Effect.AntennaCreated(antenna), ...effects]]
    }
    case 'DeleteAntenna': {
      const idx = state.antennas.findIndex(s => s.id == action.id)
      const entity = state.antennas[idx]
      state.antennas.splice(idx, 1)
      delete state.entities[entity.entityID]
      let [state_, effects] = Baseline.applyAntennaDeleted(state, entity.entityID)
      return [state_, [Effect.AntennaDeleted(action.id), ...effects]]
    }
    case 'CloneAntenna': {
      const antenna = state.antennas.find(s => s.id == action.id)
      const id = state.nextAntennaID
      const entityID = state.nextEntityID
      const clone  = initAntenna(id, entityID)
      clone.name = `Copy of ${antenna.name}`
      clone.position.set(antenna.position)
      clone.colour.set(antenna.colour)
      clone.enabled = antenna.enabled
      state.antennas.push(clone)
      state.entities[entityID] = clone
      state.nextAntennaID += 1
      state.nextEntityID += 1
      let [state_, effects] = Baseline.applyAntennaCreated(state, clone)
      return [state_, [Effect.AntennaCreated(clone), ...effects]]
    }
    case 'SetAntennaName': {
      const antenna = state.antennas.find(s => s.id == action.id)
      antenna.name = action.name
      return [state, [Effect.AntennaRenamed(antenna.id, antenna.name)]]
    }
    case 'SetAntennaColour': {
      const antenna = state.antennas.find(s => s.id == action.id)
      antenna.colour.set(action.colour)
      return [state, [Effect.AntennaSetColour(antenna.id, antenna.colour)]]
    }
    case 'SetAntennaPosition': {
      const antenna = state.antennas.find(s => s.id == action.id)
      antenna.position.set(action.position)
      let [state_, effects] = Baseline.applyAntennaMoved(state, antenna) 
      return [state_, [Effect.AntennaMoved(antenna.id, antenna.position), ...effects]]
    }
    case 'SetAntennaX': {
      const antenna = state.antennas.find(s => s.id == action.id)
      antenna.position[0] = action.x
      let [state_, effects] = Baseline.applyAntennaMoved(state, antenna) 
      return [state_, [Effect.AntennaMoved(antenna.id, antenna.position), ...effects]]
    }
    case 'SetAntennaZ': {
      const antenna = state.antennas.find(s => s.id == action.id)
      antenna.position[2] = action.z
      let [state_, effects] = Baseline.applyAntennaMoved(state, antenna) 
      return [state_, [Effect.AntennaMoved(antenna.id, antenna.position), ...effects]]
    }
    case 'SetAntennaEnabled': {
      const antenna = state.antennas.find(s => s.id == action.id)
      antenna.enabled = action.enabled
      let effect = antenna.enabled ? Effect.AntennaEnabled(antenna.id)
                                   : Effect.AntennaDisabled(antenna.id)
      let [state_, effects] = Baseline.applyAntennaSetEnabled(state, antenna) 
      return [state_, [effect, ...effects]]
    }
    case 'SetAntennaAnnotations': {
      const antenna = state.antennas.find(s => s.id == action.id)
      antenna.annotations = action.enabled
      let [state_, effects] = Baseline.applyAntennaSetAnnotations(state, antenna) 
      return [state_, [Effect.AntennaSetAnnotations(action.id, action.enabled), ...effects]]
    }

    case 'SetApertureWavelength': {
      state.aperture.wavelength = action.wavelength
      return [state, [Effect.ApertureSetWavelength(action.wavelength)]]
    }

    case 'SetApertureDeclination': {
      state.aperture.declination = action.declination
      return [state, [Effect.ApertureSetDeclination(action.declination)]]
    }

    case 'SetApertureAscension': {
      state.aperture.ascension = action.ascension
      return [state, [Effect.ApertureSetAscension(action.ascension)]]
    }

    // Non-mutating events

    case 'SetCameraMode':
      return [state, [Effect.CameraModeChanged(action.mode)]]

    case 'SetCameraFlyaround':
      return [state, [action.on ? Effect.CameraFlyaroundEnabled()
                                : Effect.CameraFlyaroundDisabled()]]
    
    case 'ResetCameraOrientation':
      return [state, [Effect.CameraOrientationReset()]]
    
    case 'ResetCameraPosition':
      return [state, [Effect.CameraPositionReset()]]
    
   case 'SetCameraTarget':
      return [state, [Effect.CameraTargetSet(action.entityType, action.id)]]

   case 'ChangeAspect':
      return [state, [Effect.AspectChanged(action.aspect)]]

    case 'SetDragMode':
      return [state, [Effect.DragModeChanged(action.mode)]]

  }
}




