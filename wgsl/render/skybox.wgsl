[[block]] struct Globals {
  view:       mat4x4<f32>;
  projection: mat4x4<f32>;
  lightPos:   vec3<f32>;
};

[[block]] struct Params {
  model:  mat4x4<f32>;
};

struct VertexOutput {
  [[builtin(position)]] position:  vec4<f32>;
  [[location(0)]]       direction: vec3<f32>;
  [[location(1)]]       uv:        vec2<f32>;
};
struct FragmentOutput {
  [[location(0)]]         colour: vec4<f32>;
  [[location(1)]]         id:     u32;
};

[[group(0), binding(0)]] var<uniform> globals:     Globals;
//[[group(0), binding(1)]] var<uniform> vertParams:  Params;
[[group(0), binding(1)]] var cubeSampler: sampler;
[[group(0), binding(2)]] var cubeTexture: texture_cube<f32>;

fn extractRotation(m: mat4x4<f32>) -> mat4x4<f32> {
  var c0 = m[0];
  var c1 = m[1];
  var c2 = m[2];
  var sx = length(c0);
  var sy = length(c1);
  var sz = length(c2);
  var output = mat4x4<f32>(
    c0 / sx,
    c1 / sy,
    c2 / sz,
    vec4<f32>(0.0, 0.0, 0.0, 1.0)
  );
  return output;
}

[[stage(vertex)]]
fn vert_main([[location(0)]] position: vec3<f32>,
             [[location(1)]] uv:       vec2<f32>) -> VertexOutput {
  var output: VertexOutput;
  var pos = vec4<f32>(position, 1.0);
  output.position = globals.projection
       * extractRotation(globals.view)
       * pos;
  output.direction = position;
  output.uv = uv;
  return output;
}

[[stage(fragment)]]
fn frag_main([[builtin(position)]] pos:       vec4<f32>,
             [[location(0)]]       direction: vec3<f32>,
             [[location(1)]]       uv:        vec2<f32>) -> FragmentOutput {
  var output: FragmentOutput;
  output.colour = textureSample(cubeTexture, cubeSampler, direction);
  return output;
}

