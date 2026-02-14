# Theory Notes

SUPERPOSITION uses quantum formalism on classical hardware.

## State Representation

A state is represented as:

`|ψ⟩ = Σᵢ αᵢ |i⟩`

where each `αᵢ` is a complex amplitude.

## Probability Rule

For basis value `i`:

`P(i) = |αᵢ|² = αᵢ.real² + αᵢ.imag²`

Normalization enforces:

`Σᵢ |αᵢ|² = 1`

## Interference

When combining paths that reach the same value:

`α_total = α₁ + α₂ + ...`

Probability is computed after summation:

`P = |α_total|²`

This yields constructive/destructive effects unavailable in classical averaging.

## Measurement

Measurement samples according to Born probabilities and collapses state to one value with amplitude `1 + 0i`.

## Decoherence Handling

Practical runtime stability includes:
- pruning near-zero amplitudes
- periodic re-normalization (`stabilize()`)
- diagnostics (`getCoherenceMetrics()`, `isNearClassical()`)
