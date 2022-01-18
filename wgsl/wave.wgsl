struct VertexOutput {
  [[builtin(position)]] Position : vec4<f32>;
  [[location(0)]] fragUV : vec2<f32>;
  [[location(1), interpolate(flat)]] instance : u32;
  [[location(2), interpolate(flat)]] colour : vec3<f32>;
};
[[block]] struct Viewport {
  size : vec2<f32>;
};
[[group(0), binding(2)]] var<uniform> viewport : Viewport;

[[stage(vertex)]]
fn vert_main([[location(0)]] a_xy     : vec2<f32>,
             [[location(1)]] a_uv     : vec2<f32>,
             [[location(2)]] a_pos    : vec2<f32>,
             [[location(3)]] a_size   : vec2<f32>,
             [[location(4)]] a_colour : vec3<f32>,
             [[builtin(instance_index)]] inst : u32) -> VertexOutput {
  var output : VertexOutput;
  var relPos : vec2<f32> = (a_pos / viewport.size) * vec2<f32>(2.0,-2.0) + vec2<f32>(-1.0,1.0);
  var relSize : vec2<f32> = (a_size / viewport.size) * vec2<f32>(2.0,2.0); // + vec2<f32>(-1.0,1.0);
  output.Position = vec4<f32>(relPos + a_uv * relSize * vec2<f32>(1.0,-1.0), 0.0, 1.0);
  output.fragUV = a_uv;
  output.instance = inst;
  output.colour = a_colour;
  return output;
}

[[block]] struct Waveform {
  data : array<f32>;
};
[[block]] struct InstanceMap {
  data : array<u32>;
};

[[group(0), binding(0)]] var<storage, read> wave : Waveform;
[[group(0), binding(1)]] var<storage, read> instanceMap : InstanceMap;

fn colourAt(x: u32, h: f32, i: u32, colour: vec3<f32>) -> vec4<f32> {
  var y : f32   = wave.data[i*2048u + x] / 5.0 + 0.5;
  var dy : f32  = abs(h - y) * 30.0;
  var lvl : f32 = min(1.0, max(0.0, pow(1.0 - min(1.0, dy), 0.7)));
  return vec4<f32>(lvl * colour, lvl);
}

[[stage(fragment)]]
fn frag_main([[location(0)]] uv: vec2<f32>,
             [[location(1), interpolate(flat)]] instance: u32,
             [[location(2), interpolate(flat)]] colour: vec3<f32>) -> [[location(0)]] vec4<f32> {
  var idx : u32 = instanceMap.data[instance];
  var x : u32   = u32(round(uv[0] * 512.0)) % 512u;
  return 0.3   * colourAt(x - 2u, uv[1], idx, colour)
       + 0.5  * colourAt(x - 1u, uv[1], idx, colour)
       + 1.0   * colourAt(x,      uv[1], idx, colour)
       + 0.5  * colourAt(x + 1u, uv[1], idx, colour)
       + 0.3   * colourAt(x + 2u, uv[1], idx, colour);
  //var y : f32   = wave.data[inst*u32(1024) + x] / 4.0 + 0.5;
  //var dy : f32  = abs(uv[1] - y) * 50.0;
  //var lvl : f32 = min(1.0, max(0.0, pow(1.0 - min(1.0, dy), 0.5)));
  //return vec4<f32>(lvl * colour, lvl);
}

