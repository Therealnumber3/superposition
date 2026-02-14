# Installation Guide

This guide covers two usage modes:
- **Library mode** (use SUPERPOSITION runtime in your own JS project)
- **Research/demo mode** (run evaluation + live Ollama demos)

## Prerequisites

- Node.js 18+
- npm 9+
- (Optional for live LLM demos) Ollama installed locally

## Library Mode

Install from npm (after publish):

```bash
npm install superposition
```

Or from local source:

```bash
git clone <repo-url>
cd superposition
npm install
```

Use in code:

```javascript
const { QuantumState, Complex } = require('superposition');
```

## Research/Demo Mode

From repo root:

```bash
npm install
npm test
npm run benchmark:accuracy
```

Outputs:
- `eval/results/latest.json`
- `eval/results/latest.md`

## Ollama (Optional, live demos)

Install Ollama and run:

```bash
ollama serve
ollama pull llama3.2:3b
ollama pull mistral
ollama pull phi3
```

Then execute demos:

```bash
npm run demo:ollama:all
```

## Verification Before Release

```bash
npm run release:check
npm run pack:check
```

These commands validate tests/benchmark and preview npm package contents.
