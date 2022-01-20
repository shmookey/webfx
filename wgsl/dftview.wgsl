var<private> PI : f32 = 3.1415926538;
struct VertexOutput {
  [[builtin(position)]] xy : vec4<f32>;
  [[location(0)]]       uv : vec2<f32>;
};
[[block]] struct Globals {
  viewportSize: vec2<f32>;
  nSamples:     f32;
};
[[group(0), binding(0)]] var<uniform> vertexGlobals : Globals;

fn fromScreenCoords(xy: vec2<f32>) -> vec2<f32> {
  return (xy / vertexGlobals.viewportSize) * vec2<f32>(2.0, -2.0) + vec2<f32>(-1.0, 1.0);
}

[[stage(vertex)]]
fn vert_main([[location(0)]] a_xy: vec2<f32>,
             [[location(1)]] a_uv: vec2<f32>) -> VertexOutput {
  var output : VertexOutput;
  output.xy = vec4<f32>(fromScreenCoords(a_xy), 0.0, 1.0);
  output.uv = a_uv;
  return output;
}

[[block]] struct Buffer {
  data: array<vec2<f32>>;
};
[[block]] struct Params {
  scaleFactor: f32;
};
[[group(1), binding(0)]] var<uniform> globals   : Globals;
[[group(1), binding(1)]] var<uniform> params    : Params;
[[group(1), binding(2)]] var<storage, read> dft : Buffer;

fn colourAt_phase(y: f32, A: f32, h: f32) -> vec4<f32> {
  var Y : f32   = 0.88 - h;
  var dy : f32  = Y - (y / 1.0);
  var lvl : f32 = 0.0;
  //if(abs(dy) < 0.005) { lvl = 0.7; }
  var Q : f32 = max(0.0,min(1.0,pow(dy*100.0,3.0)));
  lvl = max(0.0,min(1.0,pow(1.0 - Q, 3.0)));
  if(A < 0.05) { lvl = 0.0; }
  var colour : vec3<f32> = vec3<f32>(1.0,0.0,0.0);
  return vec4<f32>(lvl * colour, lvl * 0.8);
}

fn colourAt_amp(y: f32, h: f32, colour: vec3<f32>, phase: f32) -> vec4<f32> {
  var Y : f32   = 1.5 - h*1.5;
  var dy : f32  = max(0.0, Y - (y / 500.0)) / 2.5;
  var lvl : f32 = 0.0;
  //if(abs(dy) < 0.005) { lvl = 0.7; }
  var Q : f32 = max(0.0,min(1.0,pow(dy*65.0,2.0)));
  lvl = pow(1.0 - Q, 5.0);
  //if(lvl < 1.0) { lvl = 0.0; }
  var red: vec3<f32> = vec3<f32>(1.0,0.0,0.0);
  return vec4<f32>(lvl * mix(colour,red,phase) / 2.0, 1.0) * 0.5;
}

fn colourAt(x: u32, h: f32) -> vec4<f32> {
  var q : f32 = dft.data[x][0];
  var r : f32 = dft.data[x][1];
  var a : f32 = sqrt(q*q + r*r) / params.scaleFactor;
  var p : f32 = (atan2(r, q) / PI + 1.0) / 2.0 ;
  var colourR: vec3<f32> = vec3<f32>(0.4,0.4,0.4);
  var colourI: vec3<f32> = vec3<f32>(0.4,0.4,0.3);
  var colourA: vec3<f32> = vec3<f32>(1.0,1.0,0.0);
  return 0.0 * colourAt_amp(q, h, colourR, p)
       + 0.0 * colourAt_amp(r, h, colourI, p)
       + colourAt_amp(a, h, colourA, p)
       ; //colourAt_phase(p, a, h);
}

[[stage(fragment)]]
fn frag_main([[location(0)]] uv: vec2<f32>) -> [[location(0)]] vec4<f32> {
  var x: u32 = u32(round(uv[0] * globals.nSamples));
  return 0.3 * colourAt(x - 2u, uv[1])
       + 0.6 * colourAt(x - 1u, uv[1])
       + 1.0 * colourAt(x,      uv[1])
       + 0.6 * colourAt(x + 1u, uv[1])
       + 0.3 * colourAt(x + 2u, uv[1]);
}

