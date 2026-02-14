const QuantumState = require('../src/core/QuantumState');
const Complex = require('../src/core/Complex');
const QuantumLLM = require('../src/ai/QuantumLLM');

describe('QuantumLLM', () => {
  test('constructor validates model config and normalizes weights', () => {
    expect(() => new QuantumLLM([])).toThrow(RangeError);
    expect(() => new QuantumLLM([{ name: 'a', apiCall: () => ({}), weight: -1 }])).toThrow(RangeError);

    const qllm = new QuantumLLM([
      { name: 'm1', apiCall: async () => ({ text: 'A', confidence: 1 }), weight: 2 },
      { name: 'm2', apiCall: async () => ({ text: 'B', confidence: 1 }), weight: 1 },
    ]);

    const weightSum = qllm.models.reduce((sum, model) => sum + model.weight, 0);
    expect(weightSum).toBeCloseTo(1, 12);
    expect(qllm.models[0].weight).toBeCloseTo(2 / 3, 12);
    expect(qllm.models[1].weight).toBeCloseTo(1 / 3, 12);
  });

  test('generate returns quantum superposition of model responses', async () => {
    const qllm = new QuantumLLM([
      { name: 'm1', apiCall: async () => ({ text: 'Paris', confidence: 1 }), weight: 0.6 },
      { name: 'm2', apiCall: async () => ({ text: 'Lyon', confidence: 0.25 }), weight: 0.4 },
    ]);

    const state = await qllm.generate('Capital of France?');
    expect(state).toBeInstanceOf(QuantumState);

    const probs = Array.from(state.getProbabilities().entries());
    const totalProb = probs.reduce((sum, [, p]) => sum + p, 0);
    expect(totalProb).toBeCloseTo(1, 12);

    // m1 should dominate due to higher weighted confidence.
    const m1Probability = probs
      .filter(([value]) => value.model === 'm1')
      .reduce((sum, [, p]) => sum + p, 0);
    const m2Probability = probs
      .filter(([value]) => value.model === 'm2')
      .reduce((sum, [, p]) => sum + p, 0);

    expect(m1Probability).toBeGreaterThan(m2Probability);
  });

  test('generate handles model failure by assigning zero confidence', async () => {
    const qllm = new QuantumLLM([
      { name: 'ok', apiCall: async () => ({ text: 'safe', confidence: 1 }), weight: 0.5 },
      { name: 'bad', apiCall: async () => { throw new Error('offline'); }, weight: 0.5 },
    ]);

    const state = await qllm.generate('test');

    const probs = state.getProbabilities();
    const nonZero = Array.from(probs.entries()).filter(([, p]) => p > 0);
    expect(nonZero.length).toBe(1);

    const [value] = nonZero[0];
    expect(value.model).toBe('ok');
  });

  test('measureWithVerification reweights then collapses', async () => {
    const qllm = new QuantumLLM([
      { name: 'm1', apiCall: async () => ({ text: 'correct', confidence: 1 }), weight: 0.5 },
      { name: 'm2', apiCall: async () => ({ text: 'incorrect', confidence: 1 }), weight: 0.5 },
    ]);

    const qstate = await qllm.generate('2+2?');

    const measured = await qllm.measureWithVerification(qstate, async (text) =>
      text === 'correct' ? 1 : 0
    );

    expect(measured.text).toBe('correct');
    expect(measured.model).toBe('m1');
  });

  test('ensemble supports interference and classical modes', () => {
    const responseA = { text: 'A', model: 'm1', confidence: 1, metadata: {} };
    const responseB = { text: 'B', model: 'm2', confidence: 1, metadata: {} };

    const s1 = new QuantumState([
      { value: responseA, amplitude: new Complex(1, 0) },
      { value: responseB, amplitude: new Complex(0, 0) },
    ]);

    const s2 = new QuantumState([
      { value: responseA, amplitude: new Complex(1, 0) },
      { value: responseB, amplitude: new Complex(0, 0) },
    ]);

    const interference = QuantumLLM.ensemble([s1, s2], 'interference');
    const classical = QuantumLLM.ensemble([s1, s2], 'classical');

    expect(interference).toBeInstanceOf(QuantumState);
    expect(classical).toBeInstanceOf(QuantumState);

    const interferenceProbA = Array.from(interference.getProbabilities().entries())
      .filter(([value]) => value.text === 'A')
      .reduce((sum, [, p]) => sum + p, 0);

    const classicalProbA = Array.from(classical.getProbabilities().entries())
      .filter(([value]) => value.text === 'A')
      .reduce((sum, [, p]) => sum + p, 0);

    expect(interferenceProbA).toBeGreaterThan(0.99);
    expect(classicalProbA).toBeGreaterThan(0.99);

    expect(() => QuantumLLM.ensemble([], 'interference')).toThrow(RangeError);
    expect(() => QuantumLLM.ensemble([s1], 'unknown')).toThrow(RangeError);
  });
});
