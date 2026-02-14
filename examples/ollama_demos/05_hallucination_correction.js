const {
  createQuantumLLM,
  ensureReadyOrExit,
  printStateSummary,
} = require('./_utils');

async function main() {
  await ensureReadyOrExit();

  const qllm = createQuantumLLM();
  const prompt = 'In what year did the first human land on Mars? Answer directly.';

  const qstate = await qllm.generate(prompt);

  console.log('=== Demo 5: Hallucination-Prone Question + Correction ===');
  console.log(`Prompt: ${prompt}`);
  printStateSummary('Pre-verification superposition', qstate);

  const measured = await qllm.measureWithVerification(qstate, async (text) => {
    const normalized = text.toLowerCase();
    const indicatesNoLanding =
      normalized.includes('no human has landed') ||
      normalized.includes('humans have not landed') ||
      normalized.includes('not landed on mars');

    // Penalize fabricated specific years.
    const yearMention = /\b(19|20)\d{2}\b/.test(normalized);

    if (indicatesNoLanding) return 1;
    if (yearMention) return 0.02;
    return 0.15;
  });

  console.log('\nPost-verification collapse (correction target):');
  console.log(`- model: ${measured.model}`);
  console.log(`- text: ${measured.text}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
