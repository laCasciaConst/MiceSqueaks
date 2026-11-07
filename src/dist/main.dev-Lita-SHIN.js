"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var canvas = document.getElementById('game-canvas');
var ctx = canvas.getContext('2d');
var questionEl = document.getElementById('question-box');
var scoreEl = document.getElementById('score');
var livesContainer = document.getElementById('lives-container');
var heartIcons = livesContainer.querySelectorAll('.heart-icon');
var startScreen = document.getElementById('start-screen');
var gameOverScreen = document.getElementById('game-over-screen');
var startButton = document.getElementById('start-button');
var restartButton = document.getElementById('restart-button');
var finalScoreEl = document.getElementById('final-score');
var gamePanelContent = document.querySelector('#game-panel .panel-content');
var wordData = [{
  kor: "사과",
  eng: "Apple",
  jpn: "りんご",
  chn: "苹果"
}, {
  kor: "바나나",
  eng: "Banana",
  jpn: "バナナ",
  chn: "香蕉"
}, {
  kor: "오렌지",
  eng: "Orange",
  jpn: "オレンジ",
  chn: "橙子"
}, {
  kor: "포도",
  eng: "Grape",
  jpn: "ぶどう",
  chn: "葡萄"
}, {
  kor: "딸기",
  eng: "Strawberry",
  jpn: "いちご",
  chn: "草莓"
}, {
  kor: "수박",
  eng: "Watermelon",
  jpn: "すいか",
  chn: "西瓜"
}, {
  kor: "강아지",
  eng: "Dog",
  jpn: "いぬ",
  chn: "狗"
}, {
  kor: "고양이",
  eng: "Cat",
  jpn: "ねこ",
  chn: "猫"
}, {
  kor: "책",
  eng: "Book",
  jpn: "ほん",
  chn: "书"
}, {
  kor: "연필",
  eng: "Pencil",
  jpn: "えんぴつ",
  chn: "铅笔"
}, {
  kor: "학교",
  eng: "School",
  jpn: "がっこう",
  chn: "学校"
}, {
  kor: "집",
  eng: "House",
  jpn: "いえ",
  chn: "家"
}, {
  kor: "사랑",
  eng: "Love",
  jpn: "あい",
  chn: "爱"
}, {
  kor: "친구",
  eng: "Friend",
  jpn: "ともだち",
  chn: "朋友"
}, {
  kor: "행복",
  eng: "Happiness",
  jpn: "しあわせ",
  chn: "幸福"
}, {
  kor: "컴퓨터",
  eng: "Computer",
  jpn: "コンピュータ",
  chn: "电脑"
}, {
  kor: "휴대폰",
  eng: "Phone",
  jpn: "けいたい",
  chn: "手机"
}, {
  kor: "물",
  eng: "Water",
  jpn: "みず",
  chn: "水"
}, {
  kor: "불",
  eng: "Fire",
  jpn: "ひ",
  chn: "火"
}, {
  kor: "나무",
  eng: "Tree",
  jpn: "き",
  chn: "树"
}];
var score, lives, gameLoopId, currentQuestion, wordSpawnerId;
var fallingWords = [];
var MAX_LIVES = 3;
var WORD_SPAWN_INTERVAL = 1100; // 1.1초마다 단어 생성

function resizeCanvas() {
  canvas.width = gamePanelContent.clientWidth;
  canvas.height = gamePanelContent.clientHeight;
}

var HIT_TOL = 6;

function isHit(pointX, pointY, word) {
  var left = word.x - HIT_TOL;
  var right = word.x + word.width + HIT_TOL;
  var top = word.y - word.height - HIT_TOL;
  var bottom = word.y + HIT_TOL;
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

  currentQuestion = _objectSpread({}, wordData[Math.floor(Math.random() * wordData.length)]);
  questionEl.textContent = currentQuestion.kor; // 따옴표를 제거하고 CSS로 처리합니다.
} // 단어를 하나씩 랜덤으로 생성하는 함수


function spawnRandomWord() {
  if (lives <= 0) return;
  var isCorrect = Math.random() < 0.3; // 30% 확률로 정답 단어 생성

  var wordText;
  var langs = ['eng', 'jpn', 'chn'];

  if (isCorrect) {
    var correctLang = langs[Math.floor(Math.random() * langs.length)];
    wordText = currentQuestion[correctLang];
  } else {
    var randomWord = wordData[Math.floor(Math.random() * wordData.length)];
    var randomLang = langs[Math.floor(Math.random() * langs.length)];
    wordText = randomWord[randomLang]; // 생성된 오답이 현재 문제의 정답 중 하나와 겹치는지 확인

    if (Object.values(currentQuestion).includes(wordText)) {
      // 겹치면 함수를 다시 실행해서 다른 단어를 뽑음
      spawnRandomWord();
      return;
    }
  }

  var fontSize = Math.max(24, Math.min(32, canvas.width / 25));
  ctx.font = "700 ".concat(fontSize, "px Gaegu");
  var wordWidth = ctx.measureText(wordText).width;
  fallingWords.push({
    text: wordText,
    isCorrect: isCorrect,
    x: Math.random() * (canvas.width - wordWidth),
    // x 위치 랜덤
    y: -fontSize,
    speed: 0.8,
    width: wordWidth,
    height: fontSize,
    fontSize: fontSize
  });
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (var i = fallingWords.length - 1; i >= 0; i--) {
    var word = fallingWords[i];
    word.y += word.speed;
    ctx.font = "700 ".concat(word.fontSize, "px Gaegu");
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
  var rect = canvas.getBoundingClientRect();
  var clickX = event.clientX - rect.left;
  var clickY = event.clientY - rect.top;

  for (var i = fallingWords.length - 1; i >= 0; i--) {
    var w = fallingWords[i];

    if (isHit(clickX, clickY, w)) {
      if (w.isCorrect) {
        score += 10;
        newRound();
      } else {
        handleMistake();
      }

      fallingWords.splice(i, 1);
      renderLives(); // 아래 새 함수

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

  for (var i = 0; i < MAX_LIVES; i++) {
    var span = document.createElement('span');
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