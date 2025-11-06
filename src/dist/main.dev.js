"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

document.addEventListener('DOMContentLoaded', function () {
  // ===== 전역 상태 =====
  var gameLoopId = null;
  var wordSpawnerId = null;
  var currentQuestion = null;
  var fallingWords = [];
  var lives = 0;
  var score = 0;
  var MAX_LIVES = 3;
  var WORD_SPAWN_INTERVAL = 1100; //1.1초

  var HIT_TOL = 10;
  var clickSound = document.getElementById('click-sound');
  var canvas, ctx;
  var questionEl, scoreEl, livesContainer, heartIcons;
  var startScreen, gameOverScreen, startButton, restartButton, finalScoreEl;
  var gamePanelContent;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  } // 클릭 허용 오차 10px 확장 히트박스


  function isHit(px, py, w) {
    var left = w.x - HIT_TOL;
    var right = w.x + w.width + HIT_TOL;
    var top = w.y - w.height - HIT_TOL;
    var bottom = w.y + HIT_TOL;
    return px >= left && px <= right && py >= top && py <= bottom;
  }

  function renderLives() {
    var n = clamp(lives, 0, MAX_LIVES);
    var hearts = document.querySelectorAll('.heart-icon'); // 최신 상태 가져오기

    hearts.forEach(function (heart, i) {
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
  }

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

  function newRound() {
    fallingWords = [];
    currentQuestion = _objectSpread({}, wordData[Math.floor(Math.random() * wordData.length)]);
    questionEl.textContent = currentQuestion.kor;
  }

  function spawnRandomWord() {
    if (lives <= 0) return;
    var langs = ['eng', 'jpn', 'chn', 'fra', 'ita'];
    var isCorrect = Math.random() < 0.3;
    var wordText;

    if (isCorrect) {
      var correctLang = langs[Math.floor(Math.random() * langs.length)];
      wordText = currentQuestion[correctLang];
    } else {
      var rw = wordData[Math.floor(Math.random() * wordData.length)];
      var rl = langs[Math.floor(Math.random() * langs.length)];
      wordText = rw[rl];

      if (Object.values(currentQuestion).includes(wordText)) {
        return spawnRandomWord();
      }
    }

    var fontSize = clamp(Math.floor(canvas.width / 25), 24, 32);
    ctx.font = "700 ".concat(fontSize, "px Gaegu");
    var wordWidth = ctx.measureText(wordText).width;
    fallingWords.push({
      text: wordText,
      isCorrect: isCorrect,
      x: Math.random() * Math.max(1, canvas.width - wordWidth),
      y: -fontSize,
      speed: 0.8,
      width: wordWidth,
      height: fontSize,
      fontSize: fontSize,
      exploding: false,
      explodeTime: 0
    });
  }

  function triggerExplosion(word) {
    word.exploding = true;
    word.explodeTime = performance.now();
    console.log("\uD83D\uDCA5 explode: ".concat(word.text, " (correct=").concat(word.isCorrect, ")"));
  }

  function gameLoop(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = fallingWords.length - 1; i >= 0; i--) {
      var w = fallingWords[i];

      if (w.exploding) {
        var elapsed = time - w.explodeTime;
        var duration = 400; // 폭발 애니메이션 0.2초

        var progress = elapsed / duration;

        if (progress >= 1) {
          fallingWords.splice(i, 1);
          continue;
        }

        var scale = 1 + progress * 1.5; // 커졌다가 사라짐

        var alpha = 1 - progress; // 점점 투명해짐

        ctx.save();
        ctx.font = "700 ".concat(w.fontSize * scale, "px Gaegu");
        ctx.globalAlpha = alpha;
        ctx.fillStyle = w.isCorrect ? '#43a047' : '#e53935'; // 맞으면 초록, 틀리면 빨강

        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.fillText(w.text, w.x, w.y);
        ctx.restore();
        continue;
      }

      w.y += w.speed;
      ctx.font = "700 ".concat(w.fontSize, "px Gaegu");
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
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    for (var i = fallingWords.length - 1; i >= 0; i--) {
      var w = fallingWords[i];

      if (isHit(x, y, w)) {
        if (w.isCorrect) {
          score += 10;
          fallingWords.forEach(function (f) {
            return triggerExplosion(f);
          });
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
  } // ===== 생명/종료 =====


  function handleMistake() {
    lives = clamp(lives - 1, 0, MAX_LIVES);
    console.log('lives 감소됨:', lives);
    console.log('heartIcons:', heartIcons);
    console.log('heartIcons 길이:', heartIcons.length);
    updateUI('handleMistake');
    var panel = document.getElementById('game-panel');
    panel.classList.add('damage-flash');
    setTimeout(function () {
      return panel.classList.remove('damage-flash');
    }, 150);
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
    console.log('▶ START GAME, lives =', lives); // 지난 상태 싹 초기화

    heartIcons.forEach(function (h) {
      return h.classList.remove('lost');
    });
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
    restartButton = document.getElementById('retry-btn');
    finalScoreEl = document.getElementById('final-score');
    gamePanelContent = document.querySelector('#game-panel .panel-content');
    MAX_LIVES = heartIcons.length || 3;
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('click', handleCanvasClick);
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
  } // DOM 완성 후 시작


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
});