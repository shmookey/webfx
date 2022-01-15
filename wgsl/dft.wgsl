var<private> PI : f32 = 3.1415926538;
[[block]] struct Params {
  iStart : u32; // Starting index in waveform data for input
  iSize  : u32; // Length of input
  oStart : u32; // Starting index in DFT data for output
  oSize  : u32; // Length of output
  fMax   : f32; // Top of frequency range
};
[[block]] struct Buffer {
  data : array<f32>;
};

[[group(0), binding(0)]] var<uniform>        params : Params;
[[group(0), binding(1)]] var<storage, read>  wave   : Buffer;
[[group(0), binding(2)]] var<storage, write> dft    : Buffer;

[[stage(compute), workgroup_size(128)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
  var i  : i32 = i32(GlobalInvocationID.x) % 512;
  var k  : f32 = params.fMax * f32(i) / f32(params.oSize);
  var N  : f32 = f32(params.iSize);
  var q  : f32 = 2.0 * PI / N;
  var re : f32 = 0.0;
  var im : f32 = 0.0;
  for(var n: i32 = 0; n < i32(N); n = n + 1) {
    var xn = wave.data[params.iStart+u32(n)];
    re = re + xn * cos(q * k * f32(n));
    im = im - xn * sin(q * k * f32(n));
  }
  dft.data[params.oStart + u32(i*2)]     = sqrt(re*re + im*im)/512.0;
  dft.data[params.oStart + u32(i*2 + 1)] = atan2(im, re);
}

