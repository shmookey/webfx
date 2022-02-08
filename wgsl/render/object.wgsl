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
  [[location(0)]]       uv:       vec2<f32>;
  [[location(1)]]       worldPos: vec3<f32>;
  [[location(2)]]       normal:   vec3<f32>;
};
struct FragmentOutput {
  [[location(0)]]         colour: vec4<f32>;
  [[location(1)]]         id:     u32;
};

[[group(0), binding(0)]] var<uniform> globals:     Globals;
[[group(0), binding(1)]] var<uniform> vertParams:  Params;
[[group(1), binding(0)]] var<uniform> fragGlobals: Globals;
[[group(1), binding(1)]] var<uniform> fragParams:  Params;


[[stage(vertex)]]
fn vert_main([[location(0)]] position: vec3<f32>,
             [[location(1)]] normal:   vec3<f32>,
             [[location(2)]] uv:       vec2<f32>) -> VertexOutput {
  var output: VertexOutput;
  var pos = vec4<f32>(position, 1.0);
  output.position = globals.projection
       * globals.view
       * vertParams.model
       * pos;
  output.uv = uv;
  output.worldPos = (vertParams.model * pos).xyz;
  output.normal = normal;
  return output;
}

[[stage(fragment)]]
fn frag_main([[builtin(position)]] pos:      vec4<f32>,
             [[location(0)]]       uv:       vec2<f32>,
             [[location(2)]]       normal:   vec3<f32>,
             [[location(1)]]       worldPos: vec3<f32>) -> FragmentOutput {
  //var fade: f32 = length(abs(uv - vec2<f32>(0.5,0.5)));
  var output: FragmentOutput;
  var lightDir: vec3<f32> = normalize(fragGlobals.lightPos - worldPos);
  var lightColour: vec3<f32> = vec3<f32>(1.0,1.0,1.0);
  var diffuse: vec3<f32> = max(dot(normal, lightDir), 0.0) * lightColour;
  var ambient: vec3<f32> = 0.1 * lightColour;
  output.colour = vec4<f32>(diffuse + ambient, 1.0) * fragParams.colour;
  return output;
}

