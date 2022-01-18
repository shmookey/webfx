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
  for(var m: u32 = 0u; m < params.size; m = m + 1u) {
    var a : vec2<f32> = inputA.data[n - m];
    var b : vec2<f32> = vec2<f32>(0.0, 0.0);
    //if(m + n < 512u) { 
      b = inputB.data[n];
    //}
    r = r + mul(conj(a), b);
  }
  //output.data[n] = r / 100000.0;
  var re = r[0];
  var im = r[1];
  output.data[n][0]   = re / 2000.0; //sqrt(re*re + im*im)/512.0 / 50.0;
  output.data[n][1]   = im / 2000.0; ///atan2(im, re);
}


//[[block]] struct Buffer {
//  data : array<f32>;
//};
//
////fn conj(x: vec2<f32>) -> vec2<f32> {
////  return vec2<f32>(x[0], -x[1]);
////}
////fn mul(x: vec2<f32>, y: vec2<f32>) -> vec2<f32> {
////  return vec2<f32>(x[0]*y[0] - x[1]*y[1], x[0]*y[1] + y[0]*x[1]);
////}
//
//[[group(0), binding(0)]] var<uniform>              params : Params;
//[[group(0), binding(1)]] var<storage, read_write>  inputA : Buffer;
//[[group(0), binding(2)]] var<storage, read_write>  inputB : Buffer;
//[[group(0), binding(3)]] var<storage, read_write>  output : Buffer;
//
//[[stage(compute), workgroup_size(128)]]
//fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
//  var n : u32       = GlobalInvocationID.x;
//  var r : vec2<f32> = vec2<f32>(0.0,0.0); //vec2<f32>(0.0, 0.0);
//  
//  //var a : f32 = inputA.data[(u32(n - 21u)) % u32(params.size)];
//  //var a : f32 = inputA.data[(u32(n )) % u32(params.size)];
//  //var b : f32 = inputB.data[(u32(n)) % u32(params.size)];
//  for(var m: u32 = u32(0); m < params.size; m = m + u32(1)) {
//    var a : f32 = inputA.data[u32(m)];
//    var aa : vec2<f32> = vec2<f32>(a, cos(a));
//    var i : u32 = m + n - u32(0) ;
//    //if(i > params.size) { i = u32(512) - (i % u32(512)); }
//    var b : f32 = inputB.data[i ];
//    var bb : vec2<f32> = vec2<f32>(b, cos(b));
//    r = r + mul(conj(aa), bb);
//  }
//  //output.data[n] = r / 100.0;
//  var re = r[0];
//  var im = r[1];
//  output.data[n] = sqrt(re*re + im*im)/256.0;
//
//}


