const Complex = require('./Complex');
const QuantumState = require('./QuantumState');

/**
 * Entanglement correlates two QuantumState instances.
 *
 * relationFn maps values from state1 into values of state2.
 * The resulting amplitudes in state2 are induced by state1 amplitudes, and
 * amplitudes mapping to the same value interfere (add as complex numbers).
 */
class Entanglement {
  /**
   * @param {QuantumState} state1
   * @param {QuantumState} state2
   * @param {(valueFromState1: any) => any} relationFn
   */
  constructor(state1, state2, relationFn) {
    if (!(state1 instanceof QuantumState) || !(state2 instanceof QuantumState)) {
      throw new TypeError('Entanglement requires two QuantumState instances.');
    }
    if (state1 === state2) {
      throw new RangeError('Entanglement requires two distinct quantum states.');
    }
    if (typeof relationFn !== 'function') {
      throw new TypeError('Entanglement relationFn must be a function.');
    }

    this.state1 = state1;
    this.state2 = state2;
    this.relationFn = relationFn;
    this.isActive = true;

    this.state1.entanglements.add(this);
    this.state2.entanglements.add(this);

    this.updateEntanglement();
  }

  /**
   * Recompute state2 from state1 by mapping and interfering amplitudes.
   * @param {QuantumState} [source]
   */
  updateEntanglement(source) {
    if (!this.isActive) {
      return;
    }

    if (source && source !== this.state1) {
      return;
    }

    // If source is fully collapsed, mirror deterministic relation immediately.
    if (this.state1.isCollapsed) {
      const targetValue = this.relationFn(this.state1.collapsedValue);
      if (targetValue === undefined) {
        throw new Error('Entanglement relationFn returned undefined during collapsed propagation.');
      }
      this._collapseState2(targetValue);
      return;
    }

    const inducedBasis = new Map();

    for (const [value1, amp1] of this.state1.basis.entries()) {
      const mappedValue = this.relationFn(value1);
      if (mappedValue === undefined) {
        throw new Error('Entanglement relationFn returned undefined for an input value.');
      }

      const existing = inducedBasis.get(mappedValue) || Complex.zero();
      inducedBasis.set(mappedValue, existing.add(amp1));
    }

    // Apply to state2 via direct basis replacement then normalize.
    this.state2.basis = inducedBasis;
    this.state2.normalize();
  }

  /**
   * On measurement of state1, state2 instantaneously collapses according to relationFn.
   * @param {QuantumState} measuredState
   * @param {any} measuredValue
   */
  onMeasurement(measuredState, measuredValue) {
    if (!this.isActive) {
      return;
    }

    if (measuredState === this.state1) {
      const mappedValue = this.relationFn(measuredValue);
      if (mappedValue === undefined) {
        throw new Error('Entanglement relationFn returned undefined for measured value.');
      }

      this._collapseState2(mappedValue);
    }
  }

  /**
   * Disconnect entanglement from both states.
   */
  dispose() {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.state1.entanglements.delete(this);
    this.state2.entanglements.delete(this);
  }

  _collapseState2(value) {
    if (this.state2.basis.has(value)) {
      this.state2.collapseTo(value, { reason: 'entanglement-collapse' });
      return;
    }

    // If target value is not present in current basis, inject it as deterministic post-measurement state.
    this.state2.basis.clear();
    this.state2.basis.set(value, new Complex(1, 0));
    this.state2.isCollapsed = true;
    this.state2.collapsedValue = value;
    this.state2.measurementHistory.push({
      timestamp: Date.now(),
      result: value,
      reason: 'entanglement-collapse',
      preMeasurementProbs: new Map(),
    });
  }
}

module.exports = Entanglement;
