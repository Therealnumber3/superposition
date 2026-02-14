const Complex = require('./Complex');

const AMPLITUDE_PRUNE_EPSILON = 1e-12;
const NORMALIZATION_EPSILON = 1e-15;

/**
 * QuantumState stores a discrete superposition over basis values.
 *
 * Representation:
 * |psi> = sum_i alpha_i |value_i>
 * where alpha_i are complex amplitudes and sum_i |alpha_i|^2 = 1.
 */
class QuantumState {
  /**
   * @param {Array<{value: any, amplitude: Complex}>} basis
   */
  constructor(basis) {
    if (!Array.isArray(basis)) {
      throw new TypeError('QuantumState basis must be an array of { value, amplitude }.');
    }
    if (basis.length === 0) {
      throw new RangeError('QuantumState basis must contain at least one state.');
    }

    this.basis = new Map();
    this.entanglements = new Set();
    this.measurementHistory = [];
    this.isCollapsed = false;
    this.collapsedValue = undefined;

    for (const entry of basis) {
      this._validateBasisEntry(entry);
      const current = this.basis.get(entry.value) || Complex.zero();
      this.basis.set(entry.value, current.add(entry.amplitude));
    }

    this._pruneNearZeroAmplitudes();
    this.normalize();
  }

  /**
   * Ensure sum of squared magnitudes is 1.
   * Throws if state has zero total probability mass.
   * @returns {QuantumState}
   */
  normalize() {
    let totalProbability = 0;
    for (const amplitude of this.basis.values()) {
      totalProbability += amplitude.magnitudeSquared();
    }

    if (!Number.isFinite(totalProbability) || totalProbability <= NORMALIZATION_EPSILON) {
      throw new Error('Quantum state collapsed to zero probability mass.');
    }

    const norm = Math.sqrt(totalProbability);
    for (const [value, amplitude] of this.basis.entries()) {
      this.basis.set(value, amplitude.scale(1 / norm));
    }

    this._pruneNearZeroAmplitudes();
    this._updateCollapsedFlags();
    this._notifyEntanglementUpdates();
    return this;
  }

  /**
   * Returns probability distribution over basis values.
   * @returns {Map<any, number>}
   */
  getProbabilities() {
    const probabilities = new Map();
    for (const [value, amplitude] of this.basis.entries()) {
      probabilities.set(value, amplitude.magnitudeSquared());
    }
    return probabilities;
  }

  /**
   * @param {any} value
   * @returns {Complex}
   */
  getAmplitude(value) {
    return this.basis.get(value) || Complex.zero();
  }

  /**
   * Replace amplitude for a basis value and renormalize.
   * @param {any} value
   * @param {Complex} amplitude
   * @returns {QuantumState}
   */
  setAmplitude(value, amplitude) {
    if (!(amplitude instanceof Complex)) {
      throw new TypeError('setAmplitude requires amplitude to be Complex.');
    }

    this.basis.set(value, amplitude);
    this._pruneNearZeroAmplitudes();

    if (this.basis.size === 0) {
      throw new Error('Cannot set amplitude resulting in an empty quantum basis.');
    }

    return this.normalize();
  }

  /**
   * Returns a lightweight decoherence diagnostic snapshot.
   *
   * - maxProbability near 1 indicates near-classical collapse
   * - entropy near 0 indicates low uncertainty
   * - supportSize counts active non-zero basis states
   *
   * @returns {{maxProbability: number, entropy: number, supportSize: number, isClassical: boolean}}
   */
  getCoherenceMetrics() {
    const probabilities = this.getProbabilities();
    let maxProbability = 0;
    let entropy = 0;

    for (const probability of probabilities.values()) {
      if (probability > maxProbability) {
        maxProbability = probability;
      }
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    }

    return {
      maxProbability,
      entropy,
      supportSize: this.basis.size,
      isClassical: this.isNearClassical(),
    };
  }

  /**
   * True when one outcome dominates strongly.
   *
   * @param {number} [threshold=0.999999]
   * @returns {boolean}
   */
  isNearClassical(threshold = 0.999999) {
    if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) {
      throw new RangeError('isNearClassical threshold must be in (0, 1].');
    }

    const probabilities = this.getProbabilities();
    let maxProbability = 0;
    for (const probability of probabilities.values()) {
      if (probability > maxProbability) {
        maxProbability = probability;
      }
    }

    return maxProbability >= threshold;
  }

  /**
   * Re-stabilize amplitudes by pruning tiny terms and renormalizing.
   *
   * This is a defensive operation against floating point drift in long-running
   * workloads where many gates/updates are chained.
   *
   * @returns {QuantumState}
   */
  stabilize() {
    this._pruneNearZeroAmplitudes();
    return this.normalize();
  }

  /**
   * Quantum measurement: sample outcome by Born rule then collapse to that basis value.
   * @returns {any} measured basis value
   */
  measure() {
    if (this.isCollapsed) {
      return this.collapsedValue;
    }

    const probabilities = this.getProbabilities();
    const rand = Math.random();

    let cumulative = 0;
    let measuredValue;

    for (const [value, probability] of probabilities.entries()) {
      cumulative += probability;
      if (rand <= cumulative) {
        measuredValue = value;
        break;
      }
    }

    // Numerical guard for floating-point drift.
    if (measuredValue === undefined) {
      const values = Array.from(this.basis.keys());
      measuredValue = values[values.length - 1];
    }

    this.collapseTo(measuredValue, {
      reason: 'measurement',
      preMeasurementProbs: probabilities,
    });

    return measuredValue;
  }

  /**
   * Deterministically collapse to a specific basis value.
   * @param {any} value
   * @param {{reason?: string, preMeasurementProbs?: Map<any, number>}} [metadata]
   * @returns {QuantumState}
   */
  collapseTo(value, metadata = {}) {
    if (!this.basis.has(value)) {
      throw new RangeError('Cannot collapse to a value not present in the basis.');
    }

    const preMeasurementProbs = metadata.preMeasurementProbs || this.getProbabilities();

    this.basis.clear();
    this.basis.set(value, new Complex(1, 0));
    this.isCollapsed = true;
    this.collapsedValue = value;

    this.measurementHistory.push({
      timestamp: Date.now(),
      result: value,
      reason: metadata.reason || 'manual-collapse',
      preMeasurementProbs,
    });

    this._notifyEntangledStates(value);
    return this;
  }

  /**
   * @returns {QuantumState}
   */
  clone() {
    const basis = [];
    for (const [value, amplitude] of this.basis.entries()) {
      basis.push({ value, amplitude: amplitude.clone() });
    }

    const copy = new QuantumState(basis);
    copy.isCollapsed = this.isCollapsed;
    copy.collapsedValue = this.collapsedValue;
    copy.measurementHistory = this.measurementHistory.map((entry) => ({ ...entry }));

    return copy;
  }

  /**
   * Human-readable state string with amplitudes and probabilities.
   * @returns {string}
   */
  toString() {
    const terms = [];
    for (const [value, amplitude] of this.basis.entries()) {
      const probabilityPercent = (amplitude.magnitudeSquared() * 100).toFixed(3);
      terms.push(`${amplitude.toString()}|${String(value)}⟩ [${probabilityPercent}%]`);
    }
    return `|ψ⟩ = ${terms.join(' + ')}`;
  }

  /**
   * @param {{value: any, amplitude: Complex}} entry
   */
  _validateBasisEntry(entry) {
    if (!entry || typeof entry !== 'object') {
      throw new TypeError('Each basis entry must be an object with value and amplitude.');
    }
    if (!Object.prototype.hasOwnProperty.call(entry, 'value')) {
      throw new TypeError('Each basis entry must include a value field.');
    }
    if (!(entry.amplitude instanceof Complex)) {
      throw new TypeError('Each basis entry amplitude must be an instance of Complex.');
    }
  }

  _pruneNearZeroAmplitudes() {
    for (const [value, amplitude] of this.basis.entries()) {
      if (amplitude.magnitude() < AMPLITUDE_PRUNE_EPSILON) {
        this.basis.delete(value);
      }
    }

    if (this.basis.size === 0) {
      throw new Error('Quantum state has no non-zero amplitudes after pruning.');
    }
  }

  _updateCollapsedFlags() {
    if (this.basis.size === 1) {
      const [value, amplitude] = Array.from(this.basis.entries())[0];
      this.isCollapsed = amplitude.equals(new Complex(1, 0));
      this.collapsedValue = this.isCollapsed ? value : undefined;
      return;
    }

    this.isCollapsed = false;
    this.collapsedValue = undefined;
  }

  _notifyEntanglementUpdates() {
    for (const entanglement of this.entanglements) {
      if (typeof entanglement.updateEntanglement === 'function') {
        entanglement.updateEntanglement(this);
      }
    }
  }

  _notifyEntangledStates(measuredValue) {
    for (const entanglement of this.entanglements) {
      if (typeof entanglement.onMeasurement === 'function') {
        entanglement.onMeasurement(this, measuredValue);
      }
    }
  }
}

module.exports = QuantumState;
