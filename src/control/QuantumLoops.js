const QuantumState = require('../core/QuantumState');
const Complex = require('../core/Complex');

/**
 * Quantum loop operators.
 */
class QuantumLoops {
  /**
   * Quantum for-loop: executes loop body over all states in superposition
   * for a fixed number of iterations.
   *
   * @param {number} iterations non-negative integer
   * @param {QuantumState} initialState
   * @param {(value:any, iteration:number)=>QuantumState|any} bodyFn
   * @returns {{finalState: QuantumState, history: QuantumState[]}}
   */
  static quantumFor(iterations, initialState, bodyFn) {
    if (!Number.isInteger(iterations) || iterations < 0) {
      throw new RangeError('quantumFor iterations must be a non-negative integer.');
    }
    if (!(initialState instanceof QuantumState)) {
      throw new TypeError('quantumFor initialState must be a QuantumState.');
    }
    if (typeof bodyFn !== 'function') {
      throw new TypeError('quantumFor bodyFn must be a function.');
    }

    let currentState = initialState.clone();
    const history = [currentState.clone()];

    for (let index = 0; index < iterations; index += 1) {
      currentState = QuantumLoops._applyBodyToState(currentState, index, bodyFn);
      history.push(currentState.clone());
    }

    return {
      finalState: currentState,
      history,
    };
  }

  /**
   * Quantum while-loop with max iteration guard.
   *
   * @param {(value:any)=>boolean} condition
   * @param {(value:any, iteration:number)=>QuantumState|any} bodyFn
   * @param {QuantumState} initialState
   * @param {number} [maxIterations=100]
   * @returns {{finalState: QuantumState, history: QuantumState[], iterations: number, terminatedByMaxIterations: boolean}}
   */
  static quantumWhile(condition, bodyFn, initialState, maxIterations = 100) {
    if (typeof condition !== 'function') {
      throw new TypeError('quantumWhile condition must be a function.');
    }
    if (typeof bodyFn !== 'function') {
      throw new TypeError('quantumWhile bodyFn must be a function.');
    }
    if (!(initialState instanceof QuantumState)) {
      throw new TypeError('quantumWhile initialState must be a QuantumState.');
    }
    if (!Number.isInteger(maxIterations) || maxIterations < 0) {
      throw new RangeError('quantumWhile maxIterations must be a non-negative integer.');
    }

    let currentState = initialState.clone();
    const history = [currentState.clone()];
    let iteration = 0;

    while (iteration < maxIterations) {
      let anyTrue = false;
      for (const [value] of currentState.basis.entries()) {
        if (condition(value)) {
          anyTrue = true;
          break;
        }
      }

      if (!anyTrue) {
        return {
          finalState: currentState,
          history,
          iterations: iteration,
          terminatedByMaxIterations: false,
        };
      }

      currentState = QuantumLoops._applyConditionalBody(currentState, iteration, condition, bodyFn);
      history.push(currentState.clone());
      iteration += 1;
    }

    return {
      finalState: currentState,
      history,
      iterations: iteration,
      terminatedByMaxIterations: true,
    };
  }

  static _applyBodyToState(state, iteration, bodyFn) {
    const combined = new Map();

    for (const [value, amplitude] of state.basis.entries()) {
      const result = bodyFn(value, iteration);
      const resultState = QuantumLoops._coerceResultState(result);

      for (const [outValue, outAmplitude] of resultState.basis.entries()) {
        const weighted = outAmplitude.multiply(amplitude);
        const existing = combined.get(outValue) || Complex.zero();
        combined.set(outValue, existing.add(weighted));
      }
    }

    return QuantumLoops._buildStateFromMap(combined, 'quantumFor');
  }

  static _applyConditionalBody(state, iteration, condition, bodyFn) {
    const combined = new Map();

    for (const [value, amplitude] of state.basis.entries()) {
      if (!condition(value)) {
        const existing = combined.get(value) || Complex.zero();
        combined.set(value, existing.add(amplitude));
        continue;
      }

      const result = bodyFn(value, iteration);
      const resultState = QuantumLoops._coerceResultState(result);

      for (const [outValue, outAmplitude] of resultState.basis.entries()) {
        const weighted = outAmplitude.multiply(amplitude);
        const existing = combined.get(outValue) || Complex.zero();
        combined.set(outValue, existing.add(weighted));
      }
    }

    return QuantumLoops._buildStateFromMap(combined, 'quantumWhile');
  }

  static _coerceResultState(result) {
    if (result instanceof QuantumState) {
      return result;
    }

    return new QuantumState([{ value: result, amplitude: new Complex(1, 0) }]);
  }

  static _buildStateFromMap(amplitudeMap, operation) {
    const basis = [];
    for (const [value, amplitude] of amplitudeMap.entries()) {
      basis.push({ value, amplitude });
    }

    if (basis.length === 0) {
      throw new Error(`${operation} produced an empty superposition.`);
    }

    return new QuantumState(basis);
  }
}

module.exports = QuantumLoops;
