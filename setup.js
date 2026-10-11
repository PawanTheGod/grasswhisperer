/**
 * GrassWhisperer Setup Script
 * Checks if Ollama is running and pulls the required model
 */
import { execSync, exec } from 'child_process';
import https from 'https';
import http from 'http';

const MODEL = 'llama3.2:1b';
const OLLAMA_URL = 'http://localhost:11434';

async function checkOllama() {
  return new Promise((resolve) => {
    http.get(`${OLLAMA_URL}/api/tags`, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

async function pullModel() {
  return new Promise((resolve, reject) => {
    console.log(`\n📦 Pulling model: ${MODEL} (this may take a few minutes)...`);
    const child = exec(`ollama pull ${MODEL}`);
    child.stdout.on('data', (d) => process.stdout.write(d));
    child.stderr.on('data', (d) => process.stderr.write(d));
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error('Pull failed')));
  });
}

async function main() {
  console.log('🌿 GrassWhisperer Setup');
  console.log('═══════════════════════\n');

  const running = await checkOllama();

  if (!running) {
    console.log('❌ Ollama is not running.\n');
    console.log('Please install Ollama from: https://ollama.com');
    console.log('Then run: ollama serve\n');
    console.log('After that, re-run: npm run setup\n');
    process.exit(1);
  }

  console.log('✅ Ollama is running!');

  try {
    await pullModel();
    console.log(`\n✅ Model ${MODEL} is ready!`);
    console.log('\n🌿 Setup complete! Run: npm start');
    console.log('Then open: http://localhost:3333\n');
  } catch (err) {
    console.error('\n❌ Failed to pull model:', err.message);
    console.log(`Try manually: ollama pull ${MODEL}`);
    process.exit(1);
  }
}

main();
