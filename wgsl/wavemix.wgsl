var<private> PI : f32 = 3.1415926538;

[[block]] struct Params {
  inputs : vec2<u32>; // Index in waveform data for inA, inB
  delays : vec2<f32>; // Phase offset for each input
  losses : vec2<f32>;
  output : u32;       // Index in waveform data for output
};
[[block]] struct Waveform {
  data : array<f32>;
};

[[group(0), binding(0)]] var<uniform> params : Params;
[[group(0), binding(1)]] var<storage, read_write> wave : Waveform;

[[stage(compute), workgroup_size(128)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
  var idx : i32 = i32(GlobalInvocationID.x);

  var rDelays : vec2<f32> = params.delays / (2.0 * PI);
  var sDelays : vec2<i32> = vec2<i32>(rDelays * 512.0);
  var offsets : vec2<i32> = (sDelays + idx + 512) % 512;

  var pIn  : vec2<i32> = vec2<i32>(params.inputs) * 2048 + offsets;
  var pOut : i32       = i32(params.output) * 2048 + idx;

  wave.data[pOut] = wave.data[pIn[0]] * params.losses[0]
                  + wave.data[pIn[1]] * params.losses[1];
}


