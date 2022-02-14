// Vertex shader for Entity objects.

[[block]] struct Globals {
  view:       mat4x4<f32>;
  projection: mat4x4<f32>;
  lightPos:   vec3<f32>;
};

[[block]] struct Params {
  model:  mat4x4<f32>;
  colour: vec4<f32>;
};

struct VertexOutput {
  [[builtin(position)]] position: vec4<f32>;
  [[location(0)]]       normal:   vec3<f32>;
  [[location(1)]]       uv:       vec2<f32>;
  [[location(2)]]       worldPos: vec3<f32>;
};

[[group(0), binding(0)]] var<uniform> globals: Globals;
[[group(0), binding(1)]] var<uniform> params:  Params;

[[stage(vertex)]]
fn main([[location(0)]] position: vec3<f32>,
        [[location(1)]] normal:   vec3<f32>,
        [[location(2)]] uv:       vec2<f32>) -> VertexOutput {
  var output: VertexOutput;
  var pos = vec4<f32>(position, 1.0);
  output.position = globals.projection
       * globals.view
       * params.model
       * pos;
  output.uv = uv;
  output.worldPos = (params.model * pos).xyz;
  output.normal = normal;
  return output;
}

