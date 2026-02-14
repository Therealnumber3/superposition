const Complex = require('../src/core/Complex');
const QuantumState = require('../src/core/QuantumState');
const QuantumGates = require('../src/operators/QuantumGates');
const Interference = require('../src/operators/Interference');

describe('QuantumGates', () => {
  test('hadamard maps equal superposition to |0>', () => {
    const q = new QuantumState([
      { value: 0, amplitude: new Complex(1 / Math.sqrt(2), 0) },
      { value: 1, amplitude: new Complex(1 / Math.sqrt(2), 0) },
    ]);

    const out = QuantumGates.hadamard(q);
    const probs = out.getProbabilities();

    expect(probs.get(0)).toBeCloseTo(1, 12);
    expect(probs.get(1) || 0).toBeCloseTo(0, 12);
  });

  test('hadamard throws for non 2-state systems', () => {
    const q = new QuantumState([
      { value: 'A', amplitude: new Complex(1, 0) },
      { value: 'B', amplitude: new Complex(0, 0) },
      { value: 'C', amplitude: new Complex(0, 0) },
    ]);

    expect(() => QuantumGates.hadamard(q)).toThrow(RangeError);
  });

  test('phase modifies phase of target without changing probabilities', () => {
    const q = new QuantumState([
      { value: 'A', amplitude: new Complex(1 / Math.sqrt(2), 0) },
      { value: 'B', amplitude: new Complex(1 / Math.sqrt(2), 0) },
    ]);

    const out = QuantumGates.phase(q, 'A', Math.PI / 2);
    const probs = out.getProbabilities();

    expect(probs.get('A')).toBeCloseTo(0.5, 12);
    expect(probs.get('B')).toBeCloseTo(0.5, 12);

    const ampA = out.getAmplitude('A');
    expect(ampA.real).toBeCloseTo(0, 12);
    expect(ampA.imag).toBeCloseTo(1 / Math.sqrt(2), 12);
  });

  test('rotate applies global phase and preserves relative probabilities', () => {
    const q = new QuantumState([
      { value: 'x', amplitude: new Complex(0.8, 0) },
      { value: 'y', amplitude: new Complex(0.6, 0) },
    ]);

    const out = QuantumGates.rotate(q, Math.PI / 3);
    const inProbs = q.getProbabilities();
    const outProbs = out.getProbabilities();

    expect(outProbs.get('x')).toBeCloseTo(inProbs.get('x'), 12);
    expect(outProbs.get('y')).toBeCloseTo(inProbs.get('y'), 12);
  });

  test('amplify boosts target probabilities after renormalization', () => {
    const q = new QuantumState([
      { value: 'target', amplitude: new Complex(1 / Math.sqrt(2), 0) },
      { value: 'other', amplitude: new Complex(1 / Math.sqrt(2), 0) },
    ]);

    const out = QuantumGates.amplify(q, ['target'], 2);
    const probs = out.getProbabilities();

    expect(probs.get('target')).toBeGreaterThan(0.5);
    expect(probs.get('other')).toBeLessThan(0.5);
    expect((probs.get('target') || 0) + (probs.get('other') || 0)).toBeCloseTo(1, 12);
  });
});

describe('Interference', () => {
  test('constructive interference increases probability', () => {
    const q1 = new QuantumState([{ value: 'X', amplitude: new Complex(1, 0) }]);
    const q2 = new QuantumState([{ value: 'X', amplitude: new Complex(1, 0) }]);

    const combined = Interference.interfere([q1, q2]);
    const p = combined.getProbabilities();

    expect(p.get('X')).toBeCloseTo(1, 12);
  });

  test('destructive interference with opposite phase cancels amplitude', () => {
    const q1 = new QuantumState([
      { value: 'X', amplitude: new Complex(1, 0) },
      { value: 'Y', amplitude: new Complex(1, 0) },
    ]);

    const q2 = new QuantumState([
      { value: 'X', amplitude: new Complex(-1, 0) },
      { value: 'Y', amplitude: new Complex(1, 0) },
    ]);

    // Equal normalized weights: both states contribute at 1/sqrt(2).
    const combined = Interference.interfere([q1, q2]);
    const p = combined.getProbabilities();

    expect(p.get('X') || 0).toBeCloseTo(0, 12);
    expect(p.get('Y')).toBeCloseTo(1, 12);
  });

  test('analyzeInterference identifies constructive and destructive entries', () => {
    const a = new QuantumState([
      { value: 'agree', amplitude: new Complex(1, 0) },
      { value: 'disagree', amplitude: new Complex(0, 0) },
    ]);

    const b = new QuantumState([
      { value: 'agree', amplitude: new Complex(1, 0) },
      { value: 'disagree', amplitude: new Complex(0, 0) },
    ]);

    const c = new QuantumState([
      { value: 'agree', amplitude: new Complex(-1, 0) },
      { value: 'disagree', amplitude: new Complex(1, 0) },
    ]);

    const analysis = Interference.analyzeInterference([a, b, c]);

    const hasConstructiveAgree = analysis.constructive.some((row) => row.value === 'agree');
    const hasConstructiveDisagree = analysis.constructive.some((row) => row.value === 'disagree');

    expect(hasConstructiveAgree || hasConstructiveDisagree).toBe(true);
  });

  test('throws on invalid inputs', () => {
    expect(() => Interference.interfere([])).toThrow(RangeError);
    expect(() => Interference.interfere([{}])).toThrow(TypeError);
    expect(() => Interference.interfere([new QuantumState([{ value: 'A', amplitude: new Complex(1, 0) }])], [0, 1])).toThrow(RangeError);
  });
});
