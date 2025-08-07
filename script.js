let boardWidth, boardHeight, mineCount;
let board = [], minePositions = [];
let flagCount = 0, revealedCount = 0;
let timer = 0, timerInterval;
let timeLimit = 0, gameOver = false;

const boardElement = document.getElementById("board");
const flagsLeftElement = document.getElementById("flags-left");
const timerElement = document.getElementById("timer");
const messageElement = document.getElementById("message");
const timeLimitSelect = document.getElementById("time-limit");
const difficultySelect = document.getElementById("difficulty");
const mineCountInput = document.getElementById("mine-count");
const customSettings = document.getElementById("custom-settings");

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

difficultySelect.addEventListener("change", () => {
  customSettings.style.display = difficultySelect.value === "custom" ? "inline-block" : "none";
});

function setDifficulty() {
  const level = difficultySelect.value;
  if (level === "easy") {
    boardWidth = 9; boardHeight = 9;
  } else if (level === "medium") {
    boardWidth = 16; boardHeight = 16;
  } else if (level === "hard") {
    boardWidth = 30; boardHeight = 16;
  } else {
    boardWidth = parseInt(document.getElementById("custom-width").value);
    boardHeight = parseInt(document.getElementById("custom-height").value);
  }
  mineCount = parseInt(mineCountInput.value);
}

function startGame() {
  setDifficulty();
  boardElement.innerHTML = "";
  messageElement.textContent = "";
  board = []; minePositions = [];
  flagCount = 0; revealedCount = 0;
  timer = 0; gameOver = false;
  timeLimit = parseInt(timeLimitSelect.value);
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer++;
    timerElement.textContent = timer;
    if (timeLimit > 0 && timer >= timeLimit) loseGame("⌛ 時間切れ！");
  }, 1000);

  flagsLeftElement.textContent = mineCount;
  boardElement.style.gridTemplateColumns = `repeat(${boardWidth}, 48px)`;

  const totalCells = boardWidth * boardHeight;
  if (mineCount >= totalCells) {
    alert("爆弾の数が多すぎます！");
    return;
  }

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    boardElement.appendChild(cell);
    board.push({ mine: false, revealed: false, flagged: false, hint: 0 });

    // イベント追加（PC）
    cell.addEventListener("click", (e) => {
      if (isTouchDevice) return; // タッチ端末では無効
      revealCell(i);
    });
    cell.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      toggleFlag(i);
    });

    // タッチ対応（スマホ）
    if (isTouchDevice) {
      let pressTimer;
      let longPress = false;

      cell.addEventListener("touchstart", (e) => {
        e.preventDefault();
        longPress = false;
        pressTimer = setTimeout(() => {
          toggleFlag(i);
          longPress = true;
        }, 500);
      });

      cell.addEventListener("touchend", (e) => {
        clearTimeout(pressTimer);
        if (!longPress) {
          revealCell(i);
        }
      });
    }
  }

  while (minePositions.length < mineCount) {
    const pos = Math.floor(Math.random() * totalCells);
    if (!board[pos].mine) {
      board[pos].mine = true;
      minePositions.push(pos);
    }
  }

  board.forEach((cell, idx) => {
    if (cell.mine) return;
    let count = 0;
    neighbors(idx).forEach((n) => {
      if (board[n].mine) count++;
    });
    cell.hint = count;
  });
}

function neighbors(index) {
  const x = index % boardWidth;
  const y = Math.floor(index / boardWidth);
  const result = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < boardWidth && ny < boardHeight) {
        result.push(ny * boardWidth + nx);
      }
    }
  }
  return result;
}

function toggleFlag(index) {
  if (gameOver || board[index].revealed) return;
  const cell = board[index];
  const el = boardElement.children[index];
  cell.flagged = !cell.flagged;
  el.textContent = cell.flagged ? "🚩" : "";
  flagCount += cell.flagged ? 1 : -1;
  flagsLeftElement.textContent = mineCount - flagCount;
}

function revealCell(index) {
  if (gameOver || board[index].flagged || board[index].revealed) return;
  const cell = board[index];
  const el = boardElement.children[index];

  if (cell.mine) return loseGame("💥 地雷を踏みました！");

  cell.revealed = true;
  el.classList.add("revealed");
  if (cell.hint > 0) {
    el.textContent = cell.hint;
    el.dataset.hint = cell.hint;
  } else {
    neighbors(index).forEach(revealCell);
  }
  revealedCount++;

  if (revealedCount === board.length - mineCount) {
    winGame();
  }
}

function loseGame(msg) {
  gameOver = true;
  clearInterval(timerInterval);
  messageElement.textContent = msg;
  minePositions.forEach((i) => {
    const el = boardElement.children[i];
    el.textContent = "💣";
    el.classList.add("revealed");
  });
}

function winGame() {
  gameOver = true;
  clearInterval(timerInterval);
  messageElement.textContent = "🎉 クリア！おめでとう！";
  minePositions.forEach((i) => {
    const cell = board[i];
    const el = boardElement.children[i];
    if (!cell.flagged) {
      cell.flagged = true;
      el.textContent = "🚩";
    }
  });
  flagsLeftElement.textContent = 0;
}
