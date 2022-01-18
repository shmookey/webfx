var<private> PI : f32 = 3.1415926538;

[[block]] struct Params {
  delays : vec4<f32>; // Phase offset for each input
  losses : vec4<f32>;
};
[[block]] struct Buffer {
  data : array<f32>;
};

[[group(0), binding(0)]] var<uniform>             params : Params;
[[group(0), binding(1)]] var<storage, read_write> inputA : Buffer;
[[group(0), binding(2)]] var<storage, read_write> inputB : Buffer;
[[group(0), binding(3)]] var<storage, read_write> inputC : Buffer;
[[group(0), binding(4)]] var<storage, read_write> inputD : Buffer;
[[group(0), binding(5)]] var<storage, read_write> output : Buffer;

[[stage(compute), workgroup_size(128)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
  var idx : i32 = i32(GlobalInvocationID.x);

  //var rDelays : vec4<f32> = params.delays * 512.0;
  var sDelays : vec4<i32> = vec4<i32>(params.delays * 512.0);
  var offsets : vec4<i32> = (sDelays + idx + 512) % 512;

  output.data[idx] = inputA.data[offsets[0]] * params.losses[0]
                   + inputB.data[offsets[1]] * params.losses[1]
                   + inputC.data[offsets[2]] * params.losses[2]
                   + inputD.data[offsets[3]] * params.losses[3];
}


