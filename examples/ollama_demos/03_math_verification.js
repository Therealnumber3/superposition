const {
  createQuantumLLM,
  ensureReadyOrExit,
  printStateSummary,
} = require('./_utils');

function extractInteger(text) {
  const match = String(text).match(/-?\d+/);
  return match ? Number(match[0]) : null;
}

async function main() {
  await ensureReadyOrExit();

  const qllm = createQuantumLLM();
  const prompt = 'Compute 47 * 29. Return only the final integer answer.';
  const expected = 47 * 29;

  const qstate = await qllm.generate(prompt);

  console.log('=== Demo 3: Math Problem + Verification ===');
  console.log(`Prompt: ${prompt}`);
  printStateSummary('Quantum response state', qstate);

  const measured = await qllm.measureWithVerification(qstate, async (text) => {
    const parsed = extractInteger(text);
    if (parsed === null) return 0.1;
    return parsed === expected ? 1 : 0.05;
  });

  console.log(`\nExpected value: ${expected}`);
  console.log('Collapsed answer after numeric verification:');
  console.log(`- model: ${measured.model}`);
  console.log(`- text: ${measured.text}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
