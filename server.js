// Name: Arjun Pandya, Date: 11/17/2026, Lab 4

const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

// game password for players to log in
const GAME_PASSWORD = "123456789";

let gameState = {
  board: Array(9).fill(""),
  currentPlayer: "X",
  winner: null
};

// two connections can play and the rest of the connections are spectators.
const players = {
  X: null,
  O: null
};

function sendMessage(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

// updates the game state
function broadcastState() {
  wss.clients.forEach(client => {
    sendMessage(client, { type: "state", gameState });
  });
}

// check all the winning combinations to see if a player has won
function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

// checks each new connection
wss.on("connection", ws => {
  ws.playerName = "";
  ws.role = "spectator";
  ws.authenticated = false;

  // a newly opened browser immediately sees the current board
  sendMessage(ws, { type: "state", gameState });

  ws.on("message", message => {
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (error) {
      sendMessage(ws, { type: "error", message: "Invalid message format." });
      return;
    }

    // a user obtains either an X, O, or spectator role.
    if (data.type === "login") {
      if (ws.authenticated) {
        sendMessage(ws, { type: "role", role: ws.role, name: ws.playerName });
        return;
      }

      if (data.password !== GAME_PASSWORD) {
        sendMessage(ws, { type: "error", message: "Invalid password." });
        return;
      }

      const name = typeof data.name === "string" ? data.name.trim().slice(0, 30) : "";
      if (!name) {
        sendMessage(ws, { type: "error", message: "Please enter your name." });
        return;
      }

      ws.playerName = name;
      ws.authenticated = true;

      if (!players.X) {
        players.X = ws;
        ws.role = "X";
      } else if (!players.O) {
        players.O = ws;
        ws.role = "O";
      } else {
        ws.role = "spectator";
      }

      console.log(`${ws.playerName} joined as ${ws.role}`);
      sendMessage(ws, { type: "role", role: ws.role, name: ws.playerName });
      return;
    }

    // user needs to login before sending game commands.
    if (!ws.authenticated) {
      return;
    }

    // handle a click on one of the nine board squares.
    if (data.type === "place") {
      const index = data.index;

      // the server enforces all game rules
      if (ws.role !== "X" && ws.role !== "O") return;
      if (ws.role !== gameState.currentPlayer) return;
      if (gameState.winner !== null) return;
      if (!Number.isInteger(index) || index < 0 || index > 8) return;
      if (gameState.board[index] !== "") return;

      gameState.board[index] = ws.role;

      const winner = checkWinner(gameState.board);
      if (winner) {
        gameState.winner = winner;
      } else if (gameState.board.every(cell => cell !== "")) {
        gameState.winner = "Draw";
      } else {
        gameState.currentPlayer = gameState.currentPlayer === "X" ? "O" : "X";
      }

      broadcastState();
      return;
    }

    // either player can reset the game, but spectators cannot.
    if (data.type === "reset") {
      if (ws.role !== "X" && ws.role !== "O") {
        sendMessage(ws, { type: "error", message: "Only players can reset the game." });
        return;
      }

      gameState = {
        board: Array(9).fill(""),
        currentPlayer: "X",
        winner: null
      };

      broadcastState();
    }
  });

  // free an open player position when that browser disconnects.
  ws.on("close", () => {
    if (players.X === ws) players.X = null;
    if (players.O === ws) players.O = null;
    if (ws.authenticated) console.log(`${ws.playerName} disconnected`);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
