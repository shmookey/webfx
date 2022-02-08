import {update} from '/model/state.mjs'

const pendingActions = []

window.post = action => pendingActions.push(action)

export function flush() {
  let [state, effects] = pendingActions.reduce(([state, effects], action) => {
    let [state2, fx] = update(state, action)
    return [state2, [...effects, ...fx]]
  }, [webfx.model, []])
 pendingActions.splice(0,9999) 
 for(let effect of effects) {
    webfx.currentView.apply(effect)
  }
  webfx.model = state
}

function applyEffect(effect) {
  switch(effect.type) {

  }
}


