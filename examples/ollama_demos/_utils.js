const ollama = require('ollama');
const { QuantumLLM, Interference } = require('../../src');

const DEFAULT_MODELS = [
  { name: 'llama3.2:3b', weight: 0.4 },
  { name: 'mistral', weight: 0.35 },
  { name: 'phi3', weight: 0.25 },
];

function createQuantumLLM(models = DEFAULT_MODELS) {
  const configured = models.map((model) => ({
    ...model,
    apiCall: async (prompt) => {
      const response = await ollama.chat({
        model: model.name,
        messages: [{ role: 'user', content: prompt }],
      });

      return {
        text: response.message?.content || '',
        confidence: model.confidence ?? 0.8,
        metadata: { model: model.name },
      };
    },
  }));

  return new QuantumLLM(configured);
}

async function checkOllamaReady(models = DEFAULT_MODELS) {
  try {
    const listed = await ollama.list();
    const installed = new Set((listed.models || []).map((m) => m.model));

    const missing = models
      .map((m) => m.name)
      .filter((name) => !Array.from(installed).some((installedName) => installedName.startsWith(name)));

    return {
      ok: missing.length === 0,
      missing,
    };
  } catch (error) {
    return {
      ok: false,
      missing: models.map((m) => m.name),
      error: error.message,
    };
  }
}

function printStateSummary(label, qstate) {
  console.log(`\n${label}`);
  console.log(qstate.toString());
  console.log('\nProbabilities by model:');
  for (const [value, probability] of qstate.getProbabilities().entries()) {
    const snippet = String(value.text || '').replace(/\s+/g, ' ').slice(0, 90);
    console.log(`- ${value.model}: ${(probability * 100).toFixed(2)}% | ${snippet}`);
  }
}

function printInterference(qstate) {
  const analysis = Interference.analyzeInterference([qstate]);
  console.log('\nInterference analysis:');
  console.log(`- constructive: ${analysis.constructive.length}`);
  console.log(`- destructive: ${analysis.destructive.length}`);
  console.log(`- neutral: ${analysis.neutral.length}`);
}

async function ensureReadyOrExit() {
  const readiness = await checkOllamaReady();
  if (readiness.ok) {
    return;
  }

  console.error('Ollama is not ready for live demos.');
  if (readiness.error) {
    console.error(`Error: ${readiness.error}`);
  }
  if (readiness.missing.length) {
    console.error(`Missing models: ${readiness.missing.join(', ')}`);
  }
  console.error('Run: ollama serve');
  console.error('Then: ollama pull llama3.2:3b && ollama pull mistral && ollama pull phi3');
  process.exit(1);
}

module.exports = {
  DEFAULT_MODELS,
  createQuantumLLM,
  printStateSummary,
  printInterference,
  ensureReadyOrExit,
};
