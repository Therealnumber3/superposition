const QuantumState = require('../core/QuantumState');

/**
 * Visualization helpers for quantum state inspection and plotting.
 */
class QuantumVisualizer {
  /**
   * Returns sorted state snapshot rows.
   * @param {QuantumState} qstate
   * @param {{topN?: number}} [options]
   * @returns {Array<{value:any, probability:number, amplitudeReal:number, amplitudeImag:number, phase:number}>}
   */
  static snapshot(qstate, options = {}) {
    QuantumVisualizer._assertQuantumState(qstate, 'snapshot');

    const topN = options.topN;
    if (topN !== undefined && (!Number.isInteger(topN) || topN <= 0)) {
      throw new RangeError('snapshot topN must be a positive integer when provided.');
    }

    const rows = [];
    for (const [value, amplitude] of qstate.basis.entries()) {
      rows.push({
        value,
        probability: amplitude.magnitudeSquared(),
        amplitudeReal: amplitude.real,
        amplitudeImag: amplitude.imag,
        phase: amplitude.phase(),
      });
    }

    rows.sort((a, b) => b.probability - a.probability);
    return topN ? rows.slice(0, topN) : rows;
  }

  /**
   * Converts a state into chart-ready bar data.
   * @param {QuantumState} qstate
   * @param {{topN?: number}} [options]
   * @returns {{labels: string[], probabilities: number[], amplitudes: Array<{real:number,imag:number}>}}
   */
  static toBarChartData(qstate, options = {}) {
    const rows = QuantumVisualizer.snapshot(qstate, options);
    return {
      labels: rows.map((row) => String(row.value)),
      probabilities: rows.map((row) => row.probability),
      amplitudes: rows.map((row) => ({ real: row.amplitudeReal, imag: row.amplitudeImag })),
    };
  }

  /**
   * Build evolution data across a sequence of states.
   *
   * @param {QuantumState[]} history
   * @param {{trackValues?: any[]}} [options]
   * @returns {{steps: number[], series: Array<{value:string, probabilities:number[]}>}}
   */
  static toEvolutionData(history, options = {}) {
    if (!Array.isArray(history) || history.length === 0) {
      throw new RangeError('toEvolutionData requires a non-empty history array of QuantumState.');
    }
    for (const state of history) {
      QuantumVisualizer._assertQuantumState(state, 'toEvolutionData history element');
    }

    const tracked = options.trackValues;
    if (tracked !== undefined && !Array.isArray(tracked)) {
      throw new TypeError('toEvolutionData trackValues must be an array when provided.');
    }

    const values = tracked ? new Set(tracked) : new Set();
    if (!tracked) {
      for (const state of history) {
        for (const value of state.basis.keys()) {
          values.add(value);
        }
      }
    }

    const steps = Array.from({ length: history.length }, (_, index) => index);
    const series = [];

    for (const value of values) {
      const probabilities = history.map((state) => state.getAmplitude(value).magnitudeSquared());
      series.push({ value: String(value), probabilities });
    }

    return { steps, series };
  }

  /**
   * Produces quick ASCII visualization for terminal debugging.
   * @param {QuantumState} qstate
   * @param {{width?: number, topN?: number}} [options]
   * @returns {string}
   */
  static toAsciiBars(qstate, options = {}) {
    const width = options.width ?? 30;
    if (!Number.isInteger(width) || width <= 0) {
      throw new RangeError('toAsciiBars width must be a positive integer.');
    }

    const rows = QuantumVisualizer.snapshot(qstate, { topN: options.topN });
    return rows
      .map((row) => {
        const barLength = Math.round(row.probability * width);
        const bar = '█'.repeat(barLength).padEnd(width, '░');
        const pct = (row.probability * 100).toFixed(2);
        return `${String(row.value).padEnd(16, ' ')} | ${bar} | ${pct}%`;
      })
      .join('\n');
  }

  static _assertQuantumState(value, op) {
    if (!(value instanceof QuantumState)) {
      throw new TypeError(`QuantumVisualizer.${op} requires a QuantumState input.`);
    }
  }
}

module.exports = QuantumVisualizer;
