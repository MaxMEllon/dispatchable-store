import test from 'ava'

const ObservableStore = require('../lib')

const actions = {
  A: 'A',
  B: 'B',
  C: 'C'
}

test.beforeEach(t => {
  t.context.store = new ObservableStore({
    foo: 0,
    bar: 0
  })
  t.context.store.register({
    [actions.A]: (prevState, payload) => Object.assign({}, prevState, { ...payload }),
    [actions.B]: (prevState, payload) => Object.assign({}, prevState, { ...payload }),
    [actions.C]: (prevState, payload) => prevState
  })
})

test('basic dispatch case', t => {
  const store = t.context.store
  store.subscribe(state => state.foo)((_1, _2, state) => t.is(state, 1))
  store.dispatch({
    type: actions.A,
    payload: {
      foo: 1
    }
  })
})

test('not updated case', t => {
  const store = t.context.store
  store.subscribe(state => state.foo)((_1, _2, _3) => {
    throw new Error('Unexpected calling')
  })
  store.dispatch({
    type: actions.C,
    payload: {
      foo: 1
    }
  })
  t.is(store.getState().foo, 0)
})

test('unsubscribe', t => {
  const store = t.context.store
  const callback = (_1, _2, state) => t.is(state, 1)
  store.subscribe(state => state.foo)(callback)
  store.dispatch({
    type: actions.A,
    payload: {
      foo: 1
    }
  })

  store.unsubscribe(callback)
  store.dispatch({
    type: actions.A,
    payload: {
      foo: 2
    }
  })
})

test('chain case', t => {
  const store = t.context.store
  store.subscribe(state => state)((action, _2, state) => {
    switch (action.type) {
      case actions.A:
        t.is(state.foo, 1)
        t.is(state.bar, 0)
        t.is(action['@@chained'], false)
        break
      case actions.B:
        t.is(state.foo, 1)
        t.is(state.bar, 1)
        t.is(action['@@chained'], true)
        break
    }
  })
  store.chain(actions.A, {
    type: actions.B,
    payload: {
      bar: 1
    }
  })
  store.dispatch({
    type: actions.A,
    payload: {
      foo: 1
    }
  })
})
