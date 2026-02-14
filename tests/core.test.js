const Complex = require('../src/core/Complex');
const QuantumState = require('../src/core/QuantumState');
const Entanglement = require('../src/core/Entanglement');

describe('Complex', () => {
  test('constructs and validates finite components', () => {
    expect(() => new Complex(Number.NaN, 0)).toThrow(TypeError);
    expect(() => new Complex(0, Number.POSITIVE_INFINITY)).toThrow(TypeError);
    expect(new Complex(1.2, -3.4)).toBeInstanceOf(Complex);
  });

  test('computes magnitude and squared magnitude correctly', () => {
    const z = new Complex(3, 4);
    expect(z.magnitude()).toBeCloseTo(5);
    expect(z.magnitudeSquared()).toBeCloseTo(25);
  });

  test('supports add, subtract, multiply, divide', () => {
    const a = new Complex(3, 2);
    const b = new Complex(1, -4);

    expect(a.add(b).equals(new Complex(4, -2))).toBe(true);
    expect(a.subtract(b).equals(new Complex(2, 6))).toBe(true);

    // (3 + 2i)(1 - 4i) = 11 - 10i
    expect(a.multiply(b).equals(new Complex(11, -10))).toBe(true);

    const q = a.divide(b);
    // Expected: (-5/17) + (14/17)i
    expect(q.real).toBeCloseTo(-5 / 17, 12);
    expect(q.imag).toBeCloseTo(14 / 17, 12);

    expect(() => a.divide(new Complex(0, 0))).toThrow(RangeError);
  });

  test('supports scale, conjugate, phase, fromPolar', () => {
    const z = new Complex(2, -2);
    expect(z.scale(0.5).equals(new Complex(1, -1))).toBe(true);
    expect(z.conjugate().equals(new Complex(2, 2))).toBe(true);
    expect(z.phase()).toBeCloseTo(-Math.PI / 4);

    const p = Complex.fromPolar(2, Math.PI / 3);
    expect(p.magnitude()).toBeCloseTo(2, 12);
    expect(p.phase()).toBeCloseTo(Math.PI / 3, 12);

    expect(() => Complex.fromPolar(-1, 0)).toThrow(RangeError);
  });
});

describe('QuantumState', () => {
  test('normalizes amplitudes so probabilities sum to 1', () => {
    const state = new QuantumState([
      { value: 'A', amplitude: new Complex(3, 0) },
      { value: 'B', amplitude: new Complex(4, 0) },
    ]);

    const probs = state.getProbabilities();
    expect(probs.get('A')).toBeCloseTo(9 / 25, 12);
    expect(probs.get('B')).toBeCloseTo(16 / 25, 12);
    expect(probs.get('A') + probs.get('B')).toBeCloseTo(1, 12);
  });

  test('combines duplicate basis values through amplitude addition', () => {
    const state = new QuantumState([
      { value: 'X', amplitude: new Complex(0.5, 0) },
      { value: 'X', amplitude: new Complex(0.5, 0) },
    ]);

    const probs = state.getProbabilities();
    expect(probs.size).toBe(1);
    expect(probs.get('X')).toBeCloseTo(1, 12);
  });

  test('measure collapses state according to Born rule and is idempotent', () => {
    const state = new QuantumState([
      { value: 0, amplitude: new Complex(1, 0) },
      { value: 1, amplitude: new Complex(0, 0) },
    ]);

    const result = state.measure();
    expect(result).toBe(0);
    expect(state.isCollapsed).toBe(true);
    expect(state.collapsedValue).toBe(0);

    const probs = state.getProbabilities();
    expect(probs.get(0)).toBeCloseTo(1, 12);
    expect(probs.get(1) || 0).toBeCloseTo(0, 12);

    // Second measurement should return same value and not alter determinism.
    expect(state.measure()).toBe(0);
  });

  test('setAmplitude validates input and preserves normalization', () => {
    const state = new QuantumState([
      { value: 'A', amplitude: new Complex(1, 0) },
      { value: 'B', amplitude: new Complex(1, 0) },
    ]);

    expect(() => state.setAmplitude('A', { real: 1, imag: 0 })).toThrow(TypeError);

    state.setAmplitude('A', new Complex(2, 0));
    const probs = state.getProbabilities();
    expect(probs.get('A') + probs.get('B')).toBeCloseTo(1, 12);
  });

  test('throws for invalid empty or zero-probability states', () => {
    expect(() => new QuantumState([])).toThrow(RangeError);
    expect(
      () =>
        new QuantumState([
          { value: 'A', amplitude: new Complex(0, 0) },
          { value: 'B', amplitude: new Complex(0, 0) },
        ])
    ).toThrow(Error);
  });

  test('coherence metrics and near-classical detection behave correctly', () => {
    const superposed = new QuantumState([
      { value: 'A', amplitude: new Complex(1 / Math.sqrt(2), 0) },
      { value: 'B', amplitude: new Complex(1 / Math.sqrt(2), 0) },
    ]);

    const metrics = superposed.getCoherenceMetrics();
    expect(metrics.supportSize).toBe(2);
    expect(metrics.maxProbability).toBeCloseTo(0.5, 12);
    expect(metrics.entropy).toBeCloseTo(1, 12);
    expect(metrics.isClassical).toBe(false);

    const collapsed = new QuantumState([
      { value: 'A', amplitude: new Complex(1, 0) },
      { value: 'B', amplitude: new Complex(0, 0) },
    ]);

    expect(collapsed.isNearClassical()).toBe(true);
    expect(() => collapsed.isNearClassical(2)).toThrow(RangeError);
  });

  test('stabilize preserves normalization', () => {
    const state = new QuantumState([
      { value: 'A', amplitude: new Complex(1, 0) },
      { value: 'B', amplitude: new Complex(1e-10, 0) },
    ]);

    state.stabilize();
    const probs = state.getProbabilities();
    const total = Array.from(probs.values()).reduce((sum, p) => sum + p, 0);

    expect(total).toBeCloseTo(1, 12);
    expect(probs.get('A')).toBeCloseTo(1, 12);
  });
});

describe('Entanglement', () => {
  test('updates target state probabilities from source mapping', () => {
    const weather = new QuantumState([
      { value: 'sunny', amplitude: new Complex(0.8, 0) },
      { value: 'rainy', amplitude: new Complex(0.6, 0) },
    ]);

    const activity = new QuantumState([{ value: 'unknown', amplitude: new Complex(1, 0) }]);

    new Entanglement(weather, activity, (w) => (w === 'sunny' ? 'beach' : 'movie'));

    const probs = activity.getProbabilities();
    expect((probs.get('beach') || 0) + (probs.get('movie') || 0)).toBeCloseTo(1, 12);
    expect(probs.get('beach')).toBeCloseTo(0.64, 12);
    expect(probs.get('movie')).toBeCloseTo(0.36, 12);
  });

  test('collapses entangled target instantly when source is measured', () => {
    const source = new QuantumState([
      { value: 0, amplitude: new Complex(1, 0) },
      { value: 1, amplitude: new Complex(0, 0) },
    ]);

    const target = new QuantumState([{ value: 'A', amplitude: new Complex(1, 0) }]);

    new Entanglement(source, target, (bit) => (bit === 0 ? 'A' : 'B'));

    const sourceObserved = source.measure();
    expect(sourceObserved).toBe(0);

    expect(target.isCollapsed).toBe(true);
    expect(target.collapsedValue).toBe('A');
    expect(target.getProbabilities().get('A')).toBeCloseTo(1, 12);
  });

  test('can dispose an entanglement link', () => {
    const s1 = new QuantumState([
      { value: 'x', amplitude: new Complex(1, 0) },
      { value: 'y', amplitude: new Complex(0, 0) },
    ]);

    const s2 = new QuantumState([{ value: 'mapped', amplitude: new Complex(1, 0) }]);
    const e = new Entanglement(s1, s2, () => 'mapped');

    expect(s1.entanglements.has(e)).toBe(true);
    expect(s2.entanglements.has(e)).toBe(true);

    e.dispose();

    expect(s1.entanglements.has(e)).toBe(false);
    expect(s2.entanglements.has(e)).toBe(false);
  });
});
