const { EventEmitter2 } = require('eventemitter2')

const setState = Symbol('SetState');

const isFunc = (maybeFunc) => typeof maybeFunc == 'function';
const isObj = (maybeObj) => typeof maybeObj == 'object';

/**
 * DispatchableStore class
 */
class DispatchableStore extends EventEmitter2 {
  /**
   * @constructor
   * @param {Object} initialState
   */
  constructor(initialState = {}) {
    super({ wildcard: false, maxListeners: 100, verboseMemoryLeak: true })
    if (!isObj(initialState)) {
      throw new TypeError('Expected a object')
    }
    this.state = initialState
    this.chains = {}
  }

  /**
   * @return {Object} state
   * @example
   *
   * store.getState()
   */
  getState() {
    return this.state
  }

  /**
   * @desc register a reducer to self
   * @param {Object} reducer
   * @example
   *
   * store.register({
   *    [actions.A]: (prevState, payload) => {
   *       return Object.assign({}, prevState, { ...payload })
   *    }
   * })
   */
  register(reducer) {
    if (!isObj(reducer)) {
      throw new TypeError('Expected a object')
    }
    this.reducer = reducer
  }

  /**
   * @desc dispatch to subscriber
   * @param {Object} action
   * @param {boolean} [chaind=false]
   * @example
   *
   * store.dispatch({
   *   type: actions.A,
   *   payload: {
   *     count: 1,
   *   }
   * })
   */
  dispatch(action, chained = false) {
    // merge chain status
    const act = Object.assign({}, action, { '@@chained': chained })

    // validate reducer
    if (isFunc(this.reducer[act.type])) {
      this[setState](this.reducer[act.type](this.state, act.payload), act)
    } else {
      console.warn(`'${act.type}' action is not registered in reducer.`)
    }

    // recursive call actions by chains
    if (Array.isArray(this.chains[act.type])) {
      this.chains[act.type].forEach(a => this.dispatch(a, true))
    }
  }

  /**
   * @desc register a chain action to self.
   * @param {string} action name
   * @param {Object} execution aciton
   * @example
   *
   * store.chain(actions.A, {
   *   type: actions.B,
   *   payload: {
   *     count: 1,
   *   }
   * })
   */
  chain(from, action) {
    this.chains[from] = this.chains[from] || []
    this.chains[from].push(action)
  }

  /**
   * @function
   * @name subscribe
   * @memberof DispatchableStore
   * @desc call the callback function if changed the state.
   * but, doesn't called it,if state is not modified.
   * @param {Function} stateMapper - state => ({ state.anyProperty })
   * @example
   *
   * store.subscribe(state => state)((action, prev, state) => {
   *   console.log(action, prev, state)
   * })
   */
  subscribe = (stateMapper) => (callback) => {
    this.on('change', ({ action, prev, state }) => {
      const target = stateMapper(state)
      const prevTarget = stateMapper(prev)
      if (target !== prevTarget) callback(action, prevTarget, target)
    })
  }

  /**
    * @function
    * @name setState
    * @memberof DispatchableStore
    * @desc update state of self
    * @private
    * @param {Object} action
    * @param {Object} prev
    * @param {Object} state
    */
  [setState] = (nextState, action) => {
    const prev = this.state
    this.state = nextState
    this.emit('change', { action, prev, state: nextState })
  }
}

module.exports = DispatchableStore
