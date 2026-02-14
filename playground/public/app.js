const codeInput = document.getElementById('codeInput');
const runBtn = document.getElementById('runBtn');
const resultOutput = document.getElementById('resultOutput');
const logsOutput = document.getElementById('logsOutput');

codeInput.value = `const { QuantumState, Complex, QuantumGates, QuantumVisualizer } = runtime;

const q = new QuantumState([
  { value: 0, amplitude: new Complex(1 / Math.sqrt(2), 0) },
  { value: 1, amplitude: new Complex(1 / Math.sqrt(2), 0) },
]);

const h = QuantumGates.hadamard(q);
console.log('Hadamard output:', h.toString());
console.log(QuantumVisualizer.toAsciiBars(h));

result = h;`;

async function runCode() {
  runBtn.disabled = true;
  resultOutput.textContent = 'Running...';
  logsOutput.textContent = '';

  try {
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: codeInput.value }),
    });

    const payload = await response.json();

    if (!response.ok) {
      resultOutput.textContent = `Error: ${payload.error || 'Unknown error'}`;
      return;
    }

    resultOutput.textContent = JSON.stringify(payload.result, null, 2);
    logsOutput.textContent = payload.logs.length ? payload.logs.join('\n') : '(no logs)';
  } catch (error) {
    resultOutput.textContent = `Error: ${error.message}`;
  } finally {
    runBtn.disabled = false;
  }
}

runBtn.addEventListener('click', runCode);
