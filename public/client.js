// Name: Arjun Pandya, Date: 11/17/2026, Lab 4

const boardCanvas = document.getElementById("board");
const ctx = boardCanvas.getContext("2d");
const statusElement = document.getElementById("status");
const roleElement = document.getElementById("role");
const resetBtn = document.getElementById("resetBtn");
const joinBtn = document.getElementById("joinBtn");
const nameInput = document.getElementById("nameInput");
const passwordInput = document.getElementById("passwordInput");

const CELL_SIZE = 200;
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const ws = new WebSocket(`${protocol}//${window.location.host}`);

let gameState = null;
let role = "spectator";
let loggedIn = false;

// blue board and black dividing lines
function drawGrid() {
  ctx.fillStyle = "#4cc7ee";
  ctx.fillRect(0, 0, 600, 600);
  ctx.strokeStyle = "#182c3a";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(200, 0);
  ctx.lineTo(200, 600);
  ctx.moveTo(400, 0);
  ctx.lineTo(400, 600);
  ctx.moveTo(0, 200);
  ctx.lineTo(600, 200);
  ctx.moveTo(0, 400);
  ctx.lineTo(600, 400);
  ctx.stroke();
}

function drawX(x, y) {
  const padding = 38;
  ctx.strokeStyle = "#142b3d";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x + padding, y + padding);
  ctx.lineTo(x + CELL_SIZE - padding, y + CELL_SIZE - padding);
  ctx.moveTo(x + CELL_SIZE - padding, y + padding);
  ctx.lineTo(x + padding, y + CELL_SIZE - padding);
  ctx.stroke();
}

function drawO(x, y) {
  ctx.strokeStyle = "#142b3d";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 70, 0, Math.PI * 2);
  ctx.stroke();
}

// reprints when the server broadcasts an updated move.
function drawBoard() {
  drawGrid();
  if (!gameState) return;

  gameState.board.forEach((value, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;

    if (value === "X") drawX(x, y);
    if (value === "O") drawO(x, y);
  });

  if (gameState.winner === "Draw") {
    statusElement.textContent = "It's a draw!";
  } else if (gameState.winner) {
    statusElement.textContent = `Winner: ${gameState.winner}`;
  } else {
    statusElement.textContent = `Turn: ${gameState.currentPlayer}`;
  }
}

// converts a mouse click on the canvas to a specific square number.
boardCanvas.addEventListener("click", event => {
  if (!loggedIn || (role !== "X" && role !== "O")) return;
  if (!gameState || gameState.winner || gameState.currentPlayer !== role) return;
  if (ws.readyState !== WebSocket.OPEN) return;

  const rect = boardCanvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * boardCanvas.width / rect.width;
  const y = (event.clientY - rect.top) * boardCanvas.height / rect.height;
  const col = Math.floor(x / CELL_SIZE);
  const row = Math.floor(y / CELL_SIZE);
  const index = row * 3 + col;

  if (row < 0 || row > 2 || col < 0 || col > 2) return;
  if (gameState.board[index] !== "") return;

  ws.send(JSON.stringify({ type: "place", index }));
});

// receives shared game status, player assignment and also recieve an error if made.
ws.onmessage = event => {
  const data = JSON.parse(event.data);

  if (data.type === "state") {
    gameState = data.gameState;
    drawBoard();
  }

  if (data.type === "role") {
    role = data.role;
    loggedIn = true;
    roleElement.textContent = `Logged in as ${data.name} (${role})`;
    joinBtn.disabled = true;
    nameInput.disabled = true;
    passwordInput.disabled = true;
    passwordInput.value = "";
    resetBtn.disabled = role === "spectator";
  }

  if (data.type === "error") {
    alert(data.message);
  }
};

// login and receive one of the three possible roles.
joinBtn.addEventListener("click", () => {
  if (ws.readyState !== WebSocket.OPEN) {
    alert("Not connected to the server yet, please try again.");
    return;
  }
  ws.send(JSON.stringify({
    type: "login",
    name: nameInput.value.trim(),
    password: passwordInput.value
  }));
});

// either player can have the option to reset the shared game for everyone.
resetBtn.addEventListener("click", () => {
  if (ws.readyState === WebSocket.OPEN && loggedIn && role !== "spectator") {
    ws.send(JSON.stringify({ type: "reset" }));
  }
});

ws.onclose = () => {
  statusElement.textContent = "Disconnected from server, please refresh to reconnect.";
  joinBtn.disabled = true;
  resetBtn.disabled = true;
};

ws.onerror = () => {
  statusElement.textContent = "Server connection error.";
};

// displays the empty grid while the first game state is loading.
resetBtn.disabled = true;
drawGrid();
