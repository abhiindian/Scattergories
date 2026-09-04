# Scattergories

> **Name, Place, Animal, Thing** — A full-stack real-time multiplayer word game built with React, .NET 10, and SignalR.

[![.NET 10](https://img.shields.io/badge/.NET-10-purple)](https://dotnet.microsoft.com/en-us/)
[![React 19](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![SignalR](https://img.shields.io/badge/SignalR-8.0-orange)](https://learn.microsoft.com/en-us/aspnet/core/signalr/)
[![SQLite](https://img.shields.io/badge/SQLite-Latest-lightgrey)](https://www.sqlite.org/)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Game Rules](#game-rules)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [SignalR Events](#signalr-events)
- [Authentication](#authentication)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)

---

## Features

- **Real-time Multiplayer** — Up to 10 players per game with live updates via SignalR
- **Google Authentication** — OAuth 2.0 Sign-In with JWT token management
- **Guest Mode** — Play without an account by entering a name
- **9 Rounds** — Random A-Z letters with no repeats within a game
- **Team Play** — Auto-generated teams (Team A, B, C, ...) with combined scoring
- **Smart Scoring** — Three-phase validation: answer validation → uniqueness check → point calculation
- **Word Filtering** — Automatic detection of plurals, proper nouns, and profanity
- **Configurable Rules** — Host can toggle plurals, proper nouns, and offensive words
- **Responsive UI** — Glassmorphism design with TailwindCSS, works on desktop and mobile
- **Auto-Reconnect** — SignalR automatic reconnection with group re-joining
- **Persistent State** — SQLite database with EF Core for game history

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| .NET 10 | 10.0 | Web API framework |
| Entity Framework Core | 10.0 | ORM / Database abstraction |
| SQLite | Latest | Embedded relational database |
| SignalR | 8.0 | Real-time bidirectional communication |
| MediatR | Latest | CQRS (Command/Query) pattern |
| FluentValidation | 11.x | Declarative input validation |
| JWT Bearer | 10.0 | Token-based authentication |
| Google.Apis.Auth | 1.76 | Google ID token verification |
| Swagger / Swashbuckle | 7.0 | API documentation |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1 | UI library |
| TypeScript | 5.8 | Type-safe JavaScript |
| Vite | 7.1 | Build tool and dev server |
| TailwindCSS | 4.1 | Utility-first CSS framework |
| Zustand | 5.0 | Lightweight state management |
| React Router | 7.6 | Client-side routing |
| @microsoft/signalr | 8.0 | SignalR JavaScript client |
| @react-oauth/google | 0.13 | Google OAuth integration |
| Sonner | 2.0 | Toast notifications |
| Lucide React | 1.40 | Icon library |
| shadcn | 4.20 | UI component primitives |

---

## Architecture

### Clean Architecture (Backend)

The backend follows **Clean Architecture** with four distinct layers:

```
Scattergories.Server/
├── API/                    # Web API layer (entry point)
│   ├── Controllers/        # REST API endpoints
│   ├── Program.cs          # DI registration, middleware pipeline
│   └── appsettings.json    # Configuration
├── Application/            # Application logic layer
│   ├── Features/           # CQRS Commands and Queries
│   │   ├── Games/
│   │   │   ├── Commands/   # CreateGame, JoinGame, StartGame, etc.
│   │   │   └── Queries/    # GetGame
│   │   └── Players/
│   ├── Common/
│   │   ├── Features/       # Shared command/query logic
│   │   └── Interfaces/     # Domain interfaces (ICurrentPlayer, etc.)
│   └── DTOs/               # Data Transfer Objects
├── Domain/                 # Domain logic layer
│   ├── Entities/           # Game, Player, Round, Answer, Team, Category
│   ├── Enums/              # GameState, RoundState, ScoringRule
│   ├── Services/           # IScoringService, ILetterService, IWordFilterService
│   ├── Exceptions/         # Custom exceptions
│   └── ValueObjects/       # Immutable value objects
└── Infrastructure/         # Infrastructure layer
    ├── Data/               # EF Core DbContext, configurations
    ├── Services/           # Service implementations
    ├── SignalR/            # GameHub (real-time communication)
    ├── Authorization/      # Current player resolution
    └── SeedData/           # Default categories, initial data
```

**Layer Dependencies:**

```
API → Application → Domain ← Infrastructure
```

- **Domain** has zero dependencies on other layers
- **Application** depends on Domain (defines interfaces)
- **Infrastructure** depends on Application and Domain (implements interfaces)
- **API** depends on all other layers (wires everything together)

### State Machine

The game follows a strict state machine for `GameState`:

```
Lobby → RoundRunning → Answering → Revealing → Finished
                ↑            │
                └────────────┘
```

Each round follows its own state machine (`RoundState`):

```
Waiting → Running → Answering → Revealed → ScoringDone
```

### Frontend Architecture

```
Scattergories.Client/
├── src/
│   ├── api/                    # API client and SignalR connection
│   │   ├── apiClient.ts        # Fetch wrapper for REST endpoints
│   │   ├── hubConnection.ts    # Typed SignalR client
│   │   ├── types.ts            # TypeScript interfaces (DTOs)
│   │   └── hooks/              # Custom React hooks
│   ├── components/             # Reusable UI components
│   │   ├── common/             # GlassButton, GlassCard, GlassInput, etc.
│   │   ├── game/               # TimerView, AnsweringView, RevealingView, etc.
│   │   ├── lobby/              # PlayerList, TeamCard, SettingsGrid, etc.
│   │   ├── ui/                 # shadcn primitives
│   │   ├── Header.tsx          # Top navigation bar
│   │   └── RequireAuth.tsx     # Route guard component
│   ├── context/                # React Context providers
│   │   └── AuthContext.tsx     # Authentication context
│   ├── pages/                  # Page components (route-level)
│   │   ├── Home.tsx            # Landing page (create/join game)
│   │   ├── Login.tsx           # Google Sign-In / Guest login
│   │   ├── Lobby.tsx           # Pre-game lobby (players, settings)
│   │   ├── GamePage.tsx        # Active game (timer → answering → revealing)
│   │   └── Scoreboard.tsx      # Final standings
│   ├── state/                  # Zustand stores
│   │   ├── gameStore.ts        # Game state (players, rounds, timer)
│   │   └── authStore.ts        # Authentication state (token, user)
│   ├── App.tsx                 # Router configuration
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── vite.config.ts              # Vite configuration (proxy setup)
└── tailwind.config.js          # TailwindCSS configuration
```

---

## Game Rules

### Setup

1. **Host creates a game** — A unique 5-character game code is generated
2. **Players join** — Using the game code (via link or manual entry)
3. **First player becomes host** — Only the host can start the game

### Gameplay

1. **9 rounds** are played, each with a random letter from A-Z (no repeats)
2. **9 default categories** are used:

   | # | Category | Example (Letter: A) |
   |---|----------|---------------------|
   | 1 | Name | Alice |
   | 2 | Place | Australia |
   | 3 | Animal | Alligator |
   | 4 | Thing | Apple |
   | 5 | Food | Apple |
   | 6 | City | Athens |
   | 7 | Color | Amber |
   | 8 | Brand | Amazon |
   | 9 | Occupation | Actor |

3. **Timer counts down** — Default 180 seconds per round (configurable)
4. **Players submit answers** — One answer per category, must start with the round letter
5. **Scoring phase** — Answers are validated and scored

### Scoring System

| Condition | Points |
|-----------|--------|
| Unique answer (no other player has it) | 10 pts |
| Duplicate answer (another player has the same) | 0 pts |
| Invalid answer (fails validation) | 0 pts |
| No answer submitted | 0 pts |

**Team scoring:** Team score is the sum of all player scores within that team.

### Answer Validation Rules

- Must start with the round letter (case-insensitive)
- Cannot be empty
- Maximum 500 characters per answer
- **Plurals** — Detectable via suffix patterns (`-s`, `-es`, `-ies`, `-ses`, `-xes`, `-ches`, `-shes`)
- **Proper nouns** — Detected by uppercase letters after the first character (e.g., "Apple" but not "apple")
- **Profanity** — Filtered against a built-in banned words list

---

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 18+](https://nodejs.org/)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Scattergories

# Install frontend dependencies
cd Scattergories.Client
npm install
cd ..

# Restore backend packages
dotnet restore Scattergories.slnx
```

### Running the Application

#### Option 1: Run Both Separately

```bash
# Terminal 1 — Start the backend API
dotnet run --project Scattergories.Server/API/

# Terminal 2 — Start the frontend dev server
cd Scattergories.Client
npm run dev
```

#### Option 2: Use VS Code Tasks

Open VS Code and run:
- `Ctrl+Shift+P` → `Tasks: Run Task` → `Start: Both`

#### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Swagger UI:** http://localhost:5000/swagger

### Database

The application uses **SQLite** by default. The database file (`scattergories.db`) is created automatically on first run and seeded with:

- 9 default categories (Name, Place, Animal, Thing, Food, City, Color, Brand, Occupation)
- Default game settings

---

## Project Structure

### Backend Key Files

| File | Purpose |
|------|---------|
| `Scattergories.Server/API/Program.cs` | DI registration, middleware pipeline, DB seeding |
| `Scattergories.Server/Infrastructure/Data/ScattergoriesDbContext.cs` | EF Core DbContext with Fluent API configurations |
| `Scattergories.Server/Infrastructure/Services/ScoringService.cs` | Three-phase scoring logic |
| `Scattergories.Server/Infrastructure/Services/LetterService.cs` | Random letter selection (no repeats) |
| `Scattergories.Server/Infrastructure/Services/WordFilterService.cs` | Answer validation (plurals, proper nouns, profanity) |
| `Scattergories.Server/Infrastructure/SignalR/GameHub.cs` | SignalR hub for real-time communication |
| `Scattergories.Server/API/Controllers/GamesController.cs` | REST endpoints for game operations |
| `Scattergories.Server/API/Controllers/AuthController.cs` | Google authentication and JWT generation |

### Frontend Key Files

| File | Purpose |
|------|---------|
| `Scattergories.Client/src/App.tsx` | React Router configuration with auth guards |
| `Scattergories.Client/src/api/hubConnection.ts` | Typed SignalR client with event handlers |
| `Scattergories.Client/src/api/apiClient.ts` | Fetch wrapper for REST API calls |
| `Scattergories.Client/src/api/types.ts` | TypeScript interfaces matching backend DTOs |
| `Scattergories.Client/src/state/gameStore.ts` | Zustand store for game state |
| `Scattergories.Client/src/state/authStore.ts` | Zustand store for authentication |
| `Scattergories.Client/src/context/AuthContext.tsx` | React Context for auth state and login methods |
| `Scattergories.Client/src/pages/GamePage.tsx` | State-driven game page (timer → answering → revealing) |
| `Scattergories.Client/vite.config.ts` | Vite config with API proxy (`/api`, `/hubs`) |

---

## API Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/google` | Authenticate with Google ID token | No |
| GET | `/api/auth/me` | Get current authenticated user | Yes (JWT) |

**Google Auth Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Google Auth Response:**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "user": {
    "id": "guid",
    "googleId": "123456789",
    "email": "player@example.com",
    "displayName": "Player Name",
    "profileImageUrl": "https://..."
  }
}
```

### Games

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/games` | Create a new game | No |
| POST | `/api/games/{code}/join` | Join an existing game | No |
| GET | `/api/games/{code}` | Get current game state | No |
| POST | `/api/games/{code}/start` | Start the game (host only) | Yes |
| POST | `/api/games/{code}/begin-round` | Begin a new round (host only) | Yes |
| POST | `/api/games/{code}/reveal-and-score` | Reveal answers and calculate scores | Yes |
| POST | `/api/games/{code}/end-game` | End the game and show final standings | Yes |

**Create Game Request:**
```json
{
  "roundCount": 9,
  "timerSeconds": 180,
  "pointsPerAnswer": 10,
  "allowPlurals": false,
  "allowProperNouns": false,
  "allowOffensiveWords": false
}
```

**Create Game Response:**
```json
{
  "code": "ABC12"
}
```

**Join Game Request:**
```json
{
  "playerName": "Alice"
}
```

**Join Game Response:**
```json
{
  "playerId": "guid"
}
```

---

## SignalR Events

### Connection

Players connect to the SignalR hub at `/hubs/game` with JWT authentication (passed via `accessTokenFactory` or query string `authToken`).

### Client → Server (Hub Methods)

| Method | Parameters | Description |
|--------|------------|-------------|
| `JoinGameRoom` | `gameCode`, `playerId` | Join the SignalR group for a specific game |
| `SubmitAnswers` | `gameCode`, `answers[]` | Submit all answers for the current round |

**Submit Answers Request:**
```json
{
  "gameCode": "ABC12",
  "answers": [
    { "categoryId": "guid", "text": "Alligator" },
    { "categoryId": "guid", "text": "Australia" }
  ]
}
```

### Server → Client (Events)

| Event | Payload | Description |
|-------|---------|-------------|
| `LobbyUpdated` | `GameState` | Game lobby state changed (player joined/left) |
| `RoundStarted` | `{ letter, timerSeconds, categories }` | New round begins with letter and categories |
| `TimerTick` | `{ remaining, total }` | Timer countdown tick |
| `TimeUp` | — | Round timer has reached zero |
| `AnswersRevealed` | `{ roundCategories, scoredAnswers }` | Answers revealed with scoring results |
| `RoundComplete` | — | Round scoring is complete |
| `GameFinished` | — | All rounds complete, final scoreboard |
| `PlayerLeft` | — | A player has left the game |
| `PlayerError` | `{ error }` | Error message for the player |

### Grouping

Each game is assigned a SignalR group using the **game code** (uppercase). All events are broadcast to the group, ensuring only players in the same game receive updates.

---

## Authentication

### Google OAuth 2.0

1. **Frontend** — User clicks "Sign in with Google" → `@react-oauth/google` initiates OAuth flow
2. **Google** — Returns an ID token after user consent
3. **Backend** — `AuthController.GoogleAuth()` verifies the token with `Google.Apis.Auth`
4. **JWT Generation** — A signed JWT is returned with user claims
5. **Subsequent Requests** — JWT is sent in the `Authorization: Bearer <token>` header
6. **SignalR** — JWT is passed via `accessTokenFactory` or query string `authToken`

### Guest Mode

Guest players skip authentication entirely. Their identity is tracked via:
- `playerId` stored in `localStorage`
- `playerName` stored in the Zustand game store
- `StubCurrentPlayer` singleton in development (resolves player from mutable static state)

### Production Authentication

In production, `ProductionCurrentPlayer` resolves player identity from the authenticated HTTP/SignalR context using JWT claims.

---

## Configuration

### Backend Configuration (`appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=scattergories.db"
  },
  "Jwt": {
    "Secret": "your-super-secret-key-min-32-chars",
    "Issuer": "Scattergories",
    "Audience": "scattergories-client"
  }
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `Jwt:Secret` | Yes | JWT signing key (min 32 characters) |
| `Jwt:Issuer` | No | JWT issuer (default: `Scattergories`) |
| `Jwt:Audience` | No | JWT audience (default: `scattergories-client`) |
| `GOOGLE_CLIENT_ID` | For Google Auth | Google OAuth client ID |

### Frontend Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | For Google Auth | Google OAuth client ID for frontend |

### Vite Proxy Configuration

The Vite dev server proxies API and SignalR requests to the backend:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
    '/hubs': {
      target: 'http://localhost:5000',
      ws: true,
      changeOrigin: true,
    }
  }
}
```

---

## Development

### Key Patterns

#### CQRS (Command/Query Separation)

Every backend action is either a **Command** (mutates state) or a **Query** (reads state):

```csharp
// Command (void return)
public record CreateGameCommand(...) : IRequest<string>;

// Query (returns data)
public record GetGameQuery(string Code) : IRequest<GetGameDto>;
```

Handlers implement `IRequest<TResponse>`:

```csharp
public class CreateGameHandler : IRequestHandler<CreateGameCommand, string>
{
    public async Task<string> Handle(CreateGameCommand request, CancellationToken ct)
    {
        // Create game, return code
    }
}
```

#### Dependency Injection

All services are registered in `Program.cs`:

```csharp
// DbContext
builder.Services.AddDbContext<ScattergoriesDbContext>(...);

// MediatR (auto-registers all handlers)
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(CreateGameCommand).Assembly));

// Domain services
builder.Services.AddScoped<IScoringService, ScoringService>();
builder.Services.AddScoped<ILetterService, LetterService>();
builder.Services.AddScoped<IWordFilterService, WordFilterService>();

// Current player (dev vs production)
if (builder.Environment.IsDevelopment())
    builder.Services.AddScoped<ICurrentPlayer, StubCurrentPlayer>();
else
    builder.Services.AddScoped<ICurrentPlayer, ProductionCurrentPlayer>();
```

#### Nullable Reference Types

All backend code has `<Nullable>enable</Nullable>`. Use `!` null-forgiveness operator sparingly and prefer nullable types (`string?`) where appropriate.

### Common Issues

| Issue | Solution |
|-------|----------|
| **Namespace resolution** | Cross-project types need full namespace (e.g., `Scattergories.Application.Features.Games...`) |
| **MediatR void commands** | Use `IRequest<Unit>` and return `Unit.Value`, not `IRequest` |
| **Nullable params from useParams()** | `useParams()` returns `string \| undefined`; use `code!` or explicit null checks |
| **Type name conflicts** | `GameState` in `types.ts` is a DTO; `GameStore` is the Zustand store — don't alias unnecessarily |
| **SignalR reconnect** | The hub automatically re-joins the game group via `onreconnected` callback |

### Building

```bash
# Build entire solution
dotnet build Scattergories.slnx

# Build frontend
cd Scattergories.Client
npm run build

# TypeScript type-check
npx tsc --noEmit
```

### Running Tests

```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test /p:CollectCoverage=true
```

---

## Deployment

### Backend (Azure App Service)

1. Publish the API project:
   ```bash
   dotnet publish Scattergories.Server/API/ -c Release -o publish
   ```

2. Deploy to Azure App Service or any hosting platform that supports .NET 10

3. Configure environment variables:
   - `Jwt:Secret` — Strong signing key
   - `GOOGLE_CLIENT_ID` — Google OAuth client ID
   - `ConnectionStrings__DefaultConnection` — Production database connection string

4. Switch to a production database (PostgreSQL, SQL Server) by changing the DbContext configuration

### Frontend (Static Hosting)

1. Build the frontend:
   ```bash
   cd Scattergories.Client
   npm run build
   ```

2. Deploy the `dist/` folder to:
   - Azure Static Web Apps
   - GitHub Pages
   - Vercel
   - Netlify
   - Any static file server

3. Update the API base URL in `apiClient.ts` for production

### Docker (Optional)

Create a multi-stage Dockerfile for the backend:

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Scattergories.slnx .
COPY Scattergories.Server/API/Scattergories.Server.csproj Scattergories.Server/API/
COPY Scattergories.Server/Application/Scattergories.Application.csproj Scattergories.Server/Application/
COPY Scattergories.Server/Domain/Scattergories.Domain.csproj Scattergories.Server/Domain/
COPY Scattergories.Server/Infrastructure/Scattergories.Infrastructure.csproj Scattergories.Server/Infrastructure/
RUN dotnet restore
COPY . .
RUN dotnet publish Scattergories.Server/API/ -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Scattergories.Server.dll"]
```

---

## Game Entities Diagram

```
┌──────────────┐
│     Game     │
│──────────────│
│ Id           │──┐
│ Code         │  │ 1
│ RoundCount   │  │
│ TimerSeconds │  │
│ GameState    │  │
└──────────────┘  │
                  │
        ┌─────────┼──────────────┐
        │         │              │
        ▼         ▼              ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  Round   │ │  Player  │ │  Team    │
│──────────│ │──────────│ │──────────│
│ Id       │ │ Id       │ │ Id       │
│ GameId   │ │ GameId   │ │ GameId   │
│ Letter   │ │ Name     │ │ Name     │
│ State    │ │ TeamId   │ │ TeamScore│
└──────────┘ └──────────┘ └──────────┘
        │             │
        │ 1           │ 1
        │             │
        │             │
        ▼             ▼
┌──────────────────────────┐
│        Answer            │
│──────────────────────────│
│ Id                       │
│ PlayerId   ──────────────┘
│ RoundId    ──────────────┘
│ CategoryId
│ Text
│ IsValid
│ IsUnique
│ Points
└──────────────────────────┘

┌──────────┐
│ Category │
│──────────│
│ Id       │
│ Name     │
│ DisplayOrder
└──────────┘
     │
     │ 1
     │
     │ many
     ▼
┌──────────────┐
│ RoundCategory│ (join table)
│──────────────│
│ RoundId      │
│ CategoryId   │
└──────────────┘
```

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Acknowledgments

- Built with [.NET 10](https://dotnet.microsoft.com/en-us/) and [React 19](https://react.dev/)
- Real-time communication powered by [SignalR](https://learn.microsoft.com/en-us/aspnet/core/signalr/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- State management with [Zustand](https://zustand-demo.pmnd.rs/)
