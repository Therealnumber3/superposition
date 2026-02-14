const { QuantumState, Complex, QuantumGates, QuantumDebugger, QuantumVisualizer } = require('../src');

function main() {
  const initial = new QuantumState([
    { value: 0, amplitude: new Complex(1 / Math.sqrt(2), 0) },
    { value: 1, amplitude: new Complex(1 / Math.sqrt(2), 0) },
  ]);

  const debuggerTool = new QuantumDebugger(initial);

  debuggerTool.subscribe(({ step, currentState }) => {
    console.log(`\n[${step.type}] ${step.label}`);
    console.log(currentState.toString());
  });

  debuggerTool.step('apply-hadamard', (state) => QuantumGates.hadamard(state));
  debuggerTool.checkpoint('post-hadamard');

  console.log('\nASCII view of current state:');
  console.log(QuantumVisualizer.toAsciiBars(debuggerTool.getCurrentState()));

  const measured = debuggerTool.measure('final-measurement');
  console.log(`\nMeasured value: ${measured}`);

  console.log('\nTimeline:');
  console.log(debuggerTool.timeline());
}

main();
