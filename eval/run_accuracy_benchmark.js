const fs = require('fs');
const path = require('path');
const { runBenchmark } = require('./lib/benchmark');

function toMarkdown(report) {
  const s = report.summary;
  return [
    '# SUPERPOSITION AI Accuracy Benchmark',
    '',
    `Generated: ${report.generatedAt}`,
    `Seed: ${report.seed}`,
    '',
    '## Summary',
    '',
    `- Total questions: ${s.totalQuestions}`,
    `- Baseline accuracy: ${s.baselineAccuracy}%`,
    `- SUPERPOSITION accuracy: ${s.superpositionAccuracy}%`,
    `- Accuracy improvement: ${s.accuracyImprovementPctPoints} percentage points`,
    `- Baseline hallucination rate: ${s.baselineHallucinationRate}%`,
    `- SUPERPOSITION hallucination rate: ${s.superpositionHallucinationRate}%`,
    `- Hallucination reduction: ${s.hallucinationReductionPctPoints} percentage points`,
    `- Baseline Brier score: ${s.baselineBrierScore}`,
    `- SUPERPOSITION Brier score: ${s.superpositionBrierScore}`,
    `- Contradiction detection rate: ${s.contradictionDetectionRate}% (${s.contradictionGroundTruthCases} disagreement cases)`,
    '',
    '## Notes',
    '',
    '- Baseline = single-model response (`llama3.2:3b`).',
    '- SUPERPOSITION = weighted multi-model generation + verifier-weighted collapse.',
    '- Lower Brier score indicates better confidence calibration.',
    '',
  ].join('\n');
}

async function main() {
  const workspaceRoot = path.resolve(__dirname, '..');
  const report = await runBenchmark({ workspaceRoot, seed: 1337 });

  const resultsDir = path.join(workspaceRoot, 'eval', 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const jsonPath = path.join(resultsDir, 'latest.json');
  const mdPath = path.join(resultsDir, 'latest.md');

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(mdPath, `${toMarkdown(report)}\n`, 'utf8');

  console.log('SUPERPOSITION AI accuracy benchmark complete.');
  console.log(`- JSON report: ${jsonPath}`);
  console.log(`- Markdown report: ${mdPath}`);
  console.log('');
  console.log('Summary:');
  console.log(report.summary);
}

main().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exitCode = 1;
});
