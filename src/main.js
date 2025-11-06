document.addEventListener('DOMContentLoaded', () => {
    // ===== 상수 =====
    const WORD_SPAWN_INTERVAL = 1100;
    const HIT_TOL = 10;

    // ===== 상태 =====
    let gameLoopId = null;
    let wordSpawnerId = null;
    let currentQuestion = null;
    let fallingWords = [];
    let lives = 0;
    let score = 0;
    let MAX_LIVES = 3;
    let usedWords = [];

    // ===== 기본 DOM =====
    const clickSound = document.getElementById('click-sound');
    const wrongSound = document.getElementById('wrong-sound');
    const videoContainer = document.getElementById('intro-video-container');
    const introVideo = document.getElementById('intro-video');
    const goScreen = document.getElementById('go-screen');
    const goButton = document.getElementById('go-button');
    const questionImg = document.getElementById('word-illustration');

    // ===== 나중에 초기화되는 요소 =====
    let canvas, ctx, questionEl, scoreEl, livesContainer, heartIcons;
    let startScreen, gameOverScreen, startButton, finalScoreEl;
    let gamePanelContent, messageBox;

    // ===== 유틸 =====
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    function playClickSound() {
        try {
        clickSound.currentTime = 0;
        clickSound.play();
        } catch (e) {
        console.warn('click sound blocked:', e);
        }
    }

    function playWrongSound() { // ✅ 틀릴 때 사운드
        try {
        wrongSound.currentTime = 0;
        wrongSound.play();
        } catch {}
    }

    function isHit(px, py, w) {
        const left = w.x - HIT_TOL;
        const right = w.x + w.width + HIT_TOL;
        const top = w.y - w.height - HIT_TOL;
        const bottom = w.y + HIT_TOL;
        return px >= left && px <= right && py >= top && py <= bottom;
    }

  // ===== 목숨 표시 =====
    function renderLives() {
        const n = clamp(lives, 0, MAX_LIVES);
        const hearts = document.querySelectorAll('.heart-icon');
        hearts.forEach((heart, i) => {
        heart.classList.toggle('lost', i >= n);
        });
    }

  // ===== UI 업데이트 =====
    function updateUI() {
        scoreEl.textContent = String(score);
        renderLives();
        if (score >= 100) celebrate();
    }

  // ===== 폭발 =====
    function triggerExplosion(word) {
        word.exploding = true;
        word.explodeTime = performance.now();
    }

  // ===== 단어 스폰 =====
    function spawnRandomWord() {
        if (lives <= 0) return;
        const langs = ['eng', 'jpn', 'chn', 'fra', 'ita'];
        const isCorrect = Math.random() < 0.3;

        let wordText;
            if (isCorrect) {
            const correctLang = langs[Math.floor(Math.random() * langs.length)];
            wordText = currentQuestion[correctLang];
            } else {
            const rw = wordData[Math.floor(Math.random() * wordData.length)];
            const rl = langs[Math.floor(Math.random() * langs.length)];
            wordText = rw[rl];
            if (Object.values(currentQuestion).includes(wordText)) return spawnRandomWord();
            }

        const fontSize = clamp(Math.floor(canvas.width / 25), 24, 32);
        ctx.font = `700 ${fontSize}px Gaegu`;
        const wordWidth = ctx.measureText(wordText).width;

            fallingWords.push({
            text: wordText,
            isCorrect,
            x: Math.random() * Math.max(1, canvas.width - wordWidth),
            y: -fontSize,
            speed: 1,
            width: wordWidth,
            height: fontSize,
            fontSize,
            exploding: false,
            explodeTime: 0
        });
    }

  // ===== 라운드 생성 =====
    function newRound() {
        fallingWords = [];

        const availableWords = wordData.filter(w => !usedWords.includes(w.kor));
        if (availableWords.length === 0) {
        console.log('모든 단어를 다 썼음. 다시 초기화.');
        usedWords = [];
    }

        currentQuestion = { ...availableWords[Math.floor(Math.random() * availableWords.length)] };
        usedWords.push(currentQuestion.kor);

        questionImg.src = currentQuestion.img;
        questionImg.alt = currentQuestion.kor;
        questionEl.textContent = currentQuestion.kor;
    }

  // ===== 게임 루프 =====
    function gameLoop(time) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = fallingWords.length - 1; i >= 0; i--) {
        const w = fallingWords[i];

        if (w.exploding) {
            const elapsed = time - w.explodeTime;
            const duration = 400;
            const progress = elapsed / duration;

            if (progress >= 1) {
            fallingWords.splice(i, 1);
            continue;
            }

            const scale = 1 + progress * 1.5;
            const alpha = 1 - progress;
            ctx.save();
            ctx.font = `700 ${w.fontSize * scale}px Gaegu`;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = w.isCorrect ? '#43a047' : '#e53935';
            ctx.fillText(w.text, w.x, w.y);
            ctx.restore();
            continue;
        }

        w.y += w.speed;
        ctx.font = `700 ${w.fontSize}px Gaegu`;
        ctx.fillStyle = '#543e3e';
        ctx.fillText(w.text, w.x, w.y);

        if (w.y > canvas.height + w.height) fallingWords.splice(i, 1);
        }

        if (lives > 0) gameLoopId = requestAnimationFrame(gameLoop);
    }

  // ===== 클릭 처리 =====
    function handleCanvasClick(e) {
        playClickSound();
        if (lives <= 0) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (let i = fallingWords.length - 1; i >= 0; i--) {
            const w = fallingWords[i];
            if (isHit(x, y, w)) {
                if (w.isCorrect) {
                score += 10;
                fallingWords.forEach(f => triggerExplosion(f));
                newRound();
                } else {
                playWrongSound(); 
                triggerExplosion(w);
                handleMistake();
                }
                fallingWords.splice(i, 1);
                updateUI();
                return;
            }
        }
    }

    function celebrate() {
        cancelAnimationFrame(gameLoopId);
        clearInterval(wordSpawnerId);
        messageBox.classList.remove('hidden');
        messageBox.classList.add('show');
    }

  // ===== 실수 처리 =====
    function handleMistake() {
        lives = clamp(lives - 1, 0, MAX_LIVES);
        updateUI();
        const panel = document.getElementById('game-panel');
        panel.classList.add('damage-flash');
        setTimeout(() => panel.classList.remove('damage-flash'), 150);
        if (lives === 0) endGame();
    }

  // ===== 종료 =====
    function endGame() {
        cancelAnimationFrame(gameLoopId);
        clearInterval(wordSpawnerId);
        finalScoreEl.textContent = String(score);
        gameOverScreen.classList.remove('hidden');
    }

  // ===== 게임 시작 =====
    function startGame() {
        score = 0;
        lives = MAX_LIVES;
        fallingWords = [];
        usedWords = [];
        heartIcons.forEach(h => h.classList.remove('lost'));
        updateUI();

        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        newRound();

        gameLoopId = requestAnimationFrame(gameLoop);
        wordSpawnerId = setInterval(spawnRandomWord, WORD_SPAWN_INTERVAL);
    }

  // ===== 전체 리셋 (처음으로 버튼용) =====
    function resetToIntro() {
        cancelAnimationFrame(gameLoopId);
        clearInterval(wordSpawnerId);
        score = 0;
        lives = MAX_LIVES;
        fallingWords = [];
        videoContainer.classList.remove('hidden');
        goScreen.style.display = '';
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        if (messageBox) {
            messageBox.classList.add('hidden');
            messageBox.classList.remove('show');
        }
        introVideo.pause();
        introVideo.currentTime = 0;
    }

  // ===== 캔버스 리사이즈 =====
    function resizeCanvas() {
        canvas.width = gamePanelContent.clientWidth;
        canvas.height = gamePanelContent.clientHeight;
    }

  // ===== 초기화 =====
    function init() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        questionEl = document.getElementById('question-box');
        scoreEl = document.getElementById('score');
        livesContainer = document.getElementById('lives-container');
        heartIcons = livesContainer.querySelectorAll('.heart-icon');
        startScreen = document.getElementById('start-screen');
        gameOverScreen = document.getElementById('game-over-screen');
        startButton = document.getElementById('start-button');
        finalScoreEl = document.getElementById('final-score');
        gamePanelContent = document.querySelector('#game-panel .panel-content');
        messageBox = document.getElementById('celebration-message');
        MAX_LIVES = heartIcons.length || 3;

        window.addEventListener('resize', resizeCanvas);
        canvas.addEventListener('click', handleCanvasClick);
        startButton.addEventListener('click', startGame);

        // 위임형 클릭 (다시하기, 처음으로 버튼용)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            e.preventDefault();

            const action = btn.dataset.action;
            const messageBox = document.getElementById('celebration-message');
            const gameOverBox = document.getElementById('game-over-screen');

            if (action === 'retry') {
                if (messageBox) {
                    messageBox.classList.add('hidden');
                    messageBox.classList.remove('show');
                }
                startGame();
            }
            else if (action === 'home') {
                if (messageBox) messageBox.classList.add('hidden');
                if (gameOverBox) gameOverBox.classList.add('hidden');
                resetToIntro();
            }
        });
            resizeCanvas();
    }

    // ===== 인트로 버튼 =====
    goButton.addEventListener('click', async () => {
        goScreen.style.display = 'none';
        try {
        await document.documentElement.requestFullscreen();
        } catch {}
        introVideo.muted = false;
        introVideo.currentTime = 0;
        introVideo.play().catch(() => {});
        introVideo.addEventListener('ended', () => {
        videoContainer.classList.add('hidden');
        startScreen.classList.remove('hidden');
        }, { once: true });
    });

    introVideo.pause();
    init();
});
