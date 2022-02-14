const {PI, sin, cos, fround, round, random} = Math

const predefinedColours = [
  [0,   0,   1  ],
  [0,   1,   0  ],
  [1,   0,   0  ],
  [0,   1,   1  ],
  [1,   0,   1  ],
  [1,   1,   0  ],
  [0.3, 0.7, 0.7],
  [0.7, 0.3, 0.7],
  [0.7, 0.7, 0.3],
  [0.2, 0.4, 0.8],
  [0.2, 0.8, 0.4],
  [0.4, 0.2, 0.8],
  [0.4, 0.8, 0.2],
  [0.8, 0.2, 0.4],
  [0.8, 0.4, 0.2],
]


export function* colourGenerator() {
  for(let colour of predefinedColours) {
    yield colour
  }
  while(true) {
    yield [random(), random(), random()]
  }
}

export function* groundPositionGenerator() {
  let angle = 0
  let dist  = 0
  const y = 0
  yield [dist*sin(angle), y, dist*cos(angle)].map(x => roundTo(x, 4))
  dist = 1
  while(true) {
    dist += 0.2
    angle += PI/3
    yield [dist*sin(angle), y, dist*cos(angle)].map(x => roundTo(x, 4))
  }
}

export function* skyPositionGenerator() {
  let angle = 0
  let dist  = 0
  yield [dist*sin(angle), 80, dist*cos(angle)].map(x => roundTo(x, 4))
  dist = 4
  while(true) {
    dist += 4
    angle += PI/3.5
    yield [dist*sin(angle), 80, dist*cos(angle)].map(x => roundTo(x, 4))
  }
}

function roundTo(x, n) {
  const m = 10**n
  return round(m*x)/m
}

export async function fetchImage(url) {
  const image = new Image()
  return new Promise((resolve, reject) => {
    image.onload = async () => {
      await image.decode()
      const bmp = await createImageBitmap(image)
      resolve(bmp)
    }
    image.src = url
  })
}

