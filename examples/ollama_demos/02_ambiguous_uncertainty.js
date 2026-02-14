const {
  createQuantumLLM,
  ensureReadyOrExit,
  printStateSummary,
} = require('./_utils');

async function main() {
  await ensureReadyOrExit();

  const qllm = createQuantumLLM();
  const prompt = 'What is the best programming language? Explain tradeoffs briefly.';

  const qstate = await qllm.generate(prompt);

  console.log('=== Demo 2: Ambiguous Question + Uncertainty ===');
  console.log(`Prompt: ${prompt}`);
  printStateSummary('Quantum response state', qstate);

  const metrics = qstate.getCoherenceMetrics();
  console.log('\nUncertainty diagnostics:');
  console.log(`- support size: ${metrics.supportSize}`);
  console.log(`- max probability: ${(metrics.maxProbability * 100).toFixed(2)}%`);
  console.log(`- entropy (bits): ${metrics.entropy.toFixed(4)}`);
  console.log(`- near classical: ${metrics.isClassical}`);

  const measured = qstate.clone().measure();
  console.log('\nSingle collapsed sample (without verification):');
  console.log(`- model: ${measured.model}`);
  console.log(`- text: ${measured.text}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
