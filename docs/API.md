# API

## Core

### `Complex`
- `new Complex(real, imag)`
- `magnitude()`, `magnitudeSquared()`, `phase()`
- `add()`, `subtract()`, `multiply()`, `divide()`, `scale()`
- `conjugate()`, `equals()`, `clone()`
- `Complex.fromPolar(magnitude, phase)`

### `QuantumState`
- `new QuantumState([{ value, amplitude }])`
- `normalize()`, `stabilize()`
- `getProbabilities()`, `getAmplitude(value)`, `setAmplitude(value, amplitude)`
- `measure()`, `collapseTo(value, metadata)`
- `clone()`, `toString()`
- `getCoherenceMetrics()`, `isNearClassical(threshold)`

### `Entanglement`
- `new Entanglement(state1, state2, relationFn)`
- `updateEntanglement(source?)`
- `onMeasurement(measuredState, measuredValue)`
- `dispose()`

## Operators

### `QuantumGates`
- `hadamard(qstate)`
- `phase(qstate, targetValue, phaseAngle)`
- `rotate(qstate, angle)`
- `amplify(qstate, targetValues, factor?)`

### `Interference`
- `interfere(qstates, weights?)`
- `analyzeInterference(qstates, options?)`

## Control

### `QuantumConditionals`
- `quantumIf(condition, thenBranch, elseBranch)`
- `quantumSwitch(qstate, cases, defaultCase?)`

### `QuantumLoops`
- `quantumFor(iterations, initialState, bodyFn)`
- `quantumWhile(condition, bodyFn, initialState, maxIterations?)`

## AI

### `QuantumLLM`
- `new QuantumLLM(models)`
- `generate(prompt, options?)`
- `measureWithVerification(qstate, verificationFn)`
- `QuantumLLM.ensemble(qstates, analysisMode?)`

## Tools

### `QuantumVisualizer`
- `snapshot(qstate, options?)`
- `toBarChartData(qstate, options?)`
- `toEvolutionData(history, options?)`
- `toAsciiBars(qstate, options?)`

### `QuantumDebugger`
- `new QuantumDebugger(initialState)`
- `step(label, transformFn)`
- `checkpoint(label)`
- `measure(label?)`
- `rewind(index)`
- `subscribe(listener)`
- `getCurrentState()`
- `timeline()`
