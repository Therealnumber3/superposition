const Complex = require('../src/core/Complex');
const QuantumState = require('../src/core/QuantumState');
const QuantumConditionals = require('../src/control/QuantumConditionals');
const QuantumLoops = require('../src/control/QuantumLoops');

describe('QuantumConditionals', () => {
  test('quantumIf respects 70/30 weighted branch distribution', () => {
    const condition = new QuantumState([
      { value: true, amplitude: new Complex(Math.sqrt(0.7), 0) },
      { value: false, amplitude: new Complex(Math.sqrt(0.3), 0) },
    ]);

    const result = QuantumConditionals.quantumIf(
      condition,
      () => new QuantumState([{ value: 'then', amplitude: new Complex(1, 0) }]),
      () => new QuantumState([{ value: 'else', amplitude: new Complex(1, 0) }])
    );

    const probs = result.getProbabilities();
    expect(probs.get('then')).toBeCloseTo(0.7, 12);
    expect(probs.get('else')).toBeCloseTo(0.3, 12);
  });

  test('quantumIf allows plain values as branch outputs', () => {
    const condition = new QuantumState([
      { value: 1, amplitude: new Complex(1 / Math.sqrt(2), 0) },
      { value: 0, amplitude: new Complex(1 / Math.sqrt(2), 0) },
    ]);

    const result = QuantumConditionals.quantumIf(condition, () => 'A', () => 'B');
    const probs = result.getProbabilities();

    expect(probs.get('A')).toBeCloseTo(0.5, 12);
    expect(probs.get('B')).toBeCloseTo(0.5, 12);
  });

  test('quantumSwitch routes each branch and supports defaultCase', () => {
    const state = new QuantumState([
      { value: 'coffee', amplitude: new Complex(Math.sqrt(0.6), 0) },
      { value: 'tea', amplitude: new Complex(Math.sqrt(0.3), 0) },
      { value: 'water', amplitude: new Complex(Math.sqrt(0.1), 0) },
    ]);

    const result = QuantumConditionals.quantumSwitch(
      state,
      {
        coffee: () => 'espresso',
        tea: () => 'green-tea',
      },
      () => 'default-drink'
    );

    const probs = result.getProbabilities();
    expect(probs.get('espresso')).toBeCloseTo(0.6, 12);
    expect(probs.get('green-tea')).toBeCloseTo(0.3, 12);
    expect(probs.get('default-drink')).toBeCloseTo(0.1, 12);
  });

  test('throws on invalid conditional inputs', () => {
    expect(() => QuantumConditionals.quantumIf({}, () => 1, () => 0)).toThrow(TypeError);
    expect(() => QuantumConditionals.quantumSwitch(new QuantumState([{ value: 'x', amplitude: new Complex(1, 0) }]), null)).toThrow(TypeError);
  });
});

describe('QuantumLoops', () => {
  test('quantumFor executes body over superposed states with history', () => {
    const initial = new QuantumState([
      { value: 0, amplitude: new Complex(Math.sqrt(0.5), 0) },
      { value: 10, amplitude: new Complex(Math.sqrt(0.5), 0) },
    ]);

    const { finalState, history } = QuantumLoops.quantumFor(2, initial, (value) => value + 1);

    const probs = finalState.getProbabilities();
    expect(probs.get(2)).toBeCloseTo(0.5, 12);
    expect(probs.get(12)).toBeCloseTo(0.5, 12);
    expect(history.length).toBe(3); // initial + 2 iterations
  });

  test('quantumWhile updates only values matching condition', () => {
    const initial = new QuantumState([
      { value: 0, amplitude: new Complex(Math.sqrt(0.5), 0) },
      { value: 3, amplitude: new Complex(Math.sqrt(0.5), 0) },
    ]);

    const result = QuantumLoops.quantumWhile(
      (value) => value < 2,
      (value) => value + 1,
      initial,
      10
    );

    const probs = result.finalState.getProbabilities();
    expect(probs.get(2)).toBeCloseTo(0.5, 12);
    expect(probs.get(3)).toBeCloseTo(0.5, 12);
    expect(result.terminatedByMaxIterations).toBe(false);
  });

  test('quantumWhile stops at maxIterations guard', () => {
    const initial = new QuantumState([{ value: 0, amplitude: new Complex(1, 0) }]);

    const result = QuantumLoops.quantumWhile(
      () => true,
      (value) => value + 1,
      initial,
      3
    );

    expect(result.terminatedByMaxIterations).toBe(true);
    expect(result.iterations).toBe(3);
    expect(result.finalState.getProbabilities().get(3)).toBeCloseTo(1, 12);
  });

  test('throws on invalid loop inputs', () => {
    const initial = new QuantumState([{ value: 0, amplitude: new Complex(1, 0) }]);

    expect(() => QuantumLoops.quantumFor(-1, initial, () => 0)).toThrow(RangeError);
    expect(() => QuantumLoops.quantumFor(1, {}, () => 0)).toThrow(TypeError);
    expect(() => QuantumLoops.quantumWhile(() => true, () => 0, initial, -1)).toThrow(RangeError);
  });
});
