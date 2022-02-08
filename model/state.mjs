import * as effects from '/model/effect.mjs'

const initSource = (id) => ({
  id, type: 'source',                 // Source unique identifier
  name:         `Source ${id+1}`,     // Display name of source
  position:     new Float64Array(3),  // XYZ coordinates of source in space
  colour:       new Float32Array(3),  // RGB display colour
  enabled:      true,                 // Signal emission toggle
  coefficients: new Float32Array(12), // Amplitude, frequency, phase for 4 sine components
})

const initAntenna = (id) => ({
  id, type: 'antenna',                // Antenna unique identifier
  name:         `Antenna ${id+1}`,    // Display name of antenna
  position:     new Float64Array(3),  // XYZ coordinates of antenna in space
  colour:       new Float32Array(3),  // RGB display colour
  enabled:      true,                 // Signal reception toggle
})

export const init = () => ({
  sources:       [],
  lastSourceID:  0,
  antennas:      [],
  lastAntennaID: 0,
})


export const update = (state, action) => {
  switch(action.type) {
    case 'CreateSource': {
      const id = state.lastSourceID
      const source = initSource(id)
      const colour = webfx.colourGenerator.next()
      const position = webfx.skyPositionGenerator.next()
      source.colour.set(colour.value)
      source.position.set(position.value)
      state.sources.push(source)
      state.lastSourceID += 1
      return [state, [effects.SourceCreated(source)]]
    }
    case 'DeleteSource': {
      const idx = state.sources.findIndex(s => s.id == action.id)
      state.sources.splice(idx, 1)
      return [state, [effects.SourceDeleted(action.id)]]
    }
    case 'CloneSource': {
      const source = state.sources.find(s => s.id == action.id)
      const id = state.lastSourceID
      const clone  = initSource(id)
      clone.name = `Copy of ${source.name}`
      clone.position.set(source.position)
      clone.colour.set(source.colour)
      clone.coefficients.set(source.coefficients)
      clone.enabled = source.enabled
      state.sources.push(clone)
      state.lastSourceID += 1
      return [state, [effects.SourceCreated(clone)]]
    }
    case 'SetSourceName': {
      const source = state.sources.find(s => s.id == action.id)
      source.name = action.name
      return [state, [effects.SourceRenamed(source.id, source.name)]]
    }
    case 'SetSourceColour': {
      const source = state.sources.find(s => s.id == action.id)
      source.colour.set(action.colour)
      return [state, [effects.SourceSetColour(source.id, source.colour)]]
    }
    case 'SetSourceCoefficients': {
      const source = state.sources.find(s => s.id == action.id)
      source.coefficients.set(action.coefficients)
      return [state, [effects.SourceSetCoefficients(source.id, source.coefficients)]]
    }
    case 'SetSourcePosition': {
      const source = state.sources.find(s => s.id == action.id)
      source.position.set(action.position)
      return [state, [effects.SourceMoved(source.id, source.position)]]
    }
    case 'SetSourceX': {
      const source = state.sources.find(s => s.id == action.id)
      source.position[0] = action.x
      return [state, [effects.SourceMoved(source.id, source.position)]]
    }
    case 'SetSourceY': {
      const source = state.sources.find(s => s.id == action.id)
      source.position[1] = action.y
      return [state, [effects.SourceMoved(source.id, source.position)]]
    }
    case 'SetSourceZ': {
      const source = state.sources.find(s => s.id == action.id)
      source.position[2] = action.z
      return [state, [effects.SourceMoved(source.id, source.position)]]
    }
    case 'SetSourceEnabled': {
      const source = state.sources.find(s => s.id == action.id)
      source.enabled = action.enabled
      return [state, [source.enabled ? effects.SourceEnabled(source.id)
                                     : effects.SourceDisabled(source.id)]]
    }


    case 'CreateAntenna': {
      const id = state.lastAntennaID
      const antenna = initAntenna(id)
      const colour = webfx.colourGenerator.next()
      const position = webfx.groundPositionGenerator.next()
      antenna.colour.set(colour.value)
      antenna.position.set(position.value)
      state.antennas.push(antenna)
      state.lastAntennaID += 1
      return [state, [effects.AntennaCreated(antenna)]]
    }
    case 'DeleteAntenna': {
      const idx = state.antennas.findIndex(s => s.id == action.id)
      state.antennas.splice(idx, 1)
      return [state, [effects.AntennaDeleted(action.id)]]
    }
    case 'CloneAntenna': {
      const antenna = state.antennas.find(s => s.id == action.id)
      const id = state.lastAntennaID
      const clone  = initAntenna(id)
      clone.name = `Copy of ${antenna.name}`
      clone.position.set(antenna.position)
      clone.colour.set(antenna.colour)
      clone.enabled = antenna.enabled
      state.antennas.push(clone)
      state.lastAntennaID += 1
      return [state, [effects.AntennaCreated(clone)]]
    }
    case 'SetAntennaName': {
      const antenna = state.antennas.find(s => s.id == action.id)
      antenna.name = action.name
      return [state, [effects.AntennaRenamed(antenna.id, antenna.name)]]
    }
    case 'SetAntennaColour': {
      const antenna = state.antennas.find(s => s.id == action.id)
      antenna.colour.set(action.colour)
      return [state, [effects.AntennaSetColour(antenna.id, antenna.colour)]]
    }
    case 'SetAntennaPosition': {
      const antenna = state.antennas.find(s => s.id == action.id)
      antenna.position.set(action.position)
      return [state, [effects.AntennaMoved(antenna.id, antenna.position)]]
    }
    case 'SetAntennaX': {
      const antenna = state.antennas.find(s => s.id == action.id)
      antenna.position[0] = action.x
      return [state, [effects.AntennaMoved(antenna.id, antenna.position)]]
    }
    case 'SetAntennaZ': {
      const antenna = state.antennas.find(s => s.id == action.id)
      antenna.position[2] = action.z
      return [state, [effects.AntennaMoved(antenna.id, antenna.position)]]
    }
    case 'SetAntennaEnabled': {
      const antenna = state.antennas.find(s => s.id == action.id)
      antenna.enabled = action.enabled
      return [state, [antenna.enabled ? effects.AntennaEnabled(antenna.id)
                                     : effects.AntennaDisabled(antenna.id)]]
    }

    // Non-mutating events

    case 'SetCameraMode':
      return [state, [effects.CameraModeChanged(action.mode)]]

    case 'SetCameraFlyaround':
      return [state, [action.on ? effects.CameraFlyaroundEnabled()
                                : effects.CameraFlyaroundDisabled()]]
    
    case 'ResetCameraOrientation':
      return [state, [effects.CameraOrientationReset()]]
    
    case 'ResetCameraPosition':
      return [state, [effects.CameraPositionReset()]]
    
   case 'SetCameraTarget':
      return [state, [effects.CameraTargetSet(action.entityType, action.id)]]

   case 'ChangeAspect':
      return [state, [effects.AspectChanged(action.aspect)]]

    case 'SetDragMode':
      return [state, [effects.DragModeChanged(action.mode)]]

  }
}




