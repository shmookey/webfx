[[block]] struct Globals {
  view:       mat4x4<f32>;
  projection: mat4x4<f32>;
  lightPos:   vec3<f32>;
};

[[block]] struct Params {
  model:  mat4x4<f32>;
};

struct VertexOutput {
  [[builtin(position)]] position: vec4<f32>;
};
struct FragmentOutput {
  [[location(0)]]       colour: vec4<f32>;
  [[location(1)]]       id:     u32;
};

[[group(0), binding(0)]] var<uniform> globals: Globals;
[[group(0), binding(1)]] var<uniform> params:  Params;


[[stage(vertex)]]
fn vert_main([[location(0)]] position: vec4<f32>) -> VertexOutput {
  var output: VertexOutput;
  output.position = globals.projection
       * globals.view
       * params.model
       * position;
  return output;
}

[[stage(fragment)]]
fn frag_main([[builtin(position)]] pos: vec4<f32>) -> FragmentOutput {
  var output: FragmentOutput;
  output.colour = 0.5 * vec4<f32>(0.5,0.5,0.0,1.0);
  return output;
}

