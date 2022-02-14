[[block]] struct Globals {
  view:       mat4x4<f32>;
  projection: mat4x4<f32>;
  lightPos:   vec3<f32>;
};

[[block]] struct Params {
  model:  mat4x4<f32>;
  colour: vec4<f32>;
};

[[block]] struct Colours {
  fill:    vec4<f32>;
  outline: vec4<f32>;
  spot:    vec4<f32>;
};

struct FragmentOutput {
  [[location(0)]] colour: vec4<f32>;
  [[location(1)]] id:     u32;
};

[[group(1), binding(0)]] var<uniform> globals: Globals;
[[group(1), binding(1)]] var<uniform> params:  Params;
[[group(1), binding(2)]] var<uniform> colours: Colours;

[[stage(fragment)]]
fn main([[builtin(position)]] pos:      vec4<f32>,
        [[location(0)]]       normal:   vec3<f32>,
        [[location(1)]]       uv:       vec2<f32>,
        [[location(2)]]       worldPos: vec3<f32>) -> FragmentOutput {
  var output: FragmentOutput;
  var x = uv[0];
  var y = uv[1];

  output.colour = colours.fill + (globals.lightPos.x * 0.0 + params.colour * 0.0);

  if((x < 0.05 || x > 0.95 || y < 0.05 || y > 0.95) && colours.outline.a > 0.0) {
    output.colour = colours.outline;
  } else {
    var d = length(uv - 0.5); 
    if(d < 0.15 && colours.spot.a > 0.0) {
      output.colour = colours.spot;
    }
  } 
  

  // Spot
  //var d = length(uv - 0.5); 
  //  //fillColour = fillColour * 1.0 - spotColour.a;
  //} else {
  //  //spotColour = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  //}

  //output.colour = vec4<f32>(output.colour.xyz, 1.0);
  return output;
}

