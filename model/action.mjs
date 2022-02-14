/* action.mjs - Action definitions

Actions are generated by user interaction and other events. All state updates
are initiated by Actions and applied by the update function. Action names start
with a verb.

At time of writing, not all actions change the model state. Some are used only
as "plumbing" for UI events in sub-views to reach a higher view using the top-
down effect system.
*/

export const

CreateSource          = ()   => ({type:'CreateSource'}),
DeleteSource          = (id) => ({type:'DeleteSource', id}),
CloneSource           = (id) => ({type:'CloneSource', id}),
SetSourceName         = (id, name) => ({type:'SetSourceName', id, name}),
SetSourceColour       = (id, colour) => ({type:'SetSourceColour', id, colour}),
SetSourceCoefficients = (id, coefficients) => ({type:'SetSourceCoeffiecients', id, coefficients}),
SetSourcePosition     = (id, position) => ({type:'SetSourcePosition', id, position}),
SetSourceX            = (id, x) => ({type:'SetSourceX', id, x}),
SetSourceY            = (id, y) => ({type:'SetSourceY', id, y}),
SetSourceZ            = (id, z) => ({type:'SetSourceZ', id, z}),
SetSourceEnabled      = (id, enabled) => ({type:'SetSourceEnabled', id, enabled}),
SetSourceAnnotations  = (id, enabled) => ({type:'SetSourceAnnotations', id, enabled}),

CreateAntenna          = ()   => ({type:'CreateAntenna'}),
DeleteAntenna          = (id) => ({type:'DeleteAntenna', id}),
CloneAntenna           = (id) => ({type:'CloneAntenna', id}),
SetAntennaName         = (id, name) => ({type:'SetAntennaName', id, name}),
SetAntennaColour       = (id, colour) => ({type:'SetAntennaColour', id, colour}),
SetAntennaPosition     = (id, position) => ({type:'SetAntennaPosition', id, position}),
SetAntennaX            = (id, x) => ({type:'SetAntennaX', id, x}),
SetAntennaZ            = (id, z) => ({type:'SetAntennaZ', id, z}),
SetAntennaEnabled      = (id, enabled) => ({type:'SetAntennaEnabled', id, enabled}),
SetAntennaAnnotations  = (id, enabled) => ({type:'SetAntennaAnnotations', id, enabled}),

SetApertureWavelength  = (wavelength) => ({type:'SetApertureWavelength', wavelength}),
SetApertureDeclination = (declination) => ({type:'SetApertureDeclination', declination}),
SetApertureAscension   = (ascension) => ({type:'SetApertureAscension', ascension}),

SetCameraMode          = (mode) => ({type:'SetCameraMode', mode}),
SetCameraFlyaround     = (on) => ({type:'SetCameraFlyaround', on}),
ResetCameraPosition    = () => ({type:'ResetCameraPosition'}),
ResetCameraOrientation = () => ({type:'ResetCameraOrientation'}),
SetCameraTarget        = (entityType,id) => ({type:'SetCameraTarget', entityType, id}),
ChangeAspect           = (aspect) => ({type:'ChangeAspect', aspect}),
SetDragMode            = (mode) => ({type:'SetDragMode', mode}),


NullAction             = () => ({type:'NullAction'});

