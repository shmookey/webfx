struct VertexOutput {
  [[builtin(position)]] xy: vec4<f32>;
  [[location(0)]]       uv: vec2<f32>;
};
[[block]] struct Globals {
  viewportSize: vec2<f32>;
  nSamples:     f32;
};
[[group(0), binding(0)]] var<uniform>       vglobals: Globals;

fn fromScreenCoords(xy: vec2<f32>) -> vec2<f32> {
  return (xy / vglobals.viewportSize) * vec2<f32>(2.0, -2.0) + vec2<f32>(-1.0, 1.0);
}


[[stage(vertex)]]
fn vert_main([[location(0)]] a_xy: vec2<f32>,
             [[location(1)]] a_uv: vec2<f32>) -> VertexOutput {
  var output : VertexOutput;
  output.xy = vec4<f32>(fromScreenCoords(a_xy), 0.0, 1.0);
  output.uv = a_uv;
  return output;
}

[[block]] struct Waveform {
  data: array<f32>;
};
[[block]] struct Params {
  colour: vec3<f32>;
};


[[group(1), binding(0)]] var<uniform>       params:   Params;
[[group(1), binding(1)]] var<uniform>       globals:  Globals;
[[group(1), binding(2)]] var<storage, read> wave:     Waveform;

fn colourAt(x: f32, h: f32) -> vec4<f32> {
  var y:   f32 = x/5.0 + 0.5;
  if(x == 0.0) { return vec4<f32>(params.colour,1.0); }
  var dy:  f32 = abs(h - y) * 30.0;
  var lvl: f32 = min(1.0, max(0.0, pow(1.0 - min(1.0, dy), 0.7)));
  return vec4<f32>(lvl * params.colour, lvl);
}

[[stage(fragment)]]
fn frag_main([[location(0)]] uv: vec2<f32>) -> [[location(0)]] vec4<f32> {
  var x : u32   = u32(round(uv[0] * globals.nSamples));
  return 0.3 * colourAt(wave.data[x - 2u], uv[1])
       + 0.5 * colourAt(wave.data[x - 1u], uv[1])
       + 1.0 * colourAt(wave.data[x     ], uv[1])
       + 0.5 * colourAt(wave.data[x + 1u], uv[1])
       + 0.3 * colourAt(wave.data[x + 2u], uv[1]);
}

