var<private> PI : f32 = 3.1415926538;

// Generate samples for a waveform described by the sum of up to 4 sine waves.
// Each component sine wave is parameterised with three variables A, B, and C:
//     A*sin(B*x + C)
// The `params` uniform is a matrix of 4 rows of 3 columns [A, B, C]
[[block]] struct Params {
  q : mat3x4<f32>;
};
[[block]] struct Globals {
  size : f32;
  time : f32;
};
[[block]] struct Buffer {
  data : array<f32>;
};
[[binding(0), group(0)]] var<uniform>        params  : Params;
[[binding(1), group(0)]] var<storage, write> wave    : Buffer;
[[binding(2), group(0)]] var<uniform>        globals : Globals;

[[stage(compute), workgroup_size(128)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
  var x  : u32 = GlobalInvocationID.x;
  var ph : f32 = f32(x)/globals.size * PI*2.0;
  var t  : f32 = globals.time;
  wave.data[x] = params.q[0][0] * sin(params.q[1][0] * (ph + params.q[2][0] + t))
               + params.q[0][1] * sin(params.q[1][1] * (ph + params.q[2][1] + t))
               + params.q[0][2] * sin(params.q[1][2] * (ph + params.q[2][2] + t))
               + params.q[0][3] * sin(params.q[1][3] * (ph + params.q[2][3] + t));
}


