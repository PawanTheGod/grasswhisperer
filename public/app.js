/* ═══════════════════════════════════════════════════════════════
   GrassWhisperer — Frontend Logic
   Talks to local Express server → Ollama → llama3.2:1b
   Zero cloud. Zero tracking. All yours.
═══════════════════════════════════════════════════════════════ */

'use strict';

// ── Tab navigation ─────────────────────────────────────────────
function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name)?.classList.add('active');
  window.scrollTo({ top: document.querySelector('.hero').offsetHeight + 60, behavior: 'smooth' });
}

// ── Status polling ─────────────────────────────────────────────
async function checkStatus() {
  const dot  = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  try {
    const res  = await fetch('/api/status');
    const data = await res.json();
    if (data.running && data.hasModel) {
      dot.className  = 'status-dot online';
      text.textContent = `Ollama running · ${data.model} loaded · Ready`;
    } else if (data.running) {
      dot.className  = 'status-dot warn';
      text.innerHTML = `Ollama running but model not found. Run: <code>ollama pull ${data.model || 'llama3.2:1b'}</code>`;
    } else {
      dot.className  = 'status-dot offline';
      text.innerHTML = 'Ollama not detected. <a href="https://ollama.com" target="_blank">Install Ollama</a> then run: <code>ollama serve</code>';
    }
  } catch (e) {
    dot.className  = 'status-dot offline';
    text.textContent = 'Server not reachable — is npm start running?';
  }
}

checkStatus();
setInterval(checkStatus, 10_000);

// ── Helpers ────────────────────────────────────────────────────
function setLoading(btnId, resultId, loading, spinnerMsg = 'Thinking…') {
  const btn = document.getElementById(btnId);
  const res = document.getElementById(resultId);
  if (loading) {
    btn.disabled = true;
    btn.classList.add('loading');
    btn.dataset.origText = btn.innerHTML;
    btn.innerHTML = `<div class="spinner" style="width:20px;height:20px;border-width:2px"></div> ${spinnerMsg}`;
    res.className = 'result-card';
    res.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div><p>${spinnerMsg}</p></div>`;
  } else {
    btn.disabled = false;
    btn.classList.remove('loading');
    if (btn.dataset.origText) btn.innerHTML = btn.dataset.origText;
  }
}

function errorCard(msg) {
  return `<div class="error-box">⚠️ <span>${msg}<br><small>Make sure Ollama is running: <code>ollama serve</code> and model is pulled: <code>ollama pull llama3.2:1b</code></small></span></div>`;
}

async function post(endpoint, body) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

// ── Bird identification ────────────────────────────────────────
function fillBirdExample(text) {
  document.getElementById('birdDesc').value = text;
  document.getElementById('birdDesc').focus();
}

async function identifyBird() {
  const desc     = document.getElementById('birdDesc').value.trim();
  const location = document.getElementById('birdLocation').value.trim();
  const season   = document.getElementById('birdSeason').value;
  if (!desc) { alert('Please describe the bird first!'); return; }

  setLoading('birdBtn', 'birdResult', true, '🔍 Analyzing your sighting…');
  try {
    const data = await post('/api/bird', { description: desc, location, season });
    const res  = document.getElementById('birdResult');

    if (data.error) { res.innerHTML = errorCard(data.error); return; }

    const b = data.bird;
    if (!b) {
      res.innerHTML = `<p style="color:var(--c-text2);margin-bottom:12px">Model returned a free-form response:</p><div class="raw-answer">${escHtml(data.raw)}</div>`;
      return;
    }

    const confLevel = b.confidence?.toLowerCase() || 'medium';
    res.innerHTML = `
      <div class="bird-name">🐦 ${escHtml(b.name || 'Unknown Bird')}</div>
      <div class="bird-scientific">${escHtml(b.scientific || '')}</div>
      <div class="confidence-badge ${confLevel}">
        ${{ high: '✅', medium: '🟡', low: '❓' }[confLevel] || '🟡'} ${confLevel} confidence
      </div>
      <p style="font-size:0.95rem;color:var(--c-text2);line-height:1.6">${escHtml(b.description || '')}</p>
      <div class="bird-grid">
        ${birdFact('📢 Call / Song', b.calls)}
        ${birdFact('🌲 Habitat', b.habitat)}
        ${birdFact('⭐ Fun Fact', b.funFact)}
        ${birdFact('🔍 ID Tips for the Field', b.look_for, true)}
      </div>
    `;
  } catch (err) {
    document.getElementById('birdResult').innerHTML = errorCard(err.message);
  } finally {
    setLoading('birdBtn', 'birdResult', false);
  }
}

function birdFact(label, val, full = false) {
  if (!val) return '';
  return `<div class="bird-fact${full ? ' bird-full' : ''}">
    <div class="bird-fact-label">${label}</div>
    <div class="bird-fact-val">${escHtml(val)}</div>
  </div>`;
}

// ── Garden planner ─────────────────────────────────────────────
function fillGardenExample(location, zone) {
  document.getElementById('gardenLocation').value = location;
  document.getElementById('gardenZone').value = zone;
}

async function planGarden() {
  const location = document.getElementById('gardenLocation').value.trim();
  const zone     = document.getElementById('gardenZone').value.trim();
  if (!location && !zone) { alert('Please enter your location or USDA zone!'); return; }

  setLoading('gardenBtn', 'gardenResult', true, '🌱 Growing your plan…');
  try {
    const data = await post('/api/garden', { location, zone });
    const res  = document.getElementById('gardenResult');

    if (data.error) { res.innerHTML = errorCard(data.error); return; }
    const g = data.garden;
    if (!g) { res.innerHTML = `<div class="raw-answer">${escHtml(data.raw || 'No response')}</div>`; return; }

    const thisWeekItems = (g.thisWeek || []).map(t =>
      `<div class="task-item"><span class="task-bullet">→</span><span>${escHtml(t)}</span></div>`
    ).join('');

    const plantCards = (g.plantNow || []).map(p => `
      <div class="plant-card">
        <div class="plant-name">🌿 ${escHtml(p.plant || '')}</div>
        <div class="plant-why">${escHtml(p.why || '')}</div>
        <div class="plant-tip">💡 ${escHtml(p.tip || '')}</div>
      </div>
    `).join('');

    const waitItems = (g.waitUntil || []).map(w =>
      `<div class="task-item"><span class="task-bullet" style="color:var(--c-amber)">⏳</span><span>${escHtml(w)}</span></div>`
    ).join('');

    res.innerHTML = `
      <div class="frost-info">❄️ <strong>Frost Dates:</strong>&nbsp;${escHtml(g.frostInfo || 'See local almanac')}</div>

      <div class="section-title">This Week's Tasks</div>
      <div class="task-list">${thisWeekItems}</div>

      ${plantCards ? `<div class="section-title">Plant Now 🌱</div><div class="plant-grid">${plantCards}</div>` : ''}
      ${waitItems  ? `<div class="section-title">Wait Until Later ⏳</div><div class="task-list">${waitItems}</div>` : ''}

      ${g.soilTask ? `<div class="section-title">Soil Task 🪱</div>
        <div class="task-item"><span class="task-bullet">→</span><span>${escHtml(g.soilTask)}</span></div>` : ''}

      ${g.outdoorTip ? `<div class="lnt-box">🌞 <strong>Today's Tip:</strong> ${escHtml(g.outdoorTip)}</div>` : ''}
    `;
  } catch (err) {
    document.getElementById('gardenResult').innerHTML = errorCard(err.message);
  } finally {
    setLoading('gardenBtn', 'gardenResult', false);
  }
}

// ── Trail finder ───────────────────────────────────────────────
async function findTrails() {
  const location   = document.getElementById('trailLocation').value.trim();
  const difficulty = document.getElementById('trailDifficulty').value;
  const duration   = document.getElementById('trailDuration').value;
  const interest   = document.getElementById('trailInterest').value.trim();
  if (!location) { alert('Please enter your location!'); return; }

  setLoading('trailBtn', 'trailResult', true, '🗺️ Scouting trails…');
  try {
    const data = await post('/api/trail', { location, difficulty, duration, interest });
    const res  = document.getElementById('trailResult');

    if (data.error) { res.innerHTML = errorCard(data.error); return; }
    const t = data.trail;
    if (!t) { res.innerHTML = `<div class="raw-answer">${escHtml(data.raw || 'No response')}</div>`; return; }

    const trailCards = (t.trails || []).map(tr => {
      const diff = tr.difficulty?.toLowerCase() || 'moderate';
      return `<div class="trail-card">
        <div class="trail-top">
          <div class="trail-name">🥾 ${escHtml(tr.name || '')}</div>
          <div class="trail-meta">
            <span class="trail-tag ${diff}">${diff}</span>
            <span class="trail-tag info">${escHtml(tr.distance || '')}</span>
            <span class="trail-tag info">${escHtml(tr.type || '')}</span>
          </div>
        </div>
        <div class="trail-highlight">✨ ${escHtml(tr.highlight || '')}</div>
        ${tr.tip ? `<div class="trail-tip">💡 ${escHtml(tr.tip)}</div>` : ''}
      </div>`;
    }).join('');

    const gearChips = (t.gear || []).map(g =>
      `<span class="gear-chip">🎒 ${escHtml(g)}</span>`
    ).join('');

    res.innerHTML = `
      <div class="trail-headline">${escHtml(t.headline || 'Your Trail Adventure')}</div>
      ${t.season_note ? `<div class="season-note">🍂 ${escHtml(t.season_note)}</div>` : ''}
      ${trailCards}
      ${gearChips ? `<div class="section-title">Pack This</div><div class="gear-list">${gearChips}</div>` : ''}
      ${t.leaveNoTrace ? `<div class="lnt-box"><strong>🌿 Leave No Trace:</strong> ${escHtml(t.leaveNoTrace)}</div>` : ''}
      ${t.bonus ? `<div class="section-title">Trail Challenge 🎯</div>
        <div class="task-item"><span class="task-bullet">→</span><span>${escHtml(t.bonus)}</span></div>` : ''}
    `;
  } catch (err) {
    document.getElementById('trailResult').innerHTML = errorCard(err.message);
  } finally {
    setLoading('trailBtn', 'trailResult', false);
  }
}

// ── Ask Nature ─────────────────────────────────────────────────
function fillAskExample(q) {
  document.getElementById('askQuestion').value = q;
  document.getElementById('askQuestion').focus();
}

async function askNature() {
  const question = document.getElementById('askQuestion').value.trim();
  if (!question) { alert('What would you like to ask?'); return; }

  const btn = document.getElementById('askBtn');
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Asking the forest…`;

  try {
    const data = await post('/api/ask', { question });
    const history = document.getElementById('askHistory');
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    if (data.error) {
      bubble.innerHTML = errorCard(data.error);
    } else {
      bubble.innerHTML = `
        <div class="chat-q">You asked</div>
        <div class="chat-question">${escHtml(question)}</div>
        <div class="chat-answer">${escHtml(data.answer || 'No response')}</div>
      `;
    }
    history.prepend(bubble);
    document.getElementById('askQuestion').value = '';
  } catch (err) {
    const history = document.getElementById('askHistory');
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = errorCard(err.message);
    history.prepend(bubble);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span class="btn-icon">💬</span> Ask GrassWhisperer`;
  }
}

// Allow Enter+Shift to submit in the ask textarea
document.getElementById('askQuestion')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askNature(); }
});

// ── Security: escape HTML ──────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
