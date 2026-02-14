const {
  createQuantumLLM,
  ensureReadyOrExit,
  printStateSummary,
} = require('./_utils');

function diversityIndex(texts) {
  const tokenSets = texts.map((t) => new Set(String(t).toLowerCase().split(/\W+/).filter(Boolean)));
  if (tokenSets.length < 2) return 0;

  let totalDistance = 0;
  let pairs = 0;
  for (let i = 0; i < tokenSets.length; i += 1) {
    for (let j = i + 1; j < tokenSets.length; j += 1) {
      const a = tokenSets[i];
      const b = tokenSets[j];
      const union = new Set([...a, ...b]);
      let intersectionCount = 0;
      for (const token of a) {
        if (b.has(token)) intersectionCount += 1;
      }
      const jaccard = union.size === 0 ? 1 : intersectionCount / union.size;
      totalDistance += 1 - jaccard;
      pairs += 1;
    }
  }

  return pairs ? totalDistance / pairs : 0;
}

async function main() {
  await ensureReadyOrExit();

  const qllm = createQuantumLLM();
  const prompt = 'Write a two-sentence sci-fi microstory about a sentient telescope.';

  const qstate = await qllm.generate(prompt);

  console.log('=== Demo 4: Creative Task + Diversity Maintenance ===');
  console.log(`Prompt: ${prompt}`);
  printStateSummary('Quantum creative response state', qstate);

  const texts = Array.from(qstate.basis.keys()).map((value) => value.text);
  const d = diversityIndex(texts);

  console.log(`\nDiversity index (0-1, higher means more distinct responses): ${d.toFixed(4)}`);
  console.log('Keeping superposition uncollapsed preserves alternative creative outputs.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
