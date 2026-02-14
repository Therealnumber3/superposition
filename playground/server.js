const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const runtime = require('../src');

const publicDir = path.join(__dirname, 'public');
const port = Number(process.env.PORT || 4173);

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 404, { error: 'File not found' });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
    }[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

function summarizeResult(result) {
  if (result && typeof result === 'object' && result.constructor && result.constructor.name === 'QuantumState') {
    const probabilities = [];
    for (const [value, probability] of result.getProbabilities().entries()) {
      probabilities.push({ value: String(value), probability });
    }

    return {
      type: 'QuantumState',
      stateString: result.toString(),
      probabilities,
      coherence: result.getCoherenceMetrics(),
    };
  }

  return {
    type: typeof result,
    value: result,
  };
}

function executeCode(code) {
  const logs = [];
  const sandbox = {
    runtime,
    console: {
      log: (...args) => logs.push(args.map((a) => String(a)).join(' ')),
      error: (...args) => logs.push(`ERROR: ${args.map((a) => String(a)).join(' ')}`),
    },
    result: undefined,
  };

  vm.createContext(sandbox);

  const wrapped = `'use strict';\n${code}`;
  const script = new vm.Script(wrapped, { filename: 'playground-user-code.js' });
  script.runInContext(sandbox, { timeout: 1000 });

  return {
    logs,
    result: summarizeResult(sandbox.result),
  };
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/run') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const code = parsed.code;

        if (typeof code !== 'string' || code.trim().length === 0) {
          sendJson(res, 400, { error: 'code must be a non-empty string' });
          return;
        }

        const execution = executeCode(code);
        sendJson(res, 200, execution);
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    return;
  }

  if (req.method === 'GET') {
    const requested = req.url === '/' ? '/index.html' : req.url;
    const safePath = path.normalize(requested).replace(/^([.][.][/\\])+/, '');
    const filePath = path.join(publicDir, safePath);

    if (!filePath.startsWith(publicDir)) {
      sendJson(res, 403, { error: 'Forbidden' });
      return;
    }

    sendFile(res, filePath);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
});

server.listen(port, () => {
  console.log(`SUPERPOSITION playground running on http://localhost:${port}`);
  console.log('Local use only. The code runner executes untrusted code in-process.');
});
