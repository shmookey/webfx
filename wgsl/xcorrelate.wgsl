[[block]] struct Params {
  size    : u32; // Length of data (in vec2<f32> pairs)
};
[[block]] struct Buffer {
  data : array<vec2<f32>>;
};

fn conj(x: vec2<f32>) -> vec2<f32> {
  return vec2<f32>(x[0], -x[1]);
}
fn mul(x: vec2<f32>, y: vec2<f32>) -> vec2<f32> {
  return vec2<f32>(x[0]*y[0] - x[1]*y[1], x[0]*y[1] + y[0]*x[1]);
}

[[group(0), binding(0)]] var<uniform>              params : Params;
[[group(0), binding(1)]] var<storage, read_write>  inputA : Buffer;
[[group(0), binding(2)]] var<storage, read_write>  inputB : Buffer;
[[group(0), binding(3)]] var<storage, read_write>  output : Buffer;

[[stage(compute), workgroup_size(128)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
  var n : u32       = GlobalInvocationID.x;
  var r : vec2<f32> = vec2<f32>(0.0, 0.0);
  for(var m: u32 = u32(0); m < params.size; m = m + u32(1)) {
    var a : vec2<f32> = inputA.data[m];
    var b : vec2<f32> = inputB.data[(m + n) % params.size];
    r = r + mul(conj(a), b);
  }
  output.data[n] = r;
}


