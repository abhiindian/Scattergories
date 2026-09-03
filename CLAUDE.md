# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scattergories is a full-stack real-time multiplayer game (Name, Place, Animal, Thing) built with React frontend and .NET 10 Web API backend using SignalR for real-time communication.

## Architecture

**Clean Architecture** with 4 layers in `Scattergories.Server/`:

| Layer | Path | Contents |
|-------|------|----------|
| Domain | `Scattergories.Server/Domain/` | Entities, Enums, Exceptions, ValueObjects, service interfaces |
| Application | `Scattergories.Server/Application/` | MediatR commands/queries, DTOs, interfaces, handlers |
| Infrastructure | `Scattergories.Server/Infrastructure/` | EF Core DbContext, service impls, SignalR hub, seed data |
| API | `Scattergories.Server/API/` | Web API controller, Program.cs entry point |

Frontend lives in `Scattergories.Client/` (Vite + React + TypeScript + TailwindCSS).

Solution file: `Scattergories.slnx` (.NET 10 format).

## Key Commands

```bash
# Build entire solution
dotnet build Scattergories.slnx

# Run the API server (with CORS, Swagger, hot reload)
dotnet run --project Scattergories.Server/API/

# Frontend dev server (with API proxy)
cd Scattergories.Client && npm run dev

# Frontend production build
cd Scattergories.Client && npm run build

# TypeScript type-check
cd Scattergories.Client && npx tsc --noEmit
```

## Running

1. Start backend: `dotnet run --project Scattergories.Server/API/`
2. Start frontend: `cd Scattergories.Client && npm run dev`
3. Frontend serves on `http://localhost:5173`, API on `http://localhost:5000`
4. Vite proxies `/api` and `/hubs` to the backend

Database is SQLite (`scattergories.db`), seeded with 9 default categories on startup.

## Backend Patterns

- **Command/Query (CQRS)**: Every action is a MediatR command/query. Handlers in `Application/Features/Games/Commands/` and `Queries/`. Commands use `IRequest<Unit>` for void returns.
- **Root namespace**: `Scattergories.Server` (not `Scattergories`). Other projects use explicit namespace imports, e.g., `Scattergories.Application.Features.Games.Commands.CreateGame.CreateGameCommand`.
- **DbContext**: `ScattergoriesDbContext` in Infrastructure with Fluent API configs. `IApplicationDbContext` interface in Application layer.
- **ScoringService**: Three-phase scoring — validate → determine uniqueness → calculate points. Does NOT persist (caller does SaveChangesAsync).
- **LetterService**: Picks random letter from alphabet excluding already-used round letters. Preserves history across rounds.
- **ICurrentPlayer**: Resolved per-request. In production from SignalR context; development uses `StubCurrentPlayer` (singleton with SetPlayer mutation).
- **State Machine**: `GameState` (Lobby → RoundRunning → Answering → Revealing → Finished), `RoundState` (Waiting → Running → Answering → Revealed → ScoringDone). Transitions enforced in command handlers.
- **DI registration**: All in `Program.cs` — DbContext (SQLite), MediatR (from Application assembly), IScoringService, ILetterService, IWordFilterService, ICurrentPlayer, SignalR, CORS, Swagger.

## Game Rules

1. **9 rounds** with random A-Z letters (no repeats within a game)
2. **9 default categories**: Name, Place, Animal, Thing, Food, City, Color, Brand, Occupation
3. **Answer validation**: Starts with round letter, not empty. Configurable: no plurals, no proper nouns, no profanity.
4. **Scoring**: 10 pts for unique answer (across all players), 0 for duplicates within same team. Cross-team uniqueness gives 10 pts to both teams.
5. **Teams**: Auto-generated (Team A, B, ...). Team score is sum of all player scores.
6. **Guest auth**: First player to join becomes host.

## SignalR Events

**Hub methods (server receives):** `JoinGameRoom`, `SubmitAnswers`

**Client events (server sends):** `LobbyUpdated`, `RoundStarted`, `TimerTick`, `AnswerSubmitted`, `TimeUp`, `AnswersRevealed`, `ScoringComplete`, `RoundComplete`, `GameFinished`, `PlayerLeft`, `PlayerError`

**Grouping:** Each game gets a SignalR group by game code. Connection tracking uses manual ConcurrentDictionary (not HubCallerContext.GetGroups()).

## Frontend (Scattergories.Client/)

- **Stack**: Vite + React 19 + TypeScript + TailwindCSS
- **State**: Zustand (`src/state/gameStore.ts`) — player name, game state, timer state
- **API**: `src/api/apiClient.ts` (fetch wrapper) + `src/api/hubConnection.ts` (SignalR typed client)
- **Routing**: React Router (Home → Lobby → Game → Scoreboard)
- **Pages**: `src/pages/Home.tsx` (create/join), `Lobby.tsx` (players/settings), `GamePage.tsx` (state-driven: timer → answering → revealing → scored), `Scoreboard.tsx` (final standings)
- **Types**: `src/api/types.ts` (matches backend DTOs), `src/vite-env.d.ts` (CSS module declarations)

## Important Files

- `Scattergories.Server/API/Program.cs` — DI wiring, middleware pipeline, DB seeding
- `Scattergories.Server/Infrastructure/Data/ScattergoriesDbContext.cs` — EF Core config
- `Scattergories.Server/Infrastructure/Services/ScoringService.cs` — Core scoring logic
- `Scattergories.Server/Infrastructure/Services/LetterService.cs` — Letter selection
- `Scattergories.Server/Infrastructure/SignalR/GameHub.cs` — Real-time communication (manual group tracking)
- `Scattergories.Server/API/Controllers/GamesController.cs` — REST endpoints
- `Scattergories.slnx` — Solution file (new .NET 10 format)
- `Scattergories.Client/src/api/hubConnection.ts` — SignalR client with typed event handlers
- `Scattergories.Client/src/state/gameStore.ts` — Zustand store

## Common Issues

- **Namespace resolution**: Cross-project type references need full namespace (e.g., `Scattergories.Application.Features.Games...`), no implicit usings between projects.
- **MediatR void commands**: Use `IRequest<Unit>` and return `Unit.Value`, not `IRequest`.
- **Nullable params**: `useParams()` returns `string | undefined`; use `code!` or explicit null checks.
- **Type name conflicts**: `GameState` in types.ts is a DTO; `GameStore` is the Zustand store. Don't alias unnecessarily.
