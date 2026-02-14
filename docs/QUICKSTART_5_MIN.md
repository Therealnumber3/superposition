# Quick Start in 5 Minutes

## 1) Install

```bash
npm install superposition
```

(If using this repo directly: `npm install`)

## 2) Create a file `quickstart.js`

```javascript
const {
  QuantumState,
  Complex,
  QuantumGates,
  QuantumConditionals,
} = require('superposition');

const state = new QuantumState([
  { value: true, amplitude: new Complex(Math.sqrt(0.7), 0) },
  { value: false, amplitude: new Complex(Math.sqrt(0.3), 0) },
]);

const transformed = QuantumGates.phase(state, true, Math.PI / 4);

const result = QuantumConditionals.quantumIf(
  transformed,
  () => 'high-confidence-path',
  () => 'fallback-path'
);

console.log(result.toString());
console.log('Probabilities:', Object.fromEntries(result.getProbabilities()));
console.log('Measurement:', result.measure());
```

## 3) Run

```bash
node quickstart.js
```

## 4) Expected Outcome

- You’ll see a superposition string with weighted paths.
- Probabilities sum to ~1.
- `measure()` collapses to one concrete outcome.

## 5) More Docs

- `docs/API.md`
- `docs/EVAL.md`
- `docs/OLLAMA_DEMOS.md`
