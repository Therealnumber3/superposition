function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isCorrectResponse(text, question) {
  const normalized = normalizeText(text);
  const accepted = (question.acceptedAnswers || []).map(normalizeText);

  if (question.strict) {
    return accepted.some((answer) => normalized === answer);
  }

  return accepted.some((answer) => normalized.includes(answer));
}

function verificationScore(text, question) {
  if (isCorrectResponse(text, question)) {
    return 1;
  }

  const normalized = normalizeText(text);

  // Encourage explicit uncertainty over fabricated claims for hallucination-prone prompts.
  if (question.category === 'hallucination-prone') {
    if (
      normalized.includes('not proven') ||
      normalized.includes('no peer reviewed') ||
      normalized.includes('no human has landed') ||
      normalized.includes('none')
    ) {
      return 0.8;
    }
  }

  return 0.1;
}

function brierScore(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return 0;
  }

  const sum = rows.reduce((acc, row) => {
    const p = Math.max(0, Math.min(1, Number(row.predicted) || 0));
    const y = row.actual ? 1 : 0;
    return acc + (p - y) ** 2;
  }, 0);

  return sum / rows.length;
}

module.exports = {
  normalizeText,
  isCorrectResponse,
  verificationScore,
  brierScore,
};
