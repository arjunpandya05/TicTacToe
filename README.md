# Lab 4 — Two Player Tic Tac Toe

## Live game URL

**ADD YOUR RENDER URL HERE AFTER DEPLOYMENT** (for example, `https://your-service-name.onrender.com`).

## Project description

This two-player Tic-Tac-Toe game uses Node.js, Express, HTML, CSS, JavaScript, and WebSockets. Two players can join a shared game, and additional visitors can spectate.

## Lab 4 changes

- Updated `server.js` to accept Render's environment port and listen on `0.0.0.0` while retaining port 3000 for local development.
- Confirmed `public/client.js` already selects `ws:` for HTTP and `wss:` for HTTPS, so no further client change was needed.

## Run locally

1. Run `npm install` in this directory.
2. Run `npm start`.
3. Open `http://localhost:3000`.

## Deploy on Render

Create a Node web service connected to this repository, with build command `npm install` and start command `node server.js`.

## Demo

Open the live URL in two browser windows. Enter a name and the classroom demo password to join as players. A third browser window can spectate.
