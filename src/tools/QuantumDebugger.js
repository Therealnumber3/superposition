const QuantumState = require('../core/QuantumState');

/**
 * Interactive debugger utility for stepping through quantum state transformations.
 */
class QuantumDebugger {
  /**
   * @param {QuantumState} initialState
   */
  constructor(initialState) {
    if (!(initialState instanceof QuantumState)) {
      throw new TypeError('QuantumDebugger requires an initial QuantumState.');
    }

    this.initialState = initialState.clone();
    this.currentState = initialState.clone();
    this.steps = [
      {
        type: 'init',
        label: 'initial',
        timestamp: Date.now(),
        state: this.currentState.clone(),
      },
    ];
    this.listeners = new Set();
  }

  /**
   * Apply a named transformation step.
   *
   * @param {string} label
   * @param {(state: QuantumState)=>QuantumState|any} transformFn
   * @returns {QuantumState}
   */
  step(label, transformFn) {
    if (typeof label !== 'string' || label.trim().length === 0) {
      throw new TypeError('step label must be a non-empty string.');
    }
    if (typeof transformFn !== 'function') {
      throw new TypeError('step transformFn must be a function.');
    }

    const input = this.currentState.clone();
    const result = transformFn(input);
    const output = result instanceof QuantumState ? result.clone() : input;

    if (!(output instanceof QuantumState)) {
      throw new Error('step transformFn must return a QuantumState or mutate provided state.');
    }

    this.currentState = output;
    this.steps.push({
      type: 'step',
      label,
      timestamp: Date.now(),
      state: this.currentState.clone(),
    });
    this._emit();
    return this.currentState.clone();
  }

  /**
   * Add a checkpoint marker without transformation.
   * @param {string} label
   */
  checkpoint(label) {
    if (typeof label !== 'string' || label.trim().length === 0) {
      throw new TypeError('checkpoint label must be a non-empty string.');
    }

    this.steps.push({
      type: 'checkpoint',
      label,
      timestamp: Date.now(),
      state: this.currentState.clone(),
    });
    this._emit();
  }

  /**
   * Measure and collapse current state.
   * @param {string} [label='measurement']
   * @returns {any}
   */
  measure(label = 'measurement') {
    if (typeof label !== 'string' || label.trim().length === 0) {
      throw new TypeError('measure label must be a non-empty string.');
    }

    const measured = this.currentState.measure();
    this.steps.push({
      type: 'measurement',
      label,
      timestamp: Date.now(),
      measured,
      state: this.currentState.clone(),
    });
    this._emit();
    return measured;
  }

  /**
   * Rewind debugger to a prior step index.
   * @param {number} index
   * @returns {QuantumState}
   */
  rewind(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.steps.length) {
      throw new RangeError('rewind index out of range.');
    }

    this.currentState = this.steps[index].state.clone();
    this.steps.push({
      type: 'rewind',
      label: `rewind->${index}`,
      timestamp: Date.now(),
      state: this.currentState.clone(),
      targetIndex: index,
    });
    this._emit();

    return this.currentState.clone();
  }

  /**
   * Subscribe to debugger changes.
   * @param {(event:{step:any,currentState:QuantumState})=>void} listener
   * @returns {()=>void} unsubscribe
   */
  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('subscribe listener must be a function.');
    }

    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * @returns {QuantumState}
   */
  getCurrentState() {
    return this.currentState.clone();
  }

  /**
   * @returns {Array<{index:number,type:string,label:string,timestamp:number,measured?:any,targetIndex?:number}>}
   */
  timeline() {
    return this.steps.map((step, index) => ({
      index,
      type: step.type,
      label: step.label,
      timestamp: step.timestamp,
      measured: step.measured,
      targetIndex: step.targetIndex,
    }));
  }

  _emit() {
    const latest = this.steps[this.steps.length - 1];
    for (const listener of this.listeners) {
      listener({
        step: { ...latest, state: latest.state.clone() },
        currentState: this.currentState.clone(),
      });
    }
  }
}

module.exports = QuantumDebugger;
