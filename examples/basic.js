const ObservableStore = require('../lib')

const observableStore = new ObservableStore({
  foo: 0,
  bar: 0,
});

const actions = {
  A: 'A',
  B: 'B',
  C: 'C',
}

observableStore.subscribe(state => state)((action, prevState, state) => {
  console.log('chained', action['@@chained'])
  console.log({ state })
});

observableStore.register({
  [actions.A]: (prevState, payload) => {
    console.log('rendering map')
    return Object.assign({}, prevState, { ...payload })
  },
  [actions.B]: (prevState, payload) => {
    console.log('after rendered map')
    return Object.assign({}, prevState, { ...payload })
  },
  [actions.C]: (prevState, payload) => {
    console.log('after after rendered map')
    return Object.assign({}, prevState, { ...payload })
  },
})

observableStore.chain(actions.B, {
  type: actions.C,
  payload: {
    bar: 2,
    foo: 2,
  }
})

observableStore.chain(actions.A, {
  type: actions.B,
  payload: {
    bar: 1,
  },
})

console.log('DISPATCH A action')
observableStore.dispatch({
  type: actions.A,
  payload: {
    foo: 1,
  },
})

console.log("\n\n")
console.log('DISPATCH B action')
observableStore.dispatch({
  type: actions.B,
  payload: {
    foo: 1,
  },
})
