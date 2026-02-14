const {
  createQuantumLLM,
  ensureReadyOrExit,
  printInterference,
  printStateSummary,
} = require('./_utils');

async function main() {
  await ensureReadyOrExit();

  const qllm = createQuantumLLM();
  const prompt = 'What is the capital of France? Answer in one short sentence.';

  const qstate = await qllm.generate(prompt);

  console.log('=== Demo 1: Factual Question + Interference ===');
  console.log(`Prompt: ${prompt}`);
  printStateSummary('Quantum response state', qstate);
  printInterference(qstate);

  const measured = await qllm.measureWithVerification(qstate, async (text) => {
    return text.toLowerCase().includes('paris') ? 1 : 0.1;
  });

  console.log('\nCollapsed answer after verification:');
  console.log(`- model: ${measured.model}`);
  console.log(`- text: ${measured.text}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
