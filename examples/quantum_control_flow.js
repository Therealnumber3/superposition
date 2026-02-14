const Complex = require('../src/core/Complex');
const QuantumState = require('../src/core/QuantumState');
const QuantumConditionals = require('../src/control/QuantumConditionals');
const QuantumLoops = require('../src/control/QuantumLoops');

function printState(title, state) {
  console.log(`\n${title}`);
  console.log(state.toString());
  for (const [value, prob] of state.getProbabilities().entries()) {
    console.log(`  ${String(value)}: ${(prob * 100).toFixed(2)}%`);
  }
}

function demoQuantumIf() {
  const preference = new QuantumState([
    { value: true, amplitude: new Complex(Math.sqrt(0.7), 0) },
    { value: false, amplitude: new Complex(Math.sqrt(0.3), 0) },
  ]);

  const recommendation = QuantumConditionals.quantumIf(
    preference,
    () =>
      new QuantumState([
        { value: 'espresso', amplitude: new Complex(Math.sqrt(0.8), 0) },
        { value: 'latte', amplitude: new Complex(Math.sqrt(0.2), 0) },
      ]),
    () =>
      new QuantumState([
        { value: 'green-tea', amplitude: new Complex(Math.sqrt(0.6), 0) },
        { value: 'black-tea', amplitude: new Complex(Math.sqrt(0.4), 0) },
      ])
  );

  printState('Quantum If Recommendation:', recommendation);
}

function demoQuantumSwitch() {
  const request = new QuantumState([
    { value: 'search', amplitude: new Complex(Math.sqrt(0.5), 0) },
    { value: 'summarize', amplitude: new Complex(Math.sqrt(0.3), 0) },
    { value: 'plan', amplitude: new Complex(Math.sqrt(0.2), 0) },
  ]);

  const action = QuantumConditionals.quantumSwitch(
    request,
    {
      search: () => 'retrieve-docs',
      summarize: () => 'compress-context',
      plan: () => 'build-strategy',
    }
  );

  printState('Quantum Switch Action:', action);
}

function demoQuantumLoops() {
  const initial = new QuantumState([
    { value: 0, amplitude: new Complex(Math.sqrt(0.6), 0) },
    { value: 2, amplitude: new Complex(Math.sqrt(0.4), 0) },
  ]);

  const forResult = QuantumLoops.quantumFor(3, initial, (value) => value + 1);
  printState('Quantum For Final State:', forResult.finalState);

  const whileResult = QuantumLoops.quantumWhile(
    (value) => value < 4,
    (value) => value + 1,
    initial,
    10
  );
  printState('Quantum While Final State:', whileResult.finalState);
}

function main() {
  console.log('--- Quantum Control Flow Demo ---');
  demoQuantumIf();
  demoQuantumSwitch();
  demoQuantumLoops();
}

main();
