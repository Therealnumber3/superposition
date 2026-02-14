const Complex = require('../src/core/Complex');
const QuantumState = require('../src/core/QuantumState');
const Entanglement = require('../src/core/Entanglement');

function printProbabilities(label, state) {
  console.log(`\n${label}`);
  const probs = state.getProbabilities();
  for (const [value, prob] of probs.entries()) {
    console.log(`  ${String(value)}: ${(prob * 100).toFixed(2)}%`);
  }
}

function main() {
  // A variable in superposition with complex amplitudes.
  const mood = new QuantumState([
    { value: 'focused', amplitude: new Complex(0.6, 0.2) },
    { value: 'curious', amplitude: new Complex(0.4, -0.1) },
    { value: 'tired', amplitude: new Complex(0.3, 0.2) },
  ]);

  console.log('Initial mood quantum state:');
  console.log(mood.toString());
  printProbabilities('Mood probabilities before measurement:', mood);

  // Entangle a recommendation state with mood.
  const action = new QuantumState([{ value: 'unknown', amplitude: new Complex(1, 0) }]);

  new Entanglement(mood, action, (moodValue) => {
    if (moodValue === 'focused') return 'deep-work';
    if (moodValue === 'curious') return 'research';
    return 'recovery';
  });

  console.log('\nEntangled action state:');
  console.log(action.toString());
  printProbabilities('Action probabilities before measurement:', action);

  // Measurement collapses mood and instantly collapses entangled action.
  const observedMood = mood.measure();

  console.log(`\nMeasured mood: ${observedMood}`);
  console.log('Mood after collapse:');
  console.log(mood.toString());

  console.log('\nAction after mood measurement (entanglement collapse):');
  console.log(action.toString());
  printProbabilities('Action probabilities after collapse:', action);
}

main();
