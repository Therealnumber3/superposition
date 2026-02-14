const Complex = require('../core/Complex');
const QuantumState = require('../core/QuantumState');

/**
 * Quantum gate operators for discrete QuantumState systems.
 *
 * Each gate is pure: it returns a new QuantumState and does not mutate input.
 */
class QuantumGates {
  /**
   * Hadamard gate on a 2-state system.
   *
   * H = (1/sqrt(2)) * [[1, 1], [1, -1]]
   *
   * @param {QuantumState} qstate
   * @returns {QuantumState}
   */
  static hadamard(qstate) {
    QuantumGates._assertQuantumState(qstate, 'hadamard');

    const values = Array.from(qstate.basis.keys());
    if (values.length !== 2) {
      throw new RangeError(`Hadamard requires exactly 2 basis states, received ${values.length}.`);
    }

    const [v0, v1] = values;
    const a0 = qstate.getAmplitude(v0);
    const a1 = qstate.getAmplitude(v1);
    const factor = 1 / Math.sqrt(2);

    const nextA0 = a0.add(a1).scale(factor);
    const nextA1 = a0.subtract(a1).scale(factor);

    return new QuantumState([
      { value: v0, amplitude: nextA0 },
      { value: v1, amplitude: nextA1 },
    ]);
  }

  /**
   * Applies phase shift to a single basis value.
   *
   * For target value: alpha -> alpha * exp(i * theta)
   * @param {QuantumState} qstate
   * @param {any} targetValue
   * @param {number} phaseAngle radians
   * @returns {QuantumState}
   */
  static phase(qstate, targetValue, phaseAngle) {
    QuantumGates._assertQuantumState(qstate, 'phase');
    if (!Number.isFinite(phaseAngle)) {
      throw new TypeError('phaseAngle must be a finite number in radians.');
    }
    if (!qstate.basis.has(targetValue)) {
      throw new RangeError('Target value does not exist in quantum basis.');
    }

    const phaseFactor = Complex.fromPolar(1, phaseAngle);
    const basis = [];

    for (const [value, amplitude] of qstate.basis.entries()) {
      if (value === targetValue) {
        basis.push({ value, amplitude: amplitude.multiply(phaseFactor) });
      } else {
        basis.push({ value, amplitude: amplitude.clone() });
      }
    }

    return new QuantumState(basis);
  }

  /**
   * Global phase rotation for all amplitudes.
   *
   * alpha -> alpha * exp(i * angle) for each basis state.
   * @param {QuantumState} qstate
   * @param {number} angle radians
   * @returns {QuantumState}
   */
  static rotate(qstate, angle) {
    QuantumGates._assertQuantumState(qstate, 'rotate');
    if (!Number.isFinite(angle)) {
      throw new TypeError('angle must be a finite number in radians.');
    }

    const rotor = Complex.fromPolar(1, angle);
    const basis = [];

    for (const [value, amplitude] of qstate.basis.entries()) {
      basis.push({ value, amplitude: amplitude.multiply(rotor) });
    }

    return new QuantumState(basis);
  }

  /**
   * Amplitude amplification for selected basis values.
   *
   * This scales target amplitudes by `factor`, then renormalizes.
   * @param {QuantumState} qstate
   * @param {Array<any>|Set<any>} targetValues
   * @param {number} [factor=1.5]
   * @returns {QuantumState}
   */
  static amplify(qstate, targetValues, factor = 1.5) {
    QuantumGates._assertQuantumState(qstate, 'amplify');
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new RangeError('Amplification factor must be a finite number > 0.');
    }

    const targets = QuantumGates._toSet(targetValues);
    if (targets.size === 0) {
      throw new RangeError('targetValues must contain at least one value.');
    }

    const basis = [];
    let matchedAny = false;

    for (const [value, amplitude] of qstate.basis.entries()) {
      if (targets.has(value)) {
        basis.push({ value, amplitude: amplitude.scale(factor) });
        matchedAny = true;
      } else {
        basis.push({ value, amplitude: amplitude.clone() });
      }
    }

    if (!matchedAny) {
      throw new RangeError('None of the targetValues exist in the quantum basis.');
    }

    return new QuantumState(basis);
  }

  static _assertQuantumState(value, operation) {
    if (!(value instanceof QuantumState)) {
      throw new TypeError(`QuantumGates.${operation} requires a QuantumState input.`);
    }
  }

  static _toSet(values) {
    if (values instanceof Set) {
      return values;
    }
    if (Array.isArray(values)) {
      return new Set(values);
    }
    throw new TypeError('targetValues must be an Array or Set.');
  }
}

module.exports = QuantumGates;
