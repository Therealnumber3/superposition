# SUPERPOSITION AI Accuracy Benchmark

Generated: 2026-02-14T13:39:03.963Z
Seed: 1337

## Summary

- Total questions: 12
- Baseline accuracy: 25%
- SUPERPOSITION accuracy: 83.33%
- Accuracy improvement: 58.33 percentage points
- Baseline hallucination rate: 75%
- SUPERPOSITION hallucination rate: 16.67%
- Hallucination reduction: 58.33 percentage points
- Baseline Brier score: 0.2941
- SUPERPOSITION Brier score: 0.0001
- Contradiction detection rate: 100% (8 disagreement cases)

## Notes

- Baseline = single-model response (`llama3.2:3b`).
- SUPERPOSITION = weighted multi-model generation + verifier-weighted collapse.
- Lower Brier score indicates better confidence calibration.

