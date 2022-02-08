import {mat4, vec4, vec3} from '/gl-matrix/dist/esm/index.js'

const {PI, sin, cos} = Math

export const cube = new Float32Array([
  -0.5, -0.5,  0.5, 0, 0,  // Front face
   0.5, -0.5,  0.5, 1, 0,
   0.5,  0.5,  0.5, 1, 1,
  -0.5, -0.5,  0.5, 0, 0,
   0.5,  0.5,  0.5, 1, 1,
  -0.5,  0.5,  0.5, 0, 1,

  -0.5, -0.5, -0.5, 1, 0,  // Back face
   0.5,  0.5, -0.5, 0, 1,
   0.5, -0.5, -0.5, 0, 0,
  -0.5, -0.5, -0.5, 1, 0,
  -0.5,  0.5, -0.5, 1, 1,
   0.5,  0.5, -0.5, 0, 1,

  -0.5, -0.5,  0.5, 1, 0, // Left face
  -0.5,  0.5,  0.5, 1, 1,
  -0.5,  0.5, -0.5, 0, 1,
  -0.5, -0.5,  0.5, 1, 0,
  -0.5,  0.5, -0.5, 0, 1,
  -0.5, -0.5, -0.5, 0, 0,

   0.5, -0.5,  0.5, 0, 0, // Right face
   0.5,  0.5, -0.5, 1, 1,
   0.5,  0.5,  0.5, 0, 1,
   0.5, -0.5,  0.5, 0, 0,
   0.5, -0.5, -0.5, 1, 0,
   0.5,  0.5, -0.5, 1, 1,

  -0.5,  0.5, -0.5, 0, 0, // Top face
  -0.5,  0.5,  0.5, 0, 1,
   0.5,  0.5,  0.5, 1, 1,
  -0.5,  0.5, -0.5, 0, 0,
   0.5,  0.5,  0.5, 1, 1,
   0.5,  0.5, -0.5, 1, 0,

  -0.5, -0.5, -0.5, 0, 1, // Bottom face
   0.5, -0.5,  0.5, 1, 0,
  -0.5, -0.5,  0.5, 0, 0,
  -0.5, -0.5, -0.5, 0, 1,
   0.5, -0.5, -0.5, 1, 1,
   0.5, -0.5,  0.5, 1, 0,
])


// Create (triangle) vertices for a planar grid at y=0 centered on the origin
export function makeGrid(width, depth, tickSpacing, lineThickness) {
  const w = lineThickness / 2
  const U = w * 8  // for thick lines through origin
  const u = w * 4  // for emphasised lines
  const vertices = [
  // Z Axis
          -U,    0,    -depth/2,   1,
          -U,    0,     depth/2,   1,
           U,    0,     depth/2,   1,
          -U,    0,    -depth/2,   1,
           U,    0,     depth/2,   1,
           U,    0,    -depth/2,   1,
  // X Axis
    -width/2,    0,          -U,   1,
    -width/2,    0,           U,   1,
     width/2,    0,           U,   1,
    -width/2,    0,          -U,   1,
     width/2,    0,           U,   1,
     width/2,    0,          -U,   1,
  // Near Border
//    -width/2,    0,    -depth/2,   1,
//     width/2,    0,    -depth/2,   1,
//  // Right Border
//     width/2,    0,    -depth/2,   1,
//     width/2,    0,     depth/2,   1,
//  // Far Border
//     width/2,    0,     depth/2,   1,
//    -width/2,    0,     depth/2,   1,
//  // Left Border
//    -width/2,    0,     depth/2,   1,
//    -width/2,    0,    -depth/2,   1,
  ]
  for(let x=tickSpacing, i=1; x<=width/2; x += tickSpacing, i++) {
    const W = i % 5 == 0 ? u : w
    vertices.push(
        x-W, 0,  depth/2, 1,
        x+W, 0, -depth/2, 1,
        x-W, 0, -depth/2, 1,
        x-W, 0,  depth/2, 1,
        x+W, 0,  depth/2, 1,
        x+W, 0, -depth/2, 1,
       -x-W, 0,  depth/2, 1,
       -x+W, 0, -depth/2, 1,
       -x-W, 0, -depth/2, 1,
       -x-W, 0,  depth/2, 1,
       -x+W, 0,  depth/2, 1,
       -x+W, 0, -depth/2, 1,
    )          
  }
  for(let z=tickSpacing, i=1; z<=depth/2; z += tickSpacing, i++) {
    const W = i % 5 == 0 ? u : w
    vertices.push(
       width/2, 0,   z-W, 1,
      -width/2, 0,   z-W, 1,
      -width/2, 0,   z+W, 1,
       width/2, 0,   z-W, 1,
      -width/2, 0,   z+W, 1,
       width/2, 0,   z+W, 1,
       width/2, 0,  -z-W, 1,
      -width/2, 0,  -z-W, 1,
      -width/2, 0,  -z+W, 1,
       width/2, 0,  -z-W, 1,
      -width/2, 0,  -z+W, 1,
       width/2, 0,  -z+W, 1,
      
    )          
  }
  return new Float32Array(vertices)
}

export function rect(x, y, w, h) {
  return [
    x,   y,   0, 1, 0, 0,
    x+w, y+h, 0, 1, 1, 1,
    x+w, y,   0, 1, 1, 0,
    x,   y,   0, 1, 0, 0,
    x,   y+h, 0, 1, 0, 1,
    x+w, y+h, 0, 1, 1, 1,
  ]
}

function normalise(vec) {
  const tmp = vec3.create()
  vec3.normalize(tmp, vec)
  return vec
}

export function polygonPrism(n) {
  const theta  = 2*PI / n
  const points = []
  const up     = [0,  1, 0]
  const down   = [0, -1, 0]
  const p0     = [0, -1, 0, ...down, 0.5, 0.5]
  const p3     = [0,  1, 0, ...up,   0.5, 0.5]
  const add    = (p, u, v) => [...p, (u+1)/2, (v+1)/2]
  for(let i=0; i<n; i++) {
    const j   = i+1
    const k   = i+0.5
    const p1  = [sin(i*theta), -1, cos(i*theta), ...normalise([sin(i*theta), -1, cos(i*theta)])]
    const p2  = [sin(j*theta), -1, cos(j*theta), ...normalise([sin(j*theta), -1, cos(j*theta)])]
    const p4  = [sin(i*theta),  1, cos(i*theta), ...normalise([sin(i*theta),  1, cos(i*theta)])]
    const p5  = [sin(j*theta),  1, cos(j*theta), ...normalise([sin(j*theta),  1, cos(j*theta)])]
    const out = [sin(k*theta),  0,   cos(k*theta)]
    points.push(...[
      p0,            add(p1, p1[0], p1[2]), add(p2, p2[0], p2[2]),
      p3,            add(p4, p4[0], p4[2]), add(p5, p5[0], p5[1]),
      add(p1, 0, 0), add(p2, 1,     0    ), add(p4, 0,     1    ),
      add(p2, 1, 0), add(p5, 1,     1    ), add(p4, 0,     1    ),
    ].flat())
  }
  return new Float32Array(points)
}

export function transform(mesh, matrix) {
  const normalMatrix = mat4.create()
  mat4.invert(normalMatrix, matrix)
  mat4.transpose(normalMatrix, normalMatrix)
  for(let i=0; i<mesh.length; i += 8) {
    const norm = [...mesh.slice(i+3, i+6),0]
    const xyzw = [...mesh.slice(i, i+3),1]
    const tmpN  = vec4.create()
    const tmpP  = vec4.create()
    vec4.transformMat4(tmpP, xyzw, matrix)
    vec4.transformMat4(tmpN,  norm, normalMatrix)
    mesh.set(tmpP.slice(0, 3), i)
    mesh.set(tmpN.slice(0, 3), i+3)
  }
  return mesh
}

export function antenna() {
  const matrix = mat4.create()
  const core   = polygonPrism(16)
  const armPieces = []
  let nVertices = core.length
  mat4.translate(matrix, matrix, [0, 0.3, 0])
  mat4.scale(matrix, matrix, [0.4, 0.4, 0.4])
  transform(core, matrix)
  const theta  = 2*PI / 6
  for(let i=0; i<6; i+=1) {
    const lowStrut = polygonPrism(12)
    const j = i * theta
    const k = (i+0.5) * theta
    let outScale = i % 3 == 0 ? 0.7 : 1.1
    let outMove = i % 3 == 0 ? 0.5 : 0.8
    let bend = i % 3 == 0      ? 0.0
             : i == 1 | i == 4 ? -0.13*PI
             :                    0.13*PI
    const axis = [outMove*sin(j), 0, 1.5*outMove*cos(j)]
    mat4.identity(matrix)
    mat4.translate(matrix, matrix, axis)
    mat4.translate(matrix, matrix, [0, 0.1, 0])
    mat4.rotateY(matrix, matrix, i*PI/3 + bend)
    mat4.scale(matrix, matrix, [0.07, 0.07, outScale])
    mat4.rotateY(matrix, matrix, PI/2)
    mat4.rotateZ(matrix, matrix, PI/2)
    mat4.rotateY(matrix, matrix, PI/4)
    transform(lowStrut, matrix)
    armPieces.push(lowStrut)
    nVertices += lowStrut.length
    
    const highStrut = polygonPrism(12)
    outScale = i % 3 == 0 ? 0.8 : 1.35
    outMove = i % 3 == 0 ? 0.9 : 1.1
    mat4.identity(matrix)
    mat4.translate(matrix, matrix, axis)
    mat4.translate(matrix, matrix, [0, 0.8, 0])
    mat4.rotateY(matrix, matrix, i*PI/3 + bend)
    mat4.rotateX(matrix, matrix, -PI/6)
    mat4.scale(matrix, matrix, [0.07, 0.07, outScale])
    mat4.rotateY(matrix, matrix, PI/2)
    mat4.rotateZ(matrix, matrix, PI/2)
    mat4.rotateY(matrix, matrix, PI/4)
    transform(highStrut, matrix)
    armPieces.push(highStrut)
    nVertices += highStrut.length
    
    bend = i % 3 == 0      ? 0.0
         : i == 1 | i == 4 ? -0.10*PI
         :                    0.10*PI

    const leg = polygonPrism(8)
    outScale = i % 3 == 0 ? 1.6 : 2.2
    mat4.identity(matrix)
    mat4.translate(matrix, matrix, [sin(j+bend)*outScale, 0.2, cos(j+bend)*outScale])
    mat4.scale(matrix, matrix, [0.2, 1.35, 0.2])
    mat4.rotateY(matrix, matrix, PI/4)
    transform(leg, matrix)
    armPieces.push(leg)
    nVertices += leg.length
    
    const foot = polygonPrism(10)
    outScale = i % 3 == 0 ? 1.6 : 2.2
    mat4.identity(matrix)
    mat4.translate(matrix, matrix, [sin(j+bend)*outScale, -1, cos(j+bend)*outScale])
    mat4.scale(matrix, matrix, [0.4, 0.03, 0.4])
    mat4.rotateY(matrix, matrix, PI/4)
    transform(foot, matrix)
    armPieces.push(foot)
    nVertices += foot.length
  }
  const mesh = new Float32Array(nVertices)
  mesh.set(core)
  for(let i=0, p=core.length; i<armPieces.length; i++) {
    const piece = armPieces[i]
    mesh.set(piece, p)
    p += piece.length
  }
  mat4.identity(matrix)
  mat4.translate(matrix, matrix, [0, 1, 0])
  mat4.rotate(matrix, matrix, PI/2, [0, 1, 0])
  transform(mesh, matrix)
  return mesh
}


/** `globe(K,J)` creates a unit sphere from lines of latitude and longitude.

`K` is the number of lines of latitude on one hemisphere, equator excluded.
Thus the total number of lines of latitude on both hemispheres including the
equator is `2K+1`. `J` is the total number of lines of longitude. Minimum
values for K and J are 1 and 2, respectively.

Generates primitives in the form of a triangle list. Vertices have following
attributes:

NAME     TYPE      OFFSET   SIZE    DESCRIPTION
position float32x3      0     12    XYZ position
latlong  float32x2     12      8    Latitude and longitude (radians)
normal   float32x3     20     12    Normal vector
uv       float32x2     32      8    Segment UV (for drawing wireframes)

The number of primitives, vertices, floats and bytes generated can be
calculated as:

  nPrimitives = 2J(2K+1)
  nVertices   = 6J(2K+1)
  nFloats     = 60J(2K+1)
  byteLength  = 240J(2K+1)

*/
export function globe(lats, longs) {
  const totalLats  = 2 * lats + 1   // Total lines of latitude
  const vDivs      = totalLats + 1  // Number of vertical divisions, pole to pole
  const vDivAngle  = PI / vDivs     // Angle between vertical divisions
  const hDivAngle  = 2*PI / longs   // Angle between horizontal divisions

  // For each line of latitude, make a list of `longs` points.
  const latPoints = new Array(totalLats).fill(null).map(() => new Array(longs))
  for(let i=-lats; i<=lats; i++) {
    const array  = latPoints[i + lats] // Array to fill
    const decl   = i * vDivAngle       // Angle of declination from centre of sphere
    const radius = cos(decl)           // Radius of latitude circle
    const y      = sin(decl)           // Y coordinate for latitude circle
    for(let j=0; j<longs; j++) {
      const asc = j * hDivAngle        // Right ascension
      const x   = radius * sin(asc)    // X coordinate for point
      const z   = radius * cos(asc)    // Z coordinate for point
      array[j] = [x,y,z,decl,asc,x,y,z]
    }
  }

  // Points in a latitude circle (excluding the highest latitude) correspond to
  // the lower left hand point of a rectangle, and thus two triangles. Points
  // on the upper and lower latitudes generate an additional triangle at the
  // poles. Although longitude is not well defined at the poles, the tips of
  // these triangles is assigned a longitude at the midpoint of its two base
  // vertices.

  // Generate the rectangle segments first.
  const data = new Float32Array(60*longs*(2*lats+1))
  const len  = 60 * longs                             // Floats per latitude pair
  for(let i=-lats; i<=lats-1; i++) {
    const idx   = i + lats                            // Lower latitude index
    const array = data.subarray(idx*len, (idx+1)*len) // Storage for latitude pair
    const lower = latPoints[idx]                      // Lower latitude point array
    const upper = latPoints[idx+1]                    // Upper latitude point array
    for(let j=0; j<longs; j++) {                      // j is index of left longitude
      const k   = (j+1) % longs                       // k is index of right longitude
      const buf = array.subarray(j*60, (j+1)*60)      // Storage for 2-triangle segment
      const tl  = upper[j]                            // Top left vertex of segment
      const tr  = upper[k]                            // Top right vertex of segment
      const bl  = lower[j]                            // Bottom left vertex of segment
      const br  = lower[k]                            // Bottom right vertex of segment
      const norm = calcNormal(tr,bl,tl)               // Find normal for segment
      buf.set([
        ...bl, 0, 0,
        ...tr, 1, 1,
        ...tl, 0, 1,
        ...bl, 0, 0,
        ...br, 1, 0,
        ...tr, 1, 1,
      ])
    }
  }

  // Generate the triangle segments at the poles
  const lower = latPoints[0]                       // Lower latitude point array
  const upper = latPoints[totalLats-1]             // Upper latitude point array
  const array = data.subarray(len*2*lats)          // Storage for triangle segments
  for(let j=0; j<longs; j++) {                     // j is index of left longitude
    const k     = (j+1) % longs                    // k is index of right longitude
    const buf   = array.subarray(60*j,60*(j+1))    // Storage for N+S polar triangles
    const np1   = upper[j]                         // North point 1
    const np2   = upper[k]                         // North point 2
    const sp1   = lower[j]                         // South point 1
    const sp2   = lower[k]                         // South point 2
    const asc   = np1[4] + hDivAngle/2             // Midpoint longitude
    const np    = [0,  1, 0, PI/2, asc, 0,  1, 0]  // North pole
    const sp    = [0, -1, 0, PI/2, asc, 0, -1, 0]  // South pole
    buf.set([
      ...np1, 0, 0,
      ...np2, 1, 0,
      ...np,  0, 1, // False right-angle in UV for simpler wireframe drawing
      ...sp1, 1, 0,
      ...sp,  0, 1, 
      ...sp2, 0, 0,
    ])
  }

  return data
}

function calcNormal(p1, p2, p3) {
  const v1 = [p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2]]
  const v2 = [p3[0]-p1[0], p3[1]-p1[1], p3[2]-p1[2]]
  const v3 = vec3.create()
  vec3.cross(v3, v2, v1)
  return v3
}

