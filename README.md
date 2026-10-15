# SNIPER ARENA — 3D browser multiplayer prototype

Free-for-all sniper arena, real online rooms (up to 12 players), one-shot eliminations, +1 level per kill, 3-second respawn, sprint, scoped aiming, mobile touch joystick/buttons. A minimal playable prototype, not a production anti-cheat implementation.

## Run locally

Requires Node.js 20+. **No npm install required.**

```bash
node server.js
```

Visit http://localhost:3000. Open a second browser tab/device on the same network to test multiplayer. Choose CREATE ROOM, then give your friend the invitation URL or generated code. They choose JOIN ROOM and enter that code. The **Three.js client library is loaded from jsDelivr** and requires internet when loading the game.

## Publish a playable link (Render or Railway)

1. Upload this folder to a GitHub repository.
2. On Render, create a **Web Service** connected to the repository. Runtime: Node; build command: `echo ready`; start command: `node server.js`. Set one instance with persistent WebSocket support. (On Railway use the same start command.)
3. Open the HTTPS public URL. The game automatically connects to the same hostname using secure WSS.
4. Create a room, click **نسخ رابط الدعوة**, and send it to a friend.

**Important:** Render's free tier can suspend when inactive; when sleeping, reconnecting may take time and rooms are lost on a restart. Use an always-on tier for reliable matches. This single-process prototype keeps rooms in memory. Do not deploy multiple server replicas without room affinity and shared state.

## Controls

Desktop: WASD move, Shift sprint, mouse aim, click fire, right mouse button scope, Escape match menu. Mobile: left stick move, swipe right to aim, FIRE, SCOPE, and SPRINT ON/OFF toggle. The top-right menu shows the roster and allows leaving the match.

## Gameplay details

- Free for all: every other player is an opponent. CREATE ROOM always creates a new match with a random 5-character code. JOIN ROOM requires an existing friend’s code; invitation links preselect Join.
- Each kill gives +1 level and multiplies character size by 0.8 (20% smaller per kill), with a minimum of 50%. Model scale, hitbox, collision radius, and eye height agree; progression survives respawn.
- Nine selectable animated 3D operators; selections are broadcast to other players.
- Sniper bullets are instantaneous ray tests and respect block cover. One hit is an elimination. 1.25s bolt-action cooldown.
- Player returns 3 seconds after death, with a short 1.5s spawn shield.
- No account system; room exists while at least one player remains.

## Production improvements

Add server-side lag compensation, proper pitch-aware 3D raycasting, better rate limiting, match duration/score target, sound, real character models/animations, mobile performance options, username moderation, persistence, matchmaking, and stronger anti-cheat validation. Server accepts client movement vectors but clamps move speed and collision. Experimental prototype, not hardened for large public lobbies.

Fullscreen is available in the lobby and match menu on supporting browsers.
