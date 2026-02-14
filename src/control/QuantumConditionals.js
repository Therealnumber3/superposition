const QuantumState = require('../core/QuantumState');
const Complex = require('../core/Complex');

/**
 * Quantum conditional operators.
 *
 * These execute branches in superposition by weighting each branch amplitude
 * by the condition amplitude associated with that branch value.
 */
class QuantumConditionals {
  /**
   * Quantum if/else.
   *
   * For each basis value in condition, evaluates either thenBranch or elseBranch
   * and combines all outcomes with amplitude weighting.
   *
   * @param {QuantumState} condition
   * @param {(value:any)=>QuantumState|any} thenBranch
   * @param {(value:any)=>QuantumState|any} elseBranch
   * @returns {QuantumState}
   */
  static quantumIf(condition, thenBranch, elseBranch) {
    QuantumConditionals._assertQuantumState(condition, 'quantumIf condition');
    QuantumConditionals._assertFunction(thenBranch, 'quantumIf thenBranch');
    QuantumConditionals._assertFunction(elseBranch, 'quantumIf elseBranch');

    const combined = new Map();

    for (const [conditionValue, conditionAmplitude] of condition.basis.entries()) {
      const branchResult = conditionValue
        ? thenBranch(conditionValue)
        : elseBranch(conditionValue);

      const branchState = QuantumConditionals._coerceToState(branchResult);

      for (const [resultValue, resultAmplitude] of branchState.basis.entries()) {
        const weighted = resultAmplitude.multiply(conditionAmplitude);
        const existing = combined.get(resultValue) || Complex.zero();
        combined.set(resultValue, existing.add(weighted));
      }
    }

    return QuantumConditionals._buildStateFromMap(combined, 'quantumIf');
  }

  /**
   * Quantum switch/case.
   *
   * Each basis value selects its case handler; all selected branches run in
   * superposition and combine by amplitude addition.
   *
   * @param {QuantumState} qstate
   * @param {Object<string, (value:any)=>QuantumState|any>} cases
   * @param {(value:any)=>QuantumState|any} [defaultCase]
   * @returns {QuantumState}
   */
  static quantumSwitch(qstate, cases, defaultCase) {
    QuantumConditionals._assertQuantumState(qstate, 'quantumSwitch state');
    if (!cases || typeof cases !== 'object' || Array.isArray(cases)) {
      throw new TypeError('quantumSwitch cases must be an object mapping values to handler functions.');
    }
    if (defaultCase !== undefined) {
      QuantumConditionals._assertFunction(defaultCase, 'quantumSwitch defaultCase');
    }

    const combined = new Map();

    for (const [value, amplitude] of qstate.basis.entries()) {
      const handler = Object.prototype.hasOwnProperty.call(cases, value)
        ? cases[value]
        : defaultCase;

      if (handler === undefined) {
        // No handler means this path contributes no output branch.
        continue;
      }

      QuantumConditionals._assertFunction(handler, `quantumSwitch handler for ${String(value)}`);
      const branchState = QuantumConditionals._coerceToState(handler(value));

      for (const [resultValue, resultAmplitude] of branchState.basis.entries()) {
        const weighted = resultAmplitude.multiply(amplitude);
        const existing = combined.get(resultValue) || Complex.zero();
        combined.set(resultValue, existing.add(weighted));
      }
    }

    return QuantumConditionals._buildStateFromMap(combined, 'quantumSwitch');
  }

  static _coerceToState(result) {
    if (result instanceof QuantumState) {
      return result;
    }

    // Treat non-state result as deterministic branch output.
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

  static _assertQuantumState(value, name) {
    if (!(value instanceof QuantumState)) {
      throw new TypeError(`${name} must be a QuantumState.`);
    }
  }

  static _assertFunction(value, name) {
    if (typeof value !== 'function') {
      throw new TypeError(`${name} must be a function.`);
    }
  }
}

module.exports = QuantumConditionals;
