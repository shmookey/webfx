struct VertexOutput {
  [[builtin(position)]] position: vec4<f32>;
  [[location(0)]]       uv:       vec2<f32>;
};
[[block]] struct Viewport {
  size: vec2<f32>;
};
[[group(0), binding(0)]] var<uniform> viewport: Viewport;

fn fromScreenCoords(position: vec4<f32>) -> vec4<f32> {
  var xy: vec2<f32> = (position.xy / viewport.size) 
                    * vec2<f32>(2.0, -2.0)
                    + vec2<f32>(-1.0, 1.0);
  return vec4<f32>(xy, position.zw);
}

[[stage(vertex)]]
fn vert_main([[location(0)]] position: vec4<f32>,
             [[location(1)]] uv: vec2<f32>) -> VertexOutput {
  var output : VertexOutput;
  output.position = fromScreenCoords(position);
  output.uv = uv;
  return output;
}

[[stage(fragment)]]
fn frag_main([[location(0)]] uv: vec2<f32>) -> [[location(0)]] vec4<f32> {
  return vec4<f32>(uv, uv.x, 1.0);
}


