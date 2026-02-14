const { QuantumState, Complex, QuantumVisualizer, QuantumLoops } = require('../src');

function main() {
  const initial = new QuantumState([
    { value: 'A', amplitude: new Complex(Math.sqrt(0.5), 0) },
    { value: 'B', amplitude: new Complex(Math.sqrt(0.3), 0) },
    { value: 'C', amplitude: new Complex(Math.sqrt(0.2), 0) },
  ]);

  console.log('Initial snapshot:');
  console.log(QuantumVisualizer.snapshot(initial));

  console.log('\nASCII bars:');
  console.log(QuantumVisualizer.toAsciiBars(initial));

  const history = QuantumLoops.quantumFor(4, initial, (value, i) => `${value}${i % 2}`).history;
  const evolution = QuantumVisualizer.toEvolutionData(history);

  console.log('\nEvolution summary (first two series):');
  console.log(evolution.series.slice(0, 2));
}

main();
