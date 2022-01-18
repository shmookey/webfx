struct VertexOutput {
  [[builtin(position)]] Position : vec4<f32>;
  [[location(0)]] fragUV : vec2<f32>;
  [[location(1)]] instance : f32;
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
  var relSize : vec2<f32> = (a_size / viewport.size) * vec2<f32>(2.0,2.0);
  output.Position = vec4<f32>(relPos + a_uv * relSize * vec2<f32>(1.0,-1.0), 0.0, 1.0);
  output.fragUV = a_uv;
  output.instance = f32(inst);
  output.colour = a_colour;
  return output;
}

[[block]] struct Buffer {
  data : array<vec2<f32>>;
};
[[block]] struct InstanceMap {
  data : array<u32>;
};
[[group(0), binding(0)]] var<storage, read> dft : Buffer;
[[group(0), binding(1)]] var<storage, read> instanceMap : InstanceMap;

fn colourAt_phase(y: f32, A: f32, h: f32, i: u32) -> vec4<f32> {
  var Y : f32   = 0.88 - h;
  var dy : f32  = Y - (y / 30.0);
  var lvl : f32 = 0.0;
  //if(abs(dy) < 0.005) { lvl = 0.7; }
  var Q : f32 = max(0.0,min(1.0,pow(dy*100.0,3.0)));
  lvl = max(0.0,min(1.0,pow(1.0 - Q, 3.0)));
  if(A < 0.05) { lvl = 0.0; }
  var colour : vec3<f32> = vec3<f32>(1.0,0.0,0.0);
  return vec4<f32>(lvl * colour, lvl * 0.8);
}

fn colourAt_amp(y: f32, h: f32, i: u32) -> vec4<f32> {
  var Y : f32   = 1.5 - h*1.5;
  var dy : f32  = abs(Y - (y / 500.0)) / 2.5;
  var lvl : f32 = 0.0;
  //if(abs(dy) < 0.005) { lvl = 0.7; }
  var Q : f32 = max(0.0,min(1.0,pow(dy*65.0,2.0)));
  var colour : vec3<f32> = vec3<f32>(1.0,1.0,0.3);
  lvl = pow(1.0 - Q, 5.0);
  //if(lvl < 1.0) { lvl = 0.0; }
  return vec4<f32>(lvl * colour / 2.0, lvl*2.0);
}

fn colourAt(x: u32, h: f32, i: u32) -> vec4<f32> {
  var q : f32 = dft.data[i*1024u + x][0];
  var r : f32 = dft.data[i*1024u + x][1];
  var a : f32 = sqrt(q*q + r*r);
  var p : f32 = atan2(r, q);
  return colourAt_amp(a, h,i) + colourAt_phase(p, a, h, i);
}

[[stage(fragment)]]
fn frag_main([[location(0)]] uv: vec2<f32>,
             [[location(1)]] inst: f32,
             [[location(2), interpolate(flat)]] colour: vec3<f32>) -> [[location(0)]] vec4<f32> {
  var idx : u32 = instanceMap.data[u32(inst)];
  var x : u32   = u32(uv[0] * 512.0);
  //return colourAt(x, uv[1], inst, colour);
  return 0.3 * colourAt(x-u32(2), uv[1], idx)
       + 0.6 * colourAt(x-u32(1), uv[1], idx)
       + 1.0 * colourAt(x,        uv[1], idx)
       + 0.6 * colourAt(x+u32(1), uv[1], idx)
       + 0.3 * colourAt(x+u32(2), uv[1], idx);
  //var y : f32   = dft.data[inst*u32(512) + x][0];
  //if(uv[1] < 0.0) { return vec4<f32>(1.0,0.0,0.0,1.0); }
  //var Y : f32   = 1.0 - uv[1];
  //var dy : f32  = Y - y;
  //var lvl : f32 = 0.0;
  //if(abs(dy) < 0.005) { lvl = 0.7; }
  ////var Q : f32 = max(0.0,min(1.0,pow(dy*20.0,2.0)));
  ////lvl = pow(1.0 - Q, 3.0);
  ////if(lvl < 1.0) { lvl = 0.0; }
  //return vec4<f32>(lvl * colour / 2.0, lvl);
}

