const path = require('path');
const { runBenchmark } = require('../eval/lib/benchmark');

describe('AI accuracy benchmark harness', () => {
  test('produces reproducible report with superposition improvements', async () => {
    const workspaceRoot = path.resolve(__dirname, '..');
    const report = await runBenchmark({ workspaceRoot, seed: 1337 });

    expect(report).toBeDefined();
    expect(report.summary.totalQuestions).toBeGreaterThan(0);

    // Priority-1 objective: measurable improvement over baseline.
    expect(report.summary.superpositionAccuracy).toBeGreaterThan(report.summary.baselineAccuracy);
    expect(report.summary.superpositionHallucinationRate).toBeLessThan(report.summary.baselineHallucinationRate);

    // Better calibration should reduce Brier score.
    expect(report.summary.superpositionBrierScore).toBeLessThan(report.summary.baselineBrierScore);

    // Contradiction detector should trigger on at least some disagreement cases.
    expect(report.summary.contradictionGroundTruthCases).toBeGreaterThan(0);
    expect(report.summary.contradictionDetectionRate).toBeGreaterThan(0);
  });
});
