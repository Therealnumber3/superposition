const QuantumState = require('../core/QuantumState');
const Complex = require('../core/Complex');
const Interference = require('../operators/Interference');

/**
 * QuantumLLM creates superpositions of responses from multiple models.
 */
class QuantumLLM {
  /**
   * @param {Array<{name: string, apiCall: Function, weight: number}>} models
   */
  constructor(models) {
    if (!Array.isArray(models) || models.length === 0) {
      throw new RangeError('QuantumLLM requires a non-empty models array.');
    }

    this.models = models.map((model, index) => {
      if (!model || typeof model !== 'object') {
        throw new TypeError(`Model at index ${index} must be an object.`);
      }
      const { name, apiCall, weight } = model;
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw new TypeError(`Model at index ${index} must have a non-empty string name.`);
      }
      if (typeof apiCall !== 'function') {
        throw new TypeError(`Model ${name} must provide apiCall(prompt, options).`);
      }
      if (!Number.isFinite(weight) || weight < 0) {
        throw new RangeError(`Model ${name} weight must be a finite number >= 0.`);
      }
      return { name, apiCall, weight };
    });

    const totalWeight = this.models.reduce((sum, model) => sum + model.weight, 0);
    if (totalWeight <= Number.EPSILON) {
      throw new RangeError('At least one model weight must be > 0.');
    }

    // Normalize model weights so amplitudes remain stable and interpretable.
    this.models = this.models.map((model) => ({
      ...model,
      weight: model.weight / totalWeight,
    }));
  }

  /**
   * Query all models in parallel and return a quantum superposition of responses.
   *
   * Amplitude magnitude uses sqrt(weight * confidence) so probability mass
   * aligns with weighted confidence after normalization.
   *
   * @param {string} prompt
   * @param {object} [options]
   * @returns {Promise<QuantumState>}
   */
  async generate(prompt, options = {}) {
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new TypeError('generate requires a non-empty string prompt.');
    }

    const responses = await Promise.all(
      this.models.map((model) => this._queryModel(model, prompt, options))
    );

    const basis = [];

    for (let index = 0; index < responses.length; index += 1) {
      const response = responses[index];
      const model = this.models[index];

      const confidence = QuantumLLM._clamp01(response.confidence);
      const magnitude = Math.sqrt(model.weight * confidence);

      if (magnitude <= Number.EPSILON) {
        continue;
      }

      basis.push({
        value: {
          text: response.text,
          model: model.name,
          confidence,
          metadata: response.metadata || {},
        },
        amplitude: Complex.fromPolar(magnitude, 0),
      });
    }

    if (basis.length === 0) {
      throw new Error('All model responses have zero confidence; cannot build quantum superposition.');
    }

    return new QuantumState(basis);
  }

  /**
   * Reweights amplitudes by verifier score and then measures.
   *
   * @param {QuantumState} qstate
   * @param {(text:string, response:any)=>Promise<number>|number} verificationFn returns score [0,1]
   * @returns {Promise<any>} collapsed response object
   */
  async measureWithVerification(qstate, verificationFn) {
    if (!(qstate instanceof QuantumState)) {
      throw new TypeError('measureWithVerification requires qstate to be QuantumState.');
    }
    if (typeof verificationFn !== 'function') {
      throw new TypeError('measureWithVerification requires verificationFn to be a function.');
    }

    const weightedBasis = [];

    for (const [response, amplitude] of qstate.basis.entries()) {
      const scoreRaw = await verificationFn(response.text, response);
      const score = QuantumLLM._clamp01(scoreRaw);
      const newMagnitude = amplitude.magnitude() * score;

      if (newMagnitude <= 1e-12) {
        continue;
      }

      weightedBasis.push({
        value: response,
        amplitude: Complex.fromPolar(newMagnitude, amplitude.phase()),
      });
    }

    if (weightedBasis.length === 0) {
      throw new Error('Verification removed all amplitudes; no valid response remains.');
    }

    const verifiedState = new QuantumState(weightedBasis);
    const measured = verifiedState.measure();
    return measured;
  }

  /**
   * Build ensemble response state from multiple quantum response states.
   *
   * - interference: amplitude-level combination
   * - classical: flatten states as independent outcomes
   *
   * @param {QuantumState[]} qstates
   * @param {'interference'|'classical'} [analysisMode='interference']
   * @returns {QuantumState}
   */
  static ensemble(qstates, analysisMode = 'interference') {
    if (!Array.isArray(qstates) || qstates.length === 0) {
      throw new RangeError('ensemble requires a non-empty array of QuantumState instances.');
    }
    for (const state of qstates) {
      if (!(state instanceof QuantumState)) {
        throw new TypeError('ensemble expects every element to be a QuantumState.');
      }
    }

    if (analysisMode === 'interference') {
      return Interference.interfere(qstates);
    }

    if (analysisMode === 'classical') {
      const basis = [];
      for (const state of qstates) {
        for (const [value, amplitude] of state.basis.entries()) {
          basis.push({ value, amplitude: amplitude.clone() });
        }
      }
      return new QuantumState(basis);
    }

    throw new RangeError(`Unsupported analysisMode: ${analysisMode}`);
  }

  async _queryModel(model, prompt, options) {
    try {
      const response = await model.apiCall(prompt, options);
      const safe = response && typeof response === 'object' ? response : {};
      return {
        text: typeof safe.text === 'string' ? safe.text : '',
        confidence: safe.confidence == null ? 0.8 : safe.confidence,
        metadata: safe.metadata && typeof safe.metadata === 'object' ? safe.metadata : {},
      };
    } catch (error) {
      return {
        text: '',
        confidence: 0,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          failedModel: model.name,
        },
      };
    }
  }

  static _clamp01(value) {
    if (!Number.isFinite(value)) {
      return 0;
    }
    if (value <= 0) {
      return 0;
    }
    if (value >= 1) {
      return 1;
    }
    return value;
  }
}

module.exports = QuantumLLM;
