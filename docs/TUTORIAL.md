# Tutorial

## 1) Create a superposed variable

```javascript
const { QuantumState, Complex } = require('../src');

const mood = new QuantumState([
  { value: 'focused', amplitude: new Complex(0.6, 0.2) },
  { value: 'curious', amplitude: new Complex(0.4, -0.1) },
]);
```

## 2) Inspect probabilities

```javascript
console.log(mood.getProbabilities());
```

## 3) Measure (collapse)

```javascript
const observed = mood.measure();
console.log(observed);
```

## 4) Entangle two states

```javascript
const { Entanglement } = require('../src');

const action = new QuantumState([{ value: 'unknown', amplitude: new Complex(1, 0) }]);
new Entanglement(mood, action, (m) => (m === 'focused' ? 'deep-work' : 'research'));
```

## 5) Use quantum control flow

```javascript
const { QuantumConditionals } = require('../src');

const output = QuantumConditionals.quantumIf(
  mood,
  () => 'write-code',
  () => 'read-papers'
);
```

## 6) Multi-model AI superposition

```javascript
const { QuantumLLM } = require('../src');

const qllm = new QuantumLLM([
  { name: 'model-a', weight: 0.5, apiCall: async () => ({ text: '...', confidence: 0.8 }) },
  { name: 'model-b', weight: 0.5, apiCall: async () => ({ text: '...', confidence: 0.9 }) },
]);

const qresponse = await qllm.generate('What is the capital of France?');
```
