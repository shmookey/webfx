const shaderModules = {}

export async function getShader(name) {
  if(!webfx?.gpu?.device) throw 'WebGPU device not available'

  if(name in shaderModules) {
    return shaderModules[name]
  }
  const code = await (await fetch(`wgsl/${name}`)).text()
  const module = webfx.device.createShaderModule({code})
  shaderModules[name] = module
  return module
}

