const Complex = require('../src/core/Complex');
const QuantumState = require('../src/core/QuantumState');
const Interference = require('../src/operators/Interference');

function printDistribution(title, qstate) {
  console.log(`\n${title}`);
  for (const [value, probability] of qstate.getProbabilities().entries()) {
    console.log(`  ${value}: ${(probability * 100).toFixed(2)}%`);
  }
}

function main() {
  // Constructive case: same phase amplitudes on X.
  const constructive1 = new QuantumState([
    { value: 'X', amplitude: new Complex(1, 0) },
    { value: 'Y', amplitude: new Complex(0, 0) },
  ]);

  const constructive2 = new QuantumState([
    { value: 'X', amplitude: new Complex(1, 0) },
    { value: 'Y', amplitude: new Complex(0, 0) },
  ]);

  const constructive = Interference.interfere([constructive1, constructive2]);
  printDistribution('Constructive interference (in-phase):', constructive);

  // Destructive case: opposite phase on X cancels, leaving Y.
  const destructive1 = new QuantumState([
    { value: 'X', amplitude: new Complex(1, 0) },
    { value: 'Y', amplitude: new Complex(1, 0) },
  ]);

  const destructive2 = new QuantumState([
    { value: 'X', amplitude: new Complex(-1, 0) },
    { value: 'Y', amplitude: new Complex(1, 0) },
  ]);

  const destructive = Interference.interfere([destructive1, destructive2]);
  printDistribution('Destructive interference (opposite phase):', destructive);

  const analysis = Interference.analyzeInterference([destructive1, destructive2]);
  console.log('\nInterference analysis summary:');
  console.log(`  Constructive terms: ${analysis.constructive.length}`);
  console.log(`  Destructive terms: ${analysis.destructive.length}`);
  console.log(`  Neutral terms: ${analysis.neutral.length}`);
}

main();
