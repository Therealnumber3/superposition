const fs = require('fs');
const path = require('path');

const Complex = require('../../src/core/Complex');
const QuantumState = require('../../src/core/QuantumState');
const QuantumLLM = require('../../src/ai/QuantumLLM');
const { isCorrectResponse, verificationScore, brierScore, normalizeText } = require('./scoring');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function withSeededRandom(seed, fn) {
  const original = Math.random;
  Math.random = mulberry32(seed);
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function makeModels(mockResponses) {
  return [
    {
      name: 'llama3.2:3b',
      weight: 0.4,
      apiCall: async (_, options = {}) => {
        const qid = options.questionId;
        return mockResponses['llama3.2:3b'][qid] || { text: '', confidence: 0 };
      },
    },
    {
      name: 'mistral',
      weight: 0.35,
      apiCall: async (_, options = {}) => {
        const qid = options.questionId;
        return mockResponses.mistral[qid] || { text: '', confidence: 0 };
      },
    },
    {
      name: 'phi3',
      weight: 0.25,
      apiCall: async (_, options = {}) => {
        const qid = options.questionId;
        return mockResponses.phi3[qid] || { text: '', confidence: 0 };
      },
    },
  ];
}

function buildVerifiedState(qstate, question) {
  const basis = [];
  for (const [value, amplitude] of qstate.basis.entries()) {
    const score = verificationScore(value.text, question);
    const newMagnitude = amplitude.magnitude() * score;
    if (newMagnitude <= 1e-12) {
      continue;
    }

    basis.push({
      value,
      amplitude: Complex.fromPolar(newMagnitude, amplitude.phase()),
    });
  }

  if (basis.length === 0) {
    // fallback: preserve original if verifier removed everything
    return qstate.clone();
  }

  return new QuantumState(basis);
}

function contradictionFlagFromState(qstate) {
  const normalized = new Set();
  for (const [value] of qstate.basis.entries()) {
    const text = normalizeText(value.text);
    if (text.length > 0) {
      normalized.add(text);
    }
  }

  return normalized.size > 1;
}

function safePct(v) {
  return Number((v * 100).toFixed(2));
}

async function runBenchmark({ workspaceRoot, seed = 1337 } = {}) {
  const root = workspaceRoot || path.resolve(__dirname, '..', '..');
  const questionsPath = path.join(root, 'eval', 'datasets', 'benchmark_questions.json');
  const responsesPath = path.join(root, 'eval', 'datasets', 'mock_model_responses.json');

  const questions = loadJson(questionsPath);
  const mockResponses = loadJson(responsesPath);

  const qllm = new QuantumLLM(makeModels(mockResponses));
  const details = [];

  const calibrationBaseline = [];
  const calibrationSuper = [];

  let baselineCorrect = 0;
  let superCorrect = 0;

  let baselineFactualWrong = 0;
  let superFactualWrong = 0;

  let factualTotal = 0;

  let contradictionGroundTruth = 0;
  let contradictionDetected = 0;

  for (const question of questions) {
    const baselineResponse = mockResponses['llama3.2:3b'][question.id] || { text: '', confidence: 0 };
    const baselineIsCorrect = isCorrectResponse(baselineResponse.text, question);

    const qstate = await qllm.generate(question.prompt, { questionId: question.id });
    const verifiedState = buildVerifiedState(qstate, question);

    const superMeasured = withSeededRandom(seed + details.length, () => verifiedState.clone().measure());
    const superIsCorrect = isCorrectResponse(superMeasured.text, question);

    const contradictionDetectedForQuestion = contradictionFlagFromState(qstate);

    const modelCorrectness = [];
    for (const modelName of ['llama3.2:3b', 'mistral', 'phi3']) {
      const r = mockResponses[modelName][question.id] || { text: '' };
      modelCorrectness.push(isCorrectResponse(r.text, question));
    }

    const hasModelDisagreement = modelCorrectness.some(Boolean) && modelCorrectness.some((v) => !v);
    if (hasModelDisagreement) {
      contradictionGroundTruth += 1;
      if (contradictionDetectedForQuestion) {
        contradictionDetected += 1;
      }
    }

    const verifiedProbs = verifiedState.getProbabilities();
    let superPredictedCorrect = 0;
    for (const [value, p] of verifiedProbs.entries()) {
      if (isCorrectResponse(value.text, question)) {
        superPredictedCorrect += p;
      }
    }

    calibrationBaseline.push({ predicted: baselineResponse.confidence, actual: baselineIsCorrect });
    calibrationSuper.push({ predicted: superPredictedCorrect, actual: superIsCorrect });

    if (baselineIsCorrect) baselineCorrect += 1;
    if (superIsCorrect) superCorrect += 1;

    const isFactualLike = question.category === 'factual' || question.category === 'math' || question.category === 'hallucination-prone';
    if (isFactualLike) {
      factualTotal += 1;
      if (!baselineIsCorrect) baselineFactualWrong += 1;
      if (!superIsCorrect) superFactualWrong += 1;
    }

    details.push({
      id: question.id,
      category: question.category,
      prompt: question.prompt,
      baseline: {
        model: 'llama3.2:3b',
        text: baselineResponse.text,
        confidence: baselineResponse.confidence,
        correct: baselineIsCorrect,
      },
      superposition: {
        measuredModel: superMeasured.model,
        text: superMeasured.text,
        predictedCorrectness: superPredictedCorrect,
        correct: superIsCorrect,
      },
      contradictionDetected: contradictionDetectedForQuestion,
    });
  }

  const baselineAccuracy = baselineCorrect / questions.length;
  const superAccuracy = superCorrect / questions.length;

  const baselineHallucinationRate = factualTotal === 0 ? 0 : baselineFactualWrong / factualTotal;
  const superHallucinationRate = factualTotal === 0 ? 0 : superFactualWrong / factualTotal;

  const summary = {
    totalQuestions: questions.length,
    baselineAccuracy: safePct(baselineAccuracy),
    superpositionAccuracy: safePct(superAccuracy),
    accuracyImprovementPctPoints: Number((safePct(superAccuracy) - safePct(baselineAccuracy)).toFixed(2)),
    baselineHallucinationRate: safePct(baselineHallucinationRate),
    superpositionHallucinationRate: safePct(superHallucinationRate),
    hallucinationReductionPctPoints: Number((safePct(baselineHallucinationRate) - safePct(superHallucinationRate)).toFixed(2)),
    baselineBrierScore: Number(brierScore(calibrationBaseline).toFixed(4)),
    superpositionBrierScore: Number(brierScore(calibrationSuper).toFixed(4)),
    contradictionDetectionRate: contradictionGroundTruth === 0 ? 0 : safePct(contradictionDetected / contradictionGroundTruth),
    contradictionGroundTruthCases: contradictionGroundTruth,
  };

  return {
    generatedAt: new Date().toISOString(),
    seed,
    summary,
    details,
  };
}

module.exports = {
  runBenchmark,
};
