        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');

        const questionEl = document.getElementById('question-box');
        const scoreEl = document.getElementById('score');
        const livesContainer = document.getElementById('lives-container');
        const heartIcons = livesContainer.querySelectorAll('.heart-icon');

        const startScreen = document.getElementById('start-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const startButton = document.getElementById('start-button');
        const restartButton = document.getElementById('restart-button');
        const finalScoreEl = document.getElementById('final-score');

        const gamePanelContent = document.querySelector('#game-panel .panel-content');

        const wordData = [
            { kor: "사과", eng: "Apple", jpn: "りんご", chn: "苹果" },
            { kor: "바나나", eng: "Banana", jpn: "バナナ", chn: "香蕉" },
            { kor: "오렌지", eng: "Orange", jpn: "オレンジ", chn: "橙子" },
            { kor: "포도", eng: "Grape", jpn: "ぶどう", chn: "葡萄" },
            { kor: "딸기", eng: "Strawberry", jpn: "いちご", chn: "草莓" },
            { kor: "수박", eng: "Watermelon", jpn: "すいか", chn: "西瓜" },
            { kor: "강아지", eng: "Dog", jpn: "いぬ", chn: "狗" },
            { kor: "고양이", eng: "Cat", jpn: "ねこ", chn: "猫" },
            { kor: "책", eng: "Book", jpn: "ほん", chn: "书" },
            { kor: "연필", eng: "Pencil", jpn: "えんぴつ", chn: "铅笔" },
            { kor: "학교", eng: "School", jpn: "がっこう", chn: "学校" },
            { kor: "집", eng: "House", jpn: "いえ", chn: "家" },
            { kor: "사랑", eng: "Love", jpn: "あい", chn: "爱" },
            { kor: "친구", eng: "Friend", jpn: "ともだち", chn: "朋友" },
            { kor: "행복", eng: "Happiness", jpn: "しあわせ", chn: "幸福" },
            { kor: "컴퓨터", eng: "Computer", jpn: "コンピュータ", chn: "电脑" },
            { kor: "휴대폰", eng: "Phone", jpn: "けいたい", chn: "手机" },
            { kor: "물", eng: "Water", jpn: "みず", chn: "水" },
            { kor: "불", eng: "Fire", jpn: "ひ", chn: "火" },
            { kor: "나무", eng: "Tree", jpn: "き", chn: "树" }
        ];

        let score, lives, gameLoopId, currentQuestion, wordSpawnerId;
        let fallingWords = [];
        const MAX_LIVES = 3;
        const WORD_SPAWN_INTERVAL = 1100; // 1.1초마다 단어 생성

        function resizeCanvas() {
            canvas.width = gamePanelContent.clientWidth;
            canvas.height = gamePanelContent.clientHeight;
        }

        const HIT_TOL = 6;

        function isHit(pointX, pointY, word) {
        const left   = word.x - HIT_TOL;
        const right  = word.x + word.width + HIT_TOL;
        const top    = word.y - word.height - HIT_TOL;
        const bottom = word.y + HIT_TOL;
        return pointX >= left && pointX <= right && pointY >= top && pointY <= bottom;
        }


        function init() {
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            startButton.addEventListener('click', startGame);
            restartButton.addEventListener('click', startGame);
            canvas.addEventListener('click', handleCanvasClick);
        }

        function startGame() {
            score = 0;
            lives = MAX_LIVES;
            fallingWords = [];

            updateUI();

            startScreen.classList.add('hidden');
            gameOverScreen.classList.add('hidden');

            newRound();
            if (gameLoopId) cancelAnimationFrame(gameLoopId);
            gameLoop();

            if (wordSpawnerId) clearInterval(wordSpawnerId);
            wordSpawnerId = setInterval(spawnRandomWord, WORD_SPAWN_INTERVAL);
        }

        function newRound() {
            fallingWords = []; // 다음 라운드 시작 시 화면 정리
            currentQuestion = { ...wordData[Math.floor(Math.random() * wordData.length)] };
            questionEl.textContent = currentQuestion.kor; // 따옴표를 제거하고 CSS로 처리합니다.
        }

        // 단어를 하나씩 랜덤으로 생성하는 함수
        function spawnRandomWord() {
            if (lives <= 0) return;

            const isCorrect = Math.random() < 0.3; // 30% 확률로 정답 단어 생성
            let wordText;
            const langs = ['eng', 'jpn', 'chn'];

            if (isCorrect) {
                const correctLang = langs[Math.floor(Math.random() * langs.length)];
                wordText = currentQuestion[correctLang];
            } else {
                const randomWord = wordData[Math.floor(Math.random() * wordData.length)];
                const randomLang = langs[Math.floor(Math.random() * langs.length)];
                wordText = randomWord[randomLang];

                // 생성된 오답이 현재 문제의 정답 중 하나와 겹치는지 확인
                if (Object.values(currentQuestion).includes(wordText)) {
                    // 겹치면 함수를 다시 실행해서 다른 단어를 뽑음
                    spawnRandomWord();
                    return;
                }
            }

            const fontSize = Math.max(24, Math.min(32, canvas.width / 25));
            ctx.font = `700 ${fontSize}px Gaegu`;
            const wordWidth = ctx.measureText(wordText).width;

            fallingWords.push({
                text: wordText,
                isCorrect: isCorrect,
                x: Math.random() * (canvas.width - wordWidth), // x 위치 랜덤
                y: -fontSize,
                speed: 0.8,
                width: wordWidth,
                height: fontSize,
                fontSize: fontSize
            });
        }

        function gameLoop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = fallingWords.length - 1; i >= 0; i--) {
                const word = fallingWords[i];
                word.y += word.speed;

                ctx.font = `700 ${word.fontSize}px Gaegu`;
                ctx.fillStyle = '#543e3e';
                ctx.fillText(word.text, word.x, word.y);

                if (word.y > canvas.height + word.height) {
                    fallingWords.splice(i, 1);
                }
            }

            if (lives > 0) {
                gameLoopId = requestAnimationFrame(gameLoop);
            }
        }

    function handleCanvasClick(event) {
    if (lives <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

        for (let i = fallingWords.length - 1; i >= 0; i--) {
            const w = fallingWords[i];
            if (isHit(clickX, clickY, w)) {
            if (w.isCorrect) {
                score += 10;
                newRound();
            } else {
                handleMistake();
            }
            fallingWords.splice(i, 1);
            renderLives();     // 아래 새 함수
            scoreEl.textContent = score;
            return;
            }
        }
    }

        function handleMistake() {
            lives = Math.max(0, lives - 1);
            updateUI();
            if (lives === 0) endGame();
        }

function updateUI() {
    scoreEl.textContent = score;
    renderLives();
}

function renderLives() {
    // lives 기준으로 하트 DOM을 다시 그림
    livesContainer.innerHTML = '';
    for (let i = 0; i < MAX_LIVES; i++) {
        const span = document.createElement('span');
        span.className = 'heart-icon' + (i < lives ? '' : ' lost');
        livesContainer.appendChild(span);
    }
}
        function endGame() {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
            clearInterval(wordSpawnerId);
            wordSpawnerId = null;

            finalScoreEl.textContent = score;
            gameOverScreen.classList.remove('hidden');
        }

        init();