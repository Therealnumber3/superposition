module.exports = {
  core: {
    Complex: require('./core/Complex'),
    QuantumState: require('./core/QuantumState'),
    Entanglement: require('./core/Entanglement'),
  },
  operators: {
    QuantumGates: require('./operators/QuantumGates'),
    Interference: require('./operators/Interference'),
  },
  control: {
    QuantumConditionals: require('./control/QuantumConditionals'),
    QuantumLoops: require('./control/QuantumLoops'),
  },
  ai: {
    QuantumLLM: require('./ai/QuantumLLM'),
  },
  tools: {
    QuantumVisualizer: require('./tools/QuantumVisualizer'),
    QuantumDebugger: require('./tools/QuantumDebugger'),
  },

  Complex: require('./core/Complex'),
  QuantumState: require('./core/QuantumState'),
  Entanglement: require('./core/Entanglement'),
  QuantumGates: require('./operators/QuantumGates'),
  Interference: require('./operators/Interference'),
  QuantumConditionals: require('./control/QuantumConditionals'),
  QuantumLoops: require('./control/QuantumLoops'),
  QuantumLLM: require('./ai/QuantumLLM'),
  QuantumVisualizer: require('./tools/QuantumVisualizer'),
  QuantumDebugger: require('./tools/QuantumDebugger'),
};
