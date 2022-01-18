var<private> PI : f32 = 3.1415926538;
[[block]] struct Params {
  iSize  : u32; // Length of input
  oSize  : u32; // Length of output
  fMax   : f32; // Top of frequency range
};
[[block]] struct Buffer {
  data : array<f32>;
};

[[group(0), binding(0)]] var<uniform>             params : Params;
[[group(0), binding(1)]] var<storage, read_write> wave   : Buffer;
[[group(0), binding(2)]] var<storage, read_write> output : Buffer;
[[group(0), binding(3)]] var<storage, read_write> complexOutput : Buffer;

[[stage(compute), workgroup_size(128)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
  var i  : i32 = i32(GlobalInvocationID.x);
  var k  : f32 = params.fMax * f32(i) / f32(params.oSize);
  var N  : f32 = f32(params.iSize);
  var q  : f32 = 2.0 * PI / N;
  var re : f32 = 0.0;
  var im : f32 = 0.0;
  for(var n: i32 = 0; n < i32(N); n = n + 1) {
    var xn = wave.data[n];
    re = re + xn * cos(q * k * f32(n));
    im = im - xn * sin(q * k * f32(n));
  }
  complexOutput.data[i*2]     = re;
  complexOutput.data[i*2 + 1] = im;
  output.data[i*2]       = sqrt(re*re + im*im)/512.0;
  output.data[i*2 + 1]   = atan2(im, re);
}

