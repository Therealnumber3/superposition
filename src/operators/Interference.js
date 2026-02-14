const Complex = require('../core/Complex');
const QuantumState = require('../core/QuantumState');

const PRUNE_EPSILON = 1e-12;

/**
 * Interference engine: combines quantum states by adding amplitudes.
 */
class Interference {
  /**
   * Interfere multiple QuantumState objects into one state.
   *
   * Combined amplitude for value v:
   * A(v) = sum_k w_k * a_k(v)
   *
   * Then resulting state is normalized by QuantumState constructor.
   *
   * @param {QuantumState[]} qstates
   * @param {number[] | null} [weights=null]
   * @returns {QuantumState}
   */
  static interfere(qstates, weights = null) {
    if (!Array.isArray(qstates) || qstates.length === 0) {
      throw new RangeError('Interference.interfere requires a non-empty array of QuantumState instances.');
    }

    for (const state of qstates) {
      if (!(state instanceof QuantumState)) {
        throw new TypeError('Interference.interfere expects all inputs to be QuantumState instances.');
      }
    }

    const resolvedWeights = Interference._resolveWeights(qstates.length, weights);
    const allValues = new Set();

    for (const state of qstates) {
      for (const value of state.basis.keys()) {
        allValues.add(value);
      }
    }

    const basis = [];

    for (const value of allValues) {
      let total = Complex.zero();

      for (let index = 0; index < qstates.length; index += 1) {
        const amp = qstates[index].getAmplitude(value);
        const weighted = amp.scale(resolvedWeights[index]);
        total = total.add(weighted);
      }

      if (total.magnitude() > PRUNE_EPSILON) {
        basis.push({ value, amplitude: total });
      }
    }

    if (basis.length === 0) {
      throw new Error('Interference cancelled all amplitudes to zero.');
    }

    return new QuantumState(basis);
  }

  /**
   * Compare combined probability against average individual probability.
   * ratio > constructiveThreshold => constructive
   * ratio < destructiveThreshold => destructive
   * otherwise neutral
   *
   * @param {QuantumState[]} qstates
   * @param {{constructiveThreshold?: number, destructiveThreshold?: number}} [options]
   * @returns {{constructive: Array<{value:any, ratio:number, combinedProb:number, avgIndividualProb:number}>, destructive: Array<{value:any, ratio:number, combinedProb:number, avgIndividualProb:number}>, neutral: Array<{value:any, ratio:number, combinedProb:number, avgIndividualProb:number}>}}
   */
  static analyzeInterference(qstates, options = {}) {
    if (!Array.isArray(qstates) || qstates.length === 0) {
      throw new RangeError('Interference.analyzeInterference requires a non-empty array of QuantumState instances.');
    }

    const constructiveThreshold = options.constructiveThreshold ?? 1.2;
    const destructiveThreshold = options.destructiveThreshold ?? 0.8;

    if (!Number.isFinite(constructiveThreshold) || !Number.isFinite(destructiveThreshold)) {
      throw new TypeError('Interference thresholds must be finite numbers.');
    }
    if (destructiveThreshold >= constructiveThreshold) {
      throw new RangeError('destructiveThreshold must be less than constructiveThreshold.');
    }

    const combined = Interference.interfere(qstates);
    const allValues = new Set();
    for (const state of qstates) {
      for (const value of state.basis.keys()) {
        allValues.add(value);
      }
    }

    const analysis = {
      constructive: [],
      destructive: [],
      neutral: [],
    };

    for (const value of allValues) {
      const amplitude = combined.getAmplitude(value);
      const combinedProb = amplitude.magnitudeSquared();

      let avgIndividualProb = 0;
      for (const state of qstates) {
        avgIndividualProb += state.getAmplitude(value).magnitudeSquared();
      }
      avgIndividualProb /= qstates.length;

      const ratio = avgIndividualProb <= Number.EPSILON ? Infinity : combinedProb / avgIndividualProb;
      const row = { value, ratio, combinedProb, avgIndividualProb };

      if (ratio > constructiveThreshold) {
        analysis.constructive.push(row);
      } else if (ratio < destructiveThreshold) {
        analysis.destructive.push(row);
      } else {
        analysis.neutral.push(row);
      }
    }

    return analysis;
  }

  static _resolveWeights(size, weights) {
    if (weights == null) {
      return Array.from({ length: size }, () => 1 / Math.sqrt(size));
    }

    if (!Array.isArray(weights) || weights.length !== size) {
      throw new RangeError(`weights must be an array of length ${size}.`);
    }

    let sumSquares = 0;
    for (const w of weights) {
      if (!Number.isFinite(w)) {
        throw new TypeError('weights must contain only finite numbers.');
      }
      sumSquares += w * w;
    }

    if (sumSquares <= Number.EPSILON) {
      throw new RangeError('weights must not all be zero.');
    }

    const norm = Math.sqrt(sumSquares);
    return weights.map((w) => w / norm);
  }
}

module.exports = Interference;
