document.addEventListener('DOMContentLoaded', () => {
    // ===== 전역 상태 =====
    let gameLoopId = null;
    let wordSpawnerId = null;
    let currentQuestion = null;
    let fallingWords = [];
    let lives = 0;
    let score = 0;
    let MAX_LIVES = 3;
    const WORD_SPAWN_INTERVAL = 1100; //1.1초
    const HIT_TOL = 10;
    const clickSound = document.getElementById('click-sound');
    const videoContainer = document.getElementById('intro-video-container');
    const introVideo = document.getElementById('intro-video');
            
    const goScreen = document.getElementById('go-screen');
    const goButton = document.getElementById('go-button');

    let canvas, ctx;
    let questionEl, scoreEl, livesContainer, heartIcons;
    let startScreen, gameOverScreen, startButton, restartButton, finalScoreEl;
    let gamePanelContent;

    function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

    // 클릭 허용 오차 10px 확장 히트박스
    function isHit(px, py, w) {
        const left   = w.x - HIT_TOL;
        const right  = w.x + w.width + HIT_TOL;
        const top    = w.y - w.height - HIT_TOL;
        const bottom = w.y + HIT_TOL;
        return px >= left && px <= right && py >= top && py <= bottom;
    }

    function renderLives() {
        const n = clamp(lives, 0, MAX_LIVES);
        const hearts = document.querySelectorAll('.heart-icon'); // 최신 상태 가져오기

        hearts.forEach((heart, i) => {
            if (i < n) {
                heart.classList.remove('lost'); // 남은 목숨
            } else {
                heart.classList.add('lost'); // 잃은 목숨
            }
            console.log(i, 'lost?', heart.classList.contains('lost'));
        });
    }

    function updateUI() {
        scoreEl.textContent = String(score);
        renderLives();

        if (score >= 100) {
            celebrate();
        }
    }

    introVideo.pause(); // 자동 재생 방지

    goButton.addEventListener('click', async () => {
        goScreen.style.display = 'none';

        try {
            await document.documentElement.requestFullscreen();
            console.log('Fullscreen mode enabled');
        } catch (err) {
            console.warn('Fullscreen request denied:', err);
        }

        introVideo.muted = false;
        introVideo.currentTime = 0;
        introVideo.play().then(() => {
            console.log('intro video started');
        }).catch((e) => console.warn('video play blocked:', e));

        introVideo.addEventListener('ended', () => {
            videoContainer.classList.add('hidden');
            startScreen.classList.remove('hidden');
        }, { once: true });
    });

    function resizeCanvas() {
        canvas.width = gamePanelContent.clientWidth;
        canvas.height = gamePanelContent.clientHeight;
    }

        function playClickSound() {
        try {
            clickSound.currentTime = 0; // 재생 위치 리셋
            clickSound.play();
        } catch (e) {
            console.warn('click sound blocked:', e);
        }
    }

    function celebrate() {
        cancelAnimationFrame(gameLoopId);
        clearInterval(wordSpawnerId);

        const panel = document.getElementById('game-panel');
        const msg = document.createElement('div');
        msg.className = 'celebration-message'; // 스타일은 CSS에서
        msg.textContent = '🎉 축하합니다! 100점 달성! 🎉';
        panel.appendChild(msg);

        setTimeout(() => {
            msg.remove();
            gameOverScreen.classList.add('hidden');
            startScreen.classList.remove('hidden');
        }, 3000);
    }

    function newRound() {
        fallingWords = [];
        currentQuestion = { ...wordData[Math.floor(Math.random() * wordData.length)] };
        questionEl.textContent = currentQuestion.kor;
    }

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
            if (Object.values(currentQuestion).includes(wordText)) {
            return spawnRandomWord();
            }
        }

        const fontSize = clamp(Math.floor(canvas.width / 25), 24, 32);
        ctx.font = `700 ${fontSize}px Gaegu`;
        const wordWidth = ctx.measureText(wordText).width;

        fallingWords.push({
            text: wordText,
            isCorrect,
            x: Math.random() * Math.max(1, (canvas.width - wordWidth)),
            y: -fontSize,
            speed: 1.3,
            width: wordWidth,
            height: fontSize,
            fontSize,
            exploding: false,
            explodeTime: 0  
        });
    }

    function triggerExplosion(word) {
        word.exploding = true;
        word.explodeTime = performance.now();
        console.log(`💥 explode: ${word.text} (correct=${word.isCorrect})`);
    }

    function gameLoop(time) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = fallingWords.length - 1; i >= 0; i--) {
            const w = fallingWords[i];

            if (w.exploding) {
                const elapsed = time - w.explodeTime;
                const duration = 400; // 폭발 애니메이션 0.2초
                const progress = elapsed / duration;

                if (progress >= 1) {
                    fallingWords.splice(i, 1);
                    continue;
                }
            const scale = 1 + progress * 1.5;    // 커졌다가 사라짐
            const alpha = 1 - progress;          // 점점 투명해짐
            ctx.save();
            ctx.font = `700 ${w.fontSize * scale}px Gaegu`;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = w.isCorrect ? '#43a047' : '#e53935'; // 맞으면 초록, 틀리면 빨강
            ctx.fillText(w.text, w.x, w.y);
            ctx.restore();
            continue;
            }

            w.y += w.speed;
            ctx.font = `700 ${w.fontSize}px Gaegu`;
            ctx.fillStyle = '#543e3e';
            ctx.fillText(w.text, w.x, w.y);

            if (w.y > canvas.height + w.height) {
            fallingWords.splice(i, 1);
            }
        }

        if (lives > 0) gameLoopId = requestAnimationFrame(gameLoop);
    }

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
                triggerExplosion(w);
                handleMistake();
            }
            fallingWords.splice(i, 1);
            updateUI();
            return;
            }
        }
    }

    // ===== 생명/종료 =====
    function handleMistake() {
        lives = clamp(lives - 1, 0, MAX_LIVES);
        console.log('lives 감소됨:', lives);
        console.log('heartIcons:', heartIcons);
        console.log('heartIcons 길이:', heartIcons.length);
        updateUI('handleMistake');

        const panel = document.getElementById('game-panel');
        panel.classList.add('damage-flash');
        setTimeout(() => panel.classList.remove('damage-flash'), 150);

        if (lives === 0) endGame();
    }


    function endGame() {
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
        if (wordSpawnerId) clearInterval(wordSpawnerId);
        wordSpawnerId = null;

        finalScoreEl.textContent = String(score);
        gameOverScreen.classList.remove('hidden');
    }

    function startGame() {
        score = 0;
        lives = MAX_LIVES;
        fallingWords = [];
        console.log('▶ START GAME, lives =', lives);

        // 지난 상태 싹 초기화
        heartIcons.forEach(h => h.classList.remove('lost'));
        updateUI();

        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');

        newRound();

        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoopId = requestAnimationFrame(gameLoop);

        if (wordSpawnerId) clearInterval(wordSpawnerId);
        wordSpawnerId = setInterval(spawnRandomWord, WORD_SPAWN_INTERVAL);
        }

    function init() {
    // DOM 의존 선택자
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');

        questionEl = document.getElementById('question-box');
        scoreEl = document.getElementById('score');
        livesContainer = document.getElementById('lives-container');
        heartIcons = livesContainer.querySelectorAll('.heart-icon');

        startScreen = document.getElementById('start-screen');
        gameOverScreen = document.getElementById('game-over-screen');
        startButton = document.getElementById('start-button');
        restartButton = document.getElementById('restart-button');
        finalScoreEl = document.getElementById('final-score');

        gamePanelContent = document.querySelector('#game-panel .panel-content');

        MAX_LIVES = heartIcons.length || 3;

        resizeCanvas();

        window.addEventListener('resize', resizeCanvas);
        canvas.addEventListener('click', handleCanvasClick);
        startButton.addEventListener('click', startGame);
        restartButton.addEventListener('click', startGame);
    }

    // DOM 완성 후 시작
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
});