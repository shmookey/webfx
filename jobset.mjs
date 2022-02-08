
export class JobSet {
  #jobs = []
  #nextJobID = 0

  constructor() {

  }

  get all() {
    return this.#jobs.map(x => x.spec)
  }

  add(spec) {
    const id = this.#nextJobID
    this.#nextJobID++
    this.#jobs.push({ id, spec, active: true })
    return id
  }

  get(id) {
    const idx = this.#jobs.findIndex(x => x.id == id || x.spec == id)
    if(idx == -1) throw 'No such job.'
    return this.#jobs[idx]
  }

  getIndex(id) {
    const idx = this.#jobs.findIndex(x => x.id == id || x.spec == id)
    if(idx == -1) throw 'No such job.'
    return idx
  }

  remove(id) {
    const idx = this.getIndex(id)
    this.#jobs.splice(idx, 1)
  }

  run() {
    
  }
}

