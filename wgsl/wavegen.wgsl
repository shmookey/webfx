var<private> PI : f32 = 3.1415926538;

// Generate samples for a waveform described by the sum of up to 4 sine waves.
// Each component sine wave is parameterised with three variables A, B, and C:
//     A*sin(B*x + C)
// The `params` uniform is a matrix of 4 rows of 3 columns [A, B, C]
[[block]] struct Params {
  q : mat3x4<f32>;
  t : f32;
};
[[block]] struct Waveform {
  data : array<f32, 512>;
};
[[binding(0), group(0)]] var<uniform> params : Params;
[[binding(1), group(0)]] var<storage, write> wave : Waveform;

[[stage(compute), workgroup_size(128)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
  var index : u32 = GlobalInvocationID.x;
  var time : f32 = f32(index)/512.0 * PI*2.0;
  wave.data[index] = params.q[0][0] * sin(params.q[1][0] * (time + params.q[2][0] + params.t))
                   + params.q[0][1] * sin(params.q[1][1] * (time + params.q[2][1] + params.t))
                   + params.q[0][2] * sin(params.q[1][2] * (time + params.q[2][2] + params.t))
                   + params.q[0][3] * sin(params.q[1][3] * (time + params.q[2][3] + params.t));
}


