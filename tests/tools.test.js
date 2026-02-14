const { QuantumState, Complex } = require('../src');
const QuantumVisualizer = require('../src/tools/QuantumVisualizer');
const QuantumDebugger = require('../src/tools/QuantumDebugger');
const QuantumGates = require('../src/operators/QuantumGates');

describe('QuantumVisualizer', () => {
  test('snapshot sorts by probability', () => {
    const q = new QuantumState([
      { value: 'A', amplitude: new Complex(Math.sqrt(0.2), 0) },
      { value: 'B', amplitude: new Complex(Math.sqrt(0.8), 0) },
    ]);

    const rows = QuantumVisualizer.snapshot(q);
    expect(rows[0].value).toBe('B');
    expect(rows[1].value).toBe('A');
  });

  test('evolution data tracks values across history', () => {
    const q1 = new QuantumState([{ value: 'x', amplitude: new Complex(1, 0) }]);
    const q2 = new QuantumState([{ value: 'y', amplitude: new Complex(1, 0) }]);

    const data = QuantumVisualizer.toEvolutionData([q1, q2]);
    expect(data.steps).toEqual([0, 1]);

    const x = data.series.find((s) => s.value === 'x');
    const y = data.series.find((s) => s.value === 'y');
    expect(x.probabilities).toEqual([1, 0]);
    expect(y.probabilities).toEqual([0, 1]);
  });

  test('ascii bars returns a string representation', () => {
    const q = new QuantumState([{ value: 'A', amplitude: new Complex(1, 0) }]);
    const text = QuantumVisualizer.toAsciiBars(q, { width: 10 });
    expect(typeof text).toBe('string');
    expect(text.includes('A')).toBe(true);
  });
});

describe('QuantumDebugger', () => {
  test('step and rewind update state timeline', () => {
    const initial = new QuantumState([
      { value: 0, amplitude: new Complex(1 / Math.sqrt(2), 0) },
      { value: 1, amplitude: new Complex(1 / Math.sqrt(2), 0) },
    ]);

    const dbg = new QuantumDebugger(initial);
    dbg.step('hadamard', (state) => QuantumGates.hadamard(state));

    const afterStep = dbg.getCurrentState();
    const probs = afterStep.getProbabilities();
    expect(probs.get(0)).toBeCloseTo(1, 12);

    dbg.rewind(0);
    const rewound = dbg.getCurrentState();
    expect(rewound.getProbabilities().get(0)).toBeCloseTo(0.5, 12);

    const timeline = dbg.timeline();
    expect(timeline.length).toBeGreaterThanOrEqual(3);
  });

  test('measure collapses and records timeline entry', () => {
    const initial = new QuantumState([{ value: 'A', amplitude: new Complex(1, 0) }]);
    const dbg = new QuantumDebugger(initial);

    const value = dbg.measure('m');
    expect(value).toBe('A');

    const tail = dbg.timeline()[dbg.timeline().length - 1];
    expect(tail.type).toBe('measurement');
    expect(tail.measured).toBe('A');
  });
});
