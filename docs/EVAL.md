# AI Evaluation Harness

This benchmark measures whether SUPERPOSITION improves factual reliability versus a single-model baseline.

## What It Measures

- **Accuracy improvement**: SUPERPOSITION correctness minus baseline correctness
- **Hallucination reduction**: factual/math error rate delta (lower is better)
- **Confidence calibration**: Brier score (lower is better)
- **Contradiction detection**: rate of flagged multi-model disagreements

## Benchmark Setup

- Dataset: `eval/datasets/benchmark_questions.json`
- Mock model outputs: `eval/datasets/mock_model_responses.json`
- Baseline: single-model (`llama3.2:3b`) output
- SUPERPOSITION: weighted ensemble (`llama3.2:3b`, `mistral`, `phi3`) + verification-weighted collapse
- Randomness: deterministic seeded measurement for reproducibility

## Run

```bash
npm run benchmark:accuracy
```

Outputs:
- `eval/results/latest.json`
- `eval/results/latest.md`

## Interpreting Results

- Higher SUPERPOSITION accuracy indicates improved factual selection.
- Lower SUPERPOSITION hallucination rate indicates fewer fabricated wrong answers.
- Lower SUPERPOSITION Brier score indicates better uncertainty calibration.
- Higher contradiction detection rate indicates better disagreement surfacing.
