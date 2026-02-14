const { performance } = require('perf_hooks');
const {
  Complex,
  QuantumState,
  QuantumGates,
  Interference,
  QuantumConditionals,
  QuantumLoops,
} = require('../src');

function makeState(size) {
  const basis = [];
  const amp = 1 / Math.sqrt(size);
  for (let i = 0; i < size; i += 1) {
    basis.push({ value: `s${i}`, amplitude: new Complex(amp, 0) });
  }
  return new QuantumState(basis);
}

function timed(label, fn) {
  const t0 = performance.now();
  const result = fn();
  const t1 = performance.now();
  return { label, ms: t1 - t0, result };
}

function main() {
  const state100 = makeState(100);

  const ops = [];
  ops.push(timed('Normalize + stabilize (100 states)', () => state100.clone().stabilize()));
  ops.push(timed('Rotate gate (100 states)', () => QuantumGates.rotate(state100, Math.PI / 3)));
  ops.push(
    timed('Interference of 4x100 states', () =>
      Interference.interfere([state100, state100.clone(), state100.clone(), state100.clone()])
    )
  );

  const boolState = new QuantumState([
    { value: true, amplitude: new Complex(Math.sqrt(0.7), 0) },
    { value: false, amplitude: new Complex(Math.sqrt(0.3), 0) },
  ]);

  ops.push(
    timed('Quantum if branch combine', () =>
      QuantumConditionals.quantumIf(
        boolState,
        () => new QuantumState([{ value: 'then', amplitude: new Complex(1, 0) }]),
        () => new QuantumState([{ value: 'else', amplitude: new Complex(1, 0) }])
      )
    )
  );

  ops.push(
    timed('Quantum for x10 over 100 states', () =>
      QuantumLoops.quantumFor(10, state100, (v) => `${v}-n`)
    )
  );

  console.log('--- SUPERPOSITION Benchmark ---');
  for (const op of ops) {
    console.log(`${op.label}: ${op.ms.toFixed(3)} ms`);
  }

  const slow = ops.filter((op) => op.ms > 100);
  console.log(`\nOperations > 100ms: ${slow.length}/${ops.length}`);
}

main();
