const ollama = require('ollama');
const QuantumLLM = require('../src/ai/QuantumLLM');

function buildModels() {
  return [
    {
      name: 'llama3.2:3b',
      weight: 0.4,
      apiCall: async (prompt) => {
        const response = await ollama.chat({
          model: 'llama3.2:3b',
          messages: [{ role: 'user', content: prompt }],
        });

        return {
          text: response.message?.content || '',
          confidence: 0.85,
          metadata: { model: 'llama3.2:3b' },
        };
      },
    },
    {
      name: 'mistral',
      weight: 0.35,
      apiCall: async (prompt) => {
        const response = await ollama.chat({
          model: 'mistral',
          messages: [{ role: 'user', content: prompt }],
        });

        return {
          text: response.message?.content || '',
          confidence: 0.82,
          metadata: { model: 'mistral' },
        };
      },
    },
    {
      name: 'phi3',
      weight: 0.25,
      apiCall: async (prompt) => {
        const response = await ollama.chat({
          model: 'phi3',
          messages: [{ role: 'user', content: prompt }],
        });

        return {
          text: response.message?.content || '',
          confidence: 0.78,
          metadata: { model: 'phi3' },
        };
      },
    },
  ];
}

async function runQuestion(qllm, prompt) {
  console.log(`\nQuestion: ${prompt}`);

  const qresponse = await qllm.generate(prompt);
  console.log('\nQuantum response state:');
  console.log(qresponse.toString());

  const probabilities = qresponse.getProbabilities();
  console.log('\nModel-weighted probabilities:');
  for (const [value, prob] of probabilities.entries()) {
    const snippet = value.text.replace(/\s+/g, ' ').slice(0, 80);
    console.log(`  ${value.model}: ${(prob * 100).toFixed(2)}% -> ${snippet}`);
  }

  const measured = await qllm.measureWithVerification(qresponse, async (text) => {
    const normalized = text.toLowerCase();

    if (prompt.toLowerCase().includes('capital of france')) {
      return normalized.includes('paris') ? 1 : 0.1;
    }

    if (prompt.includes('2+2')) {
      return normalized.includes('4') ? 1 : 0.1;
    }

    return 0.7;
  });

  console.log('\nMeasured answer after verification collapse:');
  console.log(`  Model: ${measured.model}`);
  console.log(`  Text: ${measured.text}`);
}

async function main() {
  console.log('--- Quantum AI Demo (Ollama) ---');
  console.log('Requires: `ollama serve` and models: llama3.2:3b, mistral, phi3');

  const qllm = new QuantumLLM(buildModels());

  await runQuestion(qllm, 'What is 2+2?');
  await runQuestion(qllm, 'What is the capital of France?');
}

main().catch((error) => {
  console.error('\nQuantum AI demo failed.');
  console.error('Likely causes: Ollama is not running or a model is missing.');
  console.error('Run: `ollama serve` and `ollama pull llama3.2:3b mistral phi3`');
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
