[[block]] struct Globals {
  view:       mat4x4<f32>;
  projection: mat4x4<f32>;
  lightPos:   vec3<f32>;
};

[[block]] struct Params {
  model:  mat4x4<f32>;
  colour: vec4<f32>;
};

struct FragmentOutput {
  [[location(0)]] colour: vec4<f32>;
  [[location(1)]] id:     u32;
};

[[group(1), binding(0)]] var<uniform> globals: Globals;
[[group(1), binding(1)]] var<uniform> params:  Params;

[[stage(fragment)]]
fn main([[builtin(position)]] pos:      vec4<f32>,
        [[location(0)]]       normal:   vec3<f32>,
        [[location(1)]]       uv:       vec2<f32>,
        [[location(2)]]       worldPos: vec3<f32>) -> FragmentOutput {
  var output: FragmentOutput;
  var lightDir:    vec3<f32> = normalize(globals.lightPos - worldPos);
  var lightColour: vec3<f32> = vec3<f32>(1.0,1.0,1.0);
  var diffuse:     vec3<f32> = max(dot(normal, lightDir), 0.0) * lightColour;
  var ambient:     vec3<f32> = 0.1 * lightColour;
  output.colour              = vec4<f32>(diffuse + ambient, 1.0) * params.colour;
  return output;
}

