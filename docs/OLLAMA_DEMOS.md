# Live Ollama Demo Pack

This guide runs the five Priority-2 live demos proving SUPERPOSITION behavior on real local models.

## 1) Install Ollama (Windows)

PowerShell (recommended):

```powershell
winget install Ollama.Ollama
```

If `winget` is unavailable, install from:
- https://ollama.com/download/windows

## 2) Start Ollama server

```powershell
ollama serve
```

Keep this terminal open.

## 3) Pull required models

Open a second terminal:

```powershell
ollama pull llama3.2:3b
ollama pull mistral
ollama pull phi3
```

## 4) Run demos from project root

```powershell
npm run demo:ollama:factual
npm run demo:ollama:ambiguous
npm run demo:ollama:math
npm run demo:ollama:creative
npm run demo:ollama:hallucination
```

Or run everything:

```powershell
npm run demo:ollama:all
```

## Demo objectives

1. `demo:ollama:factual`
   - Factual question (capital of France)
   - Shows model superposition + verification collapse

2. `demo:ollama:ambiguous`
   - Ambiguous question (best programming language)
   - Shows uncertainty metrics (entropy/support/max probability)

3. `demo:ollama:math`
   - Math problem
   - Shows numeric verification weighting and corrected collapse

4. `demo:ollama:creative`
   - Creative generation
   - Shows diversity maintenance while uncollapsed

5. `demo:ollama:hallucination`
   - Hallucination-prone prompt (human landing on Mars)
   - Penalizes fabricated years and favors uncertainty-correct responses

## Troubleshooting

- `ollama: command not found`
  - Restart terminal after install, or reboot once.
- Model missing errors
  - Re-run `ollama pull ...` for missing model.
- Connection refused
  - Ensure `ollama serve` is still running.
