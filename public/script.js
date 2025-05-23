const hintEl = document.getElementById('hint');
const wordEl = document.getElementById('word');
const livesEl = document.getElementById('lives');
const lettersEl = document.getElementById('letters');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const canvas = document.getElementById('hangman-canvas');
const ctx = canvas.getContext('2d');

const bgMusic = document.getElementById('bg-music');
const wrongSound = document.getElementById('wrong-sound');
const winSound = document.getElementById('win-sound');

let sessionId;
let wrongCount = 0;

const drawSteps = [
  () => { ctx.beginPath(); ctx.moveTo(10,240); ctx.lineTo(190,240); ctx.stroke(); },
  () => { ctx.beginPath(); ctx.moveTo(50,240); ctx.lineTo(50,20); ctx.lineTo(150,20); ctx.lineTo(150,50); ctx.stroke(); },
  () => { ctx.beginPath(); ctx.arc(150, 70, 20, 0, Math.PI * 2); ctx.stroke(); },
  () => { ctx.beginPath(); ctx.moveTo(150,90); ctx.lineTo(150,150); ctx.stroke(); },
  () => { ctx.beginPath(); ctx.moveTo(150,110); ctx.lineTo(120,130); ctx.stroke(); },
  () => { ctx.beginPath(); ctx.moveTo(150,110); ctx.lineTo(180,130); ctx.stroke(); },
  () => { ctx.beginPath(); ctx.moveTo(150,150); ctx.lineTo(120,180); ctx.stroke(); },
  () => { ctx.beginPath(); ctx.moveTo(150,150); ctx.lineTo(180,180); ctx.stroke(); },
];

function resetCanvas() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = '#333';
  wrongCount = 0;
}

window.addEventListener('load', () => {
  bgMusic.volume = 0.2;
  bgMusic.play().catch(() => {});
  newGame();
});

resetBtn.onclick = newGame;

async function newGame() {
  resetCanvas();
  const res = await fetch('/new', { method: 'POST' });
  const data = await res.json();
  sessionId = data.session;
  hintEl.textContent = `Hint: ${data.hint}`;
  updateDisplay(data.display, data.lives);
  createLetterButtons();
  statusEl.textContent = '';
}

function createLetterButtons() {
  lettersEl.innerHTML = '';
  for (let c = 65; c <= 90; c++) {
    const letter = String.fromCharCode(c);
    const btn = document.createElement('button');
    btn.textContent = letter;
    btn.onclick = () => makeGuess(letter, btn);
    lettersEl.appendChild(btn);
  }
}

async function makeGuess(letter, btn) {
  btn.disabled = true;
  const res = await fetch('/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: sessionId, letter })
  });
  const data = await res.json();

  if (!data.display.includes(letter.toLowerCase())) {
    drawSteps[wrongCount]?.();
    wrongCount++;
    wrongSound.play();
  }

  updateDisplay(data.display, data.lives);

  if (data.status !== 'ongoing') {
    if (data.status === 'win') {
      winSound.play();
      statusEl.textContent = 'You Win! 🎉';
    } else {
      while (wrongCount < drawSteps.length) drawSteps[wrongCount++]();
      statusEl.textContent = `You Lose! Word was: ${data.display}`;
    }
    lettersEl.querySelectorAll('button').forEach(b => b.disabled = true);
  }
}

function updateDisplay(display, lives) {
  wordEl.textContent = display.split('').join(' ');
  livesEl.textContent = lives;
}