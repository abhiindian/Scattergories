# Google Authentication & Enhanced UI — Implementation Plan

## Overview

Adds optional Google Sign-In to the Scattergories game. Players can play as guests (current flow) or sign in with Google. JWT tokens secure both REST API and SignalR connections. The clean architecture boundary is preserved — the Domain layer gains zero framework dependencies.

---

## Architecture Decisions

### Token Strategy
- **Google ID Token** (OIDC) → validated by backend → **our JWT** issued in response
- Our JWT: `System.IdentityModel.Tokens.Jwt` with `HmacSha256` signing, HMAC key from env var `JwtSettings__Secret`
- JWT expires 24 hours, contains claims: `PlayerId`, `PlayerName`, `Email`, `GoogleId`, `GameId`
- SignalR uses `accessTokenFactory` to pass the JWT as a query parameter (`?access_token=...`)

### Architecture
```
Frontend:  @react-oauth/google → Google ID token → POST /api/auth/google → our JWT → localStorage
Backend:   Google OIDC validate → find/create Player → issue JWT
SignalR:   accessTokenFactory → ?access_token=JWT → QueryStringAuth middleware → ICurrentPlayer
```

### ICurrentPlayer Evolution
- **Old**: Interface resolved from `StubCurrentPlayer` (singleton) or SignalR context
- **New**: Interface stays the same (four properties). Resolution moves from DI singleton to **HTTP-context derivation** via middleware. StubCurrentPlayer stays as dev override.

---

## Phase 1: Backend — Authentication Core

### Step 1.1 — NuGet Packages

**API project only** (`Scattergories.Server/API/Scattergories.Server.csproj`):

```xml
<ItemGroup>
  <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.6.1" />
  <PackageReference Include="Google.Apis.Auth" Version="1.69.0" />
</ItemGroup>
```

No new packages needed in Domain, Application, or Infrastructure. Google validation stays in the API layer (a "conductor" project, appropriate for infrastructure-adjacent concerns).

---

### Step 1.2 — Domain Entity Update

**File**: `Scattergories.Server/Domain/Entities/Player.cs`

Add two nullable properties at the end of the class (before the navigation properties):

```csharp
public class Player
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GameId { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? TeamId { get; set; }
    public bool IsHost { get; set; }
    public int TotalScore { get; set; }

    // --- NEW ---
    public string? GoogleId { get; set; }
    public string? Email { get; set; }

    // Navigation
    public Game Game { get; set; } = null!;
    public Team? Team { get; set; }
    public ICollection<Answer> Answers { get; set; } = new List<Answer>();

    // ... constructors unchanged ...
}
```

**EF Core configuration** — Add in `ScattergoriesDbContext.OnModelCreating()`:

```csharp
modelBuilder.Entity<Player>()
    .HasIndex(p => new { p.GameId, p.GoogleId })
    .IsUnique()
    .HasFilter("GoogleId IS NOT NULL");
```

### Step 1.3 — ICurrentPlayer Interface

**File**: `Scattergories.Server/Application/Common/Interfaces/ICurrentPlayer.cs`

```csharp
namespace Scattergories.Application.Common.Interfaces;

/// <summary>
/// Provides information about the currently authenticated/acting player.
/// In production, resolved from JWT claims via HttpContext.
/// In development, resolved from the StubCurrentPlayer singleton.
/// </summary>
public interface ICurrentPlayer
{
    Guid? PlayerId { get; }
    string? PlayerName { get; }
    Guid? GameId { get; }
    Guid? TeamId { get; }
    string? Email { get; }
    string? GoogleId { get; }
}
```

### Step 1.4 — Configuration Classes

**File**: `Scattergories.Server/API/Auth/JwtSettings.cs`

```csharp
namespace Scattergories.Server.API.Auth;

public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "Scattergories";
    public string Audience { get; set; } = "ScattergoriesClient";
    public int ExpiryMinutes { get; set; } = 1440; // 24 hours
}
```

**File**: `Scattergories.Server/API/Auth/GoogleSettings.cs`

```csharp
namespace Scattergories.Server.API.Auth;

public class GoogleSettings
{
    public const string SectionName = "GoogleSettings";

    /// <summary>
    /// Google OAuth 2.0 Client ID (configured in Google Cloud Console).
    /// If empty, Google auth is disabled — guest-only mode.
    /// </summary>
    public string ClientId { get; set; } = string.Empty;
}
```

### Step 1.5 — Google Authentication Service

**File**: `Scattergories.Server/API/Auth/GoogleAuthenticationService.cs`

```csharp
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Infrastructure.Data;

namespace Scattergories.Server.API.Auth;

/// <summary>
/// Validates Google OIDC ID tokens and issues our own JWT.
/// </summary>
public class GoogleAuthenticationService
{
    private readonly GoogleJsonWebChartSettings _googleSettings;
    private readonly JwtSettings _jwtSettings;
    private readonly ScattergoriesDbContext _context;
    private readonly ILogger<GoogleAuthenticationService> _logger;

    public GoogleAuthenticationService(
        IOptions<GoogleSettings> googleSettings,
        IOptions<JwtSettings> jwtSettings,
        ScattergoriesDbContext context,
        ILogger<GoogleAuthenticationService> logger)
    {
        _googleSettings = googleSettings.Value;
        _jwtSettings = jwtSettings.Value;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Validates a Google ID token and returns our JWT string.
    /// If the player doesn't exist in the system, returns null (must join via guest flow first).
    /// </summary>
    public async Task<string?> AuthenticateWithGoogleAsync(string googleIdToken)
    {
        if (string.IsNullOrEmpty(_googleSettings.ClientId))
            throw new InvalidOperationException("Google authentication is not configured.");

        var payload = await ValidateGoogleTokenAsync(googleIdToken);
        var email = payload.Email;
        var googleId = payload.Subject; // Google sub is the stable identifier
        var playerName = payload.Name ?? payload.Email?.Split('@').FirstOrDefault() ?? "Player";

        // Find existing player with this Google ID (any game)
        var existingPlayer = await _context.Players
            .FirstOrDefaultAsync(p => p.GoogleId == googleId);

        if (existingPlayer != null)
        {
            // Update name/email in case Google profile changed
            existingPlayer.Name = playerName;
            existingPlayer.Email = email;
            existingPlayer.GoogleId = googleId;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Returning player authenticated: {PlayerId} ({Email})",
                existingPlayer.Id, email);

            return GenerateJwt(existingPlayer, email, googleId);
        }

        _logger.LogInformation("New Google user: {Email} ({GoogleId})", email, googleId);
        return null; // Not yet in the system — must join as guest first, or create a new player profile
    }

    /// <summary>
    /// Links a Google account to an existing player (called after guest-then-auth flow).
    /// </summary>
    public async Task<LinkGoogleResult> LinkGoogleAsync(Guid playerId, string googleIdToken)
    {
        if (string.IsNullOrEmpty(_googleSettings.ClientId))
            throw new InvalidOperationException("Google authentication is not configured.");

        var payload = await ValidateGoogleTokenAsync(googleIdToken);
        var player = await _context.Players.FindAsync(playerId);
        if (player == null)
            throw new InvalidOperationException("Player not found.");

        if (player.GoogleId != null)
            throw new InvalidOperationException("Player already has a Google account linked.");

        // Check if Google ID is already linked to another player
        var conflictingPlayer = await _context.Players
            .FirstOrDefaultAsync(p => p.GoogleId == payload.Subject);
        if (conflictingPlayer != null)
            throw new InvalidOperationException("This Google account is already linked to another player.");

        player.GoogleId = payload.Subject;
        player.Email = payload.Email;
        player.Name = payload.Name ?? player.Name;
        await _context.SaveChangesAsync();

        var jwt = GenerateJwt(player, payload.Email!, payload.Subject);

        return new LinkGoogleResult(jwt, player.GoogleId, payload.Email);
    }

    private async Task<GoogleJsonWebToken.Payload> ValidateGoogleTokenAsync(string token)
    {
        var settings = new GoogleJsonWebChart.ValidationSettings
        {
            Audience = new[] { _googleSettings.ClientId }
        };

        return await GoogleJsonWebChart.ValidateTokenAsync(token, settings);
    }

    private string GenerateJwt(Domain.Entities.Player player, string email, string googleId)
    {
        var key = Encoding.ASCII.GetBytes(_jwtSettings.Secret);
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(key),
            SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, player.Id.ToString()),
            new("PlayerName", player.Name),
            new("Email", email),
            new("GoogleId", googleId),
            new(ClaimTypes.Role, "Player")
        };

        if (player.GameId != Guid.Empty)
            claims.Add(new("GameId", player.GameId.Value.ToString()));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes),
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = credentials
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);
        return handler.WriteToken(token);
    }
}

public record LinkGoogleResult(string Jwt, string? GoogleId, string Email);
```

### Step 1.6 — JWT Helper Service

**File**: `Scattergories.Server/API/Auth/JwtService.cs`

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Scattergories.Server.API.Auth;

/// <summary>
/// Issues JWT tokens for authenticated players.
/// Used by AuthenticationController after Google auth.
/// </summary>
public class JwtService
{
    private readonly JwtSettings _settings;
    private readonly ILogger<JwtService> _logger;

    public JwtService(IOptions<JwtSettings> settings, ILogger<JwtService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public string GenerateToken(Domain.Entities.Player player, string email, string? googleId = null)
    {
        var key = Encoding.ASCII.GetBytes(_settings.Secret);
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(key),
            SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, player.Id.ToString()),
            new("PlayerName", player.Name),
            new("Email", email),
            new(ClaimTypes.Role, "Player")
        };

        if (!string.IsNullOrEmpty(googleId))
            claims.Add(new("GoogleId", googleId));

        if (player.GameId != Guid.Empty)
            claims.Add(new("GameId", player.GameId.Value.ToString()));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_settings.ExpiryMinutes),
            Issuer = _settings.Issuer,
            Audience = _settings.Audience,
            SigningCredentials = credentials
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);

        _logger.LogDebug("JWT issued for player {PlayerId} ({Email})", player.Id, email);
        return handler.WriteToken(token);
    }

    public bool TryValidateToken(string token, out ClaimsPrincipal? principal)
    {
        var key = Encoding.ASCII.GetBytes(_settings.Secret);
        var validator = new JwtSecurityTokenHandler();

        try
        {
            principal = validator.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _settings.Issuer,
                ValidateAudience = true,
                ValidAudience = _settings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            return true;
        }
        catch
        {
            principal = null;
            return false;
        }
    }
}
```

### Step 1.7 — HTTP Context Player (Middleware)

**File**: `Scattergories.Server/API/Auth/PlayerContextMiddleware.cs`

```csharp
using System.Security.Claims;
using Scattergories.Application.Common.Interfaces;

namespace Scattergories.Server.API.Auth;

/// <summary>
/// Reads JWT claims from the authenticated HttpContext and populates
/// HttpContext.Items["CurrentPlayer"] as a CurrentPlayer instance.
/// This allows GameHub and controllers to resolve ICurrentPlayer from context
/// rather than from DI (which would use the StubCurrentPlayer singleton).
/// </summary>
public class PlayerContextMiddleware
{
    private readonly RequestDelegate _next;

    public PlayerContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var claims = context.User.Identity.Claims;

            var playerId = Guid.TryParse(claims.GetFirstValue(ClaimTypes.NameIdentifier), out var pid)
                ? pid : null;

            context.Items["CurrentPlayer"] = new CurrentPlayer(
                playerId,
                claims.GetFirstValue("PlayerName"),
                Guid.TryParse(claims.GetFirstValue("GameId"), out var gid) ? gid : null,
                null, // TeamId not in JWT — resolved separately by GameHub
                claims.GetFirstValue("Email"),
                claims.GetFirstValue("GoogleId")
            );
        }

        await _next(context);
    }

    private static string? GetFirstValue(IEnumerable<Claim> claims, string type)
    {
        return claims.FirstOrDefault(c => c.Type == type)?.Value;
    }

    // Minimal data class — no interface needed since we get it from HttpContext
    internal record CurrentPlayer(
        Guid? PlayerId,
        string? PlayerName,
        Guid? GameId,
        Guid? TeamId,
        string? Email,
        string? GoogleId) : ICurrentPlayer;
}

// Extension for convenience
public static class HttpContextExtensions
{
    public static ICurrentPlayer? GetCurrentPlayer(this HttpContext context)
    {
        return context.Items["CurrentPlayer"] as ICurrentPlayer;
    }
}
```

### Step 1.8 — Query String Auth for SignalR

**File**: `Scattergories.Server/Infrastructure/SignalR/QueryStringAuthMiddleware.cs`

```csharp
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Server.API.Auth;

namespace Scattergories.Infrastructure.SignalR;

/// <summary>
/// Reads the JWT from the SignalR query string (?access_token=...) and sets up
/// ClaimsPrincipal on the connection's Context so that ICurrentPlayer can be derived.
/// </summary>
public class QueryStringAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly JwtSettings _jwtSettings;

    public QueryStringAuthMiddleware(RequestDelegate next, IOptions<JwtSettings> jwtSettings)
    {
        _next = next;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var accessToken = context.Request.Query["access_token"].FirstOrDefault();

        if (!string.IsNullOrEmpty(accessToken) && context.User?.Identity?.IsAuthenticated != true)
        {
            var principal = ValidateJwt(accessToken);
            if (principal != null)
            {
                context.User = principal;

                // Populate HttpContext.Items so it's available in hub methods
                var playerId = Guid.TryParse(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var pid) ? pid : (Guid?)null;
                context.Items["CurrentPlayer"] = new PlayerContextMiddleware.CurrentPlayer(
                    playerId,
                    principal.FindFirst("PlayerName")?.Value,
                    Guid.TryParse(principal.FindFirst("GameId")?.Value, out var gid) ? gid : null,
                    null,
                    principal.FindFirst("Email")?.Value,
                    principal.FindFirst("GoogleId")?.Value
                );
            }
        }

        await _next(context);
    }

    private ClaimsPrincipal? ValidateJwt(string token)
    {
        try
        {
            var key = Encoding.ASCII.GetBytes(_jwtSettings.Secret);
            var validator = new JwtSecurityTokenHandler();
            var principal = validator.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = _jwtSettings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out _);

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
```

### Step 1.9 — Authentication Controller

**File**: `Scattergories.Server/API/Controllers/AuthenticationController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using Scattergories.Server.API.Auth;

namespace Scattergories.Server.API.Controllers;

/// <summary>
/// Authentication endpoints for Google Sign-In.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthenticationController : ControllerBase
{
    private readonly GoogleAuthenticationService _googleAuth;
    private readonly JwtService _jwtService;
    private readonly ScattergoriesDbContext _context;
    private readonly ILogger<AuthenticationController> _logger;
    private readonly GoogleSettings _googleSettings;

    public AuthenticationController(
        GoogleAuthenticationService googleAuth,
        JwtService jwtService,
        ScattergoriesDbContext context,
        ILogger<AuthenticationController> logger,
        IOptions<GoogleSettings> googleSettings)
    {
        _googleAuth = googleAuth;
        _jwtService = jwtService;
        _context = context;
        _logger = logger;
        _googleSettings = googleSettings.Value;
    }

    /// <summary>
    /// Authenticate with Google. Returns JWT if the player already exists in the system.
    /// POST /api/auth/google
    /// </summary>
    [HttpPost("google")]
    public async Task<ActionResult<GoogleAuthResponse>> AuthenticateWithGoogle([FromBody] GoogleAuthRequest request)
    {
        if (string.IsNullOrEmpty(_googleSettings.ClientId))
            return BadRequest("Google authentication is not configured.");

        if (string.IsNullOrEmpty(request.IdToken))
            return BadRequest("ID token is required.");

        try
        {
            // Check if this Google user already exists
            var googlePayload = await ValidateGoogleTokenOnly(request.IdToken);
            var player = await _context.Players
                .FirstOrDefaultAsync(p => p.GoogleId == googlePayload.Subject);

            if (player == null)
            {
                // New Google user — they haven't joined any game yet.
                // Return a flag so the frontend knows they need to create/join a game first.
                return Ok(new GoogleAuthResponse(
                    null,        // no JWT yet
                    null,        // no playerId
                    googlePayload.Email,
                    googlePayload.Name,
                    googlePayload.Subject,
                    isNewUser: true
                ));
            }

            // Existing player — issue JWT
            var jwt = _jwtService.GenerateToken(player, player.Email!, player.GoogleId);

            return Ok(new GoogleAuthResponse(
                jwt,
                player.Id.ToString(),
                player.Email,
                player.Name,
                player.GoogleId,
                isNewUser: false
            ));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Google authentication failed");
            return Unauthorized("Invalid Google token.");
        }
    }

    /// <summary>
    /// Link a Google account to an existing player (called after guest join).
    /// POST /api/auth/google/link
    /// </summary>
    [HttpPost("google/link")]
    public async Task<ActionResult<GoogleAuthResponse>> LinkGoogle(
        [FromBody] LinkGoogleRequest request)
    {
        if (string.IsNullOrEmpty(_googleSettings.ClientId))
            return BadRequest("Google authentication is not configured.");

        var result = await _googleAuth.LinkGoogleAsync(request.PlayerId, request.IdToken);

        return Ok(new GoogleAuthResponse(
            result.Jwt,
            null,  // playerId is part of the JWT now
            result.Email,
            null,  // playerName derived from JWT
            result.GoogleId,
            isNewUser: false
        ));
    }

    /// <summary>
    /// Check if Google auth is available.
    /// GET /api/auth/status
    /// </summary>
    [HttpGet("status")]
    public IActionResult GetAuthStatus()
    {
        return Ok(new { isGoogleAuthConfigured = !string.IsNullOrEmpty(_googleSettings.ClientId) });
    }

    // --- Helpers ---

    private async Task<GoogleJsonWebToken.Payload> ValidateGoogleTokenOnly(string token)
    {
        var settings = new GoogleJsonWebChart.ValidationSettings
        {
            Audience = new[] { _googleSettings.ClientId }
        };
        return await GoogleJsonWebChart.ValidateTokenAsync(token, settings);
    }
}

// Request/Response DTOs
public record GoogleAuthRequest(string IdToken);

public record GoogleAuthResponse(
    string? Jwt,
    string? PlayerId,
    string? Email,
    string? Name,
    string? GoogleId,
    bool IsNewUser);

public record LinkGoogleRequest(Guid playerId, string IdToken);
```

### Step 1.10 — Update GameHub for JWT

**File**: `Scattergories.Server/Infrastructure/SignalR/GameHub.cs` (modified)

```csharp
using System.Security.Claims;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Server.API.Auth;

public class GameHub : Hub
{
    // ... (existing _connectionToGame, _gameConnections static tracking unchanged)

    private readonly ICurrentPlayer _currentPlayer;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public GameHub(
        IMediator mediator,
        ICurrentPlayer currentPlayer,
        IHttpContextAccessor httpContextAccessor)
    {
        _mediator = mediator;
        _currentPlayer = currentPlayer;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task JoinGameRoom(string gameCode, string playerId)
    {
        // --- NEW: Derive ICurrentPlayer from JWT if available ---
        var currentPlayer = _httpContextAccessor.HttpContext?.GetCurrentPlayer() ?? _currentPlayer;

        if (currentPlayer?.PlayerId == null)
            throw new UnauthorizedAccessException("Player must be authenticated to join a game.");

        // Validate that the JWT PlayerId matches the playerId parameter
        var jwtPlayerId = currentPlayer.PlayerId.Value;
        var requestedPlayerId = Guid.Parse(playerId);
        if (jwtPlayerId != requestedPlayerId)
            throw new UnauthorizedAccessException("Player ID mismatch.");

        _connectionToGame[Context.ConnectionId] = gameCode;
        _gameConnections.GetOrAdd(gameCode, _ => new HashSet<string>()).Add(Context.ConnectionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, gameCode);

        // Update the ICurrentPlayer with the game context for this connection
        // (GameId comes from JWT, TeamId is resolved from the game data)
        await Clients.Group(gameCode).SendAsync("LobbyUpdated", await GetGameDto(gameCode));
    }

    public async Task SubmitAnswers(SubmitAnswersRequest request)
    {
        var player = _httpContextAccessor.HttpContext?.GetCurrentPlayer() ?? _currentPlayer;
        if (player?.PlayerId == null)
            throw new InvalidOperationException("Player not authenticated.");

        // ... rest of the method unchanged ...
    }

    // ... rest unchanged ...
}
```

### Step 1.11 — Update StubCurrentPlayer

**File**: `Scattergories.Server/Infrastructure/Services/StubCurrentPlayer.cs` (modified)

```csharp
public class StubCurrentPlayer : ICurrentPlayer
{
    private static readonly Lazy<StubCurrentPlayer> _instance = new(() => new StubCurrentPlayer());
    private Guid _playerId = Guid.NewGuid();

    public static StubCurrentPlayer Instance => _instance.Value;

    public Guid? PlayerId => _playerId;
    public string? PlayerName { get; set; }
    public Guid? GameId { get; set; }
    public Guid? TeamId { get; set; }

    // --- NEW ---
    public string? Email => null;
    public string? GoogleId => null;

    public static void SetPlayer(Guid? playerId, string? playerName)
    {
        _instance.Value._playerId = playerId ?? Guid.NewGuid();
        _instance.Value.PlayerName = playerName;
    }
}
```

### Step 1.12 — Update JoinGame Handler (store GoogleId)

**File**: `Scattergories.Server/Application/Features/Games/Commands/JoinGame/JoinGameHandler.cs` (modifies)

Add a `GoogleId?` parameter to `JoinGameCommand` and handler. When the player joins, if they provide a GoogleId, store it:

```csharp
// In JoinGameCommand:
public record JoinGameCommand(string GameCode, string PlayerName, string? GoogleId = null) : IRequest<Guid>;

// In JoinGameHandler, after creating the player:
player.GoogleId = request.GoogleId;
```

Update the `JoinGameRequest` in `GamesController.cs`:
```csharp
public record JoinGameRequest(string PlayerName, string? GoogleId = null);
```

### Step 1.13 — Wire Everything in Program.cs

**File**: `Scattergories.Server/API/Program.cs` (modified)

```csharp
var builder = WebApplication.CreateBuilder(args);

// --- Logging --- (unchanged)
// --- Database --- (unchanged)
// --- MediatR --- (unchanged)
// --- Domain Services --- (unchanged)

// --- NEW: Authentication Configuration ---
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));
builder.Services.Configure<GoogleSettings>(builder.Configuration.GetSection(GoogleSettings.SectionName));
builder.Services.AddScoped<GoogleAuthenticationService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddHttpContextAccessor();

// --- Current Player ---
// In production, resolved via JWT middleware. In dev, from StubCurrentPlayer.
builder.Services.AddScoped<ICurrentPlayer>(sp =>
{
    var httpContext = sp.GetRequiredService<IHttpContextAccessor>().HttpContext;
    if (httpContext?.Items["CurrentPlayer"] is ICurrentPlayer ctxPlayer)
        return ctxPlayer;
    return StubCurrentPlayer.Instance;
});

// --- SignalR --- (unchanged)
// --- Controllers --- (unchanged)
// --- CORS --- (unchanged)
// --- Swagger --- (unchanged)

var app = builder.Build();

// --- Seed database --- (unchanged)

// --- Middleware pipeline ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseHttpsRedirection();

// --- NEW: JWT Bearer authentication for REST API ---
app.UseAuthentication();   // validates JWT from Authorization header
app.UseAuthorization();

// --- NEW: Custom middleware for SignalR query-string JWT ---
app.UseMiddleware<QueryStringAuthMiddleware>();

app.MapControllers();
app.MapHub<GameHub>("/hubs/game");

app.Run();
```

### Step 1.14 — EF Core Migration

Run from the API project:
```bash
dotnet ef migrations add AddGoogleIdToPlayer
dotnet ef database update
```

This creates the `GoogleId` column and the unique index on `(GameId, GoogleId)`.

---

## Phase 2: Frontend — Auth Integration

### Step 2.1 — Install npm Packages

```bash
cd Scattergories.Client
npm install @react-oauth/google
npm install -D @types/google.accounts  # for type definitions
```

### Step 2.2 — Create Auth Store

**File**: `Scattergories.Client/src/state/authStore.ts` (new)

```typescript
interface UserInfo {
  playerId: string;
  playerName: string;
  email: string;
  googleId: string;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  isGoogleConfigured: boolean;

  setToken: (token: string | null) => void;
  setUser: (user: UserInfo | null) => void;
  setGoogleConfigured: (configured: boolean) => void;
  signIn: (idToken: string) => Promise<{ jwt: string; user: UserInfo }>;
  signOut: () => void;
  getToken: () => string | null; // for SignalR accessTokenFactory
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isGoogleConfigured: false,

  setToken: (token) => set({ token, isAuthenticated: !!token }),
  setUser: (user) => set({ user }),
  setGoogleConfigured: (configured) => set({ isGoogleConfigured: configured }),

  signIn: async (idToken: string) => {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Google sign-in failed');
    }

    const data = await response.json() as GoogleAuthResponse;

    // If isNewUser, they need to create/join a game first
    if (data.isNewUser) {
      throw new GoogleUserNotInSystem(data.email, data.name, data.googleId);
    }

    const user: UserInfo = {
      playerId: data.playerId!,
      playerName: data.name ?? data.email?.split('@')[0] ?? 'Player',
      email: data.email!,
      googleId: data.googleId!,
    };

    set({ token: data.jwt!, user, isAuthenticated: true });
    return { jwt: data.jwt!, user };
  },

  signOut: () => {
    set({ token: null, user: null, isAuthenticated: false });
    localStorage.removeItem('authToken');
  },

  getToken: () => get().token,
}));
```

**File**: `Scattergories.Client/src/state/authStore.ts` — also define types (or import from shared types):

```typescript
// Types for the auth API
interface GoogleAuthResponse {
  jwt: string | null;
  playerId: string | null;
  email: string | null;
  name: string | null;
  googleId: string | null;
  isNewUser: boolean;
}

class GoogleUserNotInSystem extends Error {
  constructor(
    public email: string,
    public displayName: string,
    public googleId: string
  ) {
    super('Please join a game first before linking Google account');
    this.name = 'GoogleUserNotInSystem';
  }
}
```

### Step 2.3 — Update apiClient

**File**: `Scattergories.Client/src/api/apiClient.ts` (modified)

```typescript
const API_BASE = '/api';

// Helper to get token from auth store
function getToken(): string | null {
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

// Export getToken for SignalR use
export { getToken };

export const apiClient = {
  createGame: (data: {
    roundCount?: number;
    timerSeconds?: number;
    pointsPerAnswer?: number;
    allowPlurals?: boolean;
    allowProperNouns?: boolean;
    allowOffensiveWords?: boolean;
  }) => request<string>('/games', { method: 'POST', body: JSON.stringify(data) }),

  joinGame: (code: string, playerName: string, googleId?: string) =>
    request<{ playerId: string }>(`/games/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ playerName, googleId }),
    }),

  getGame: (code: string) =>
    request<import('./types').GameState>(`/games/${code}`),

  startGame: (code: string) => {
    const token = getToken();
    return fetch(`${API_BASE}/games/${code}/start`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  submitAnswers: (code: string, roundId: string, answers: Array<{ categoryId: string; text: string }>) => {
    const token = getToken();
    return fetch(`${API_BASE}/games/${code}/answers`, {
      method: 'POST',
      body: JSON.stringify({ roundId, answers }),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  },

  revealAndScore: (code: string) =>
    request<import('./types').RevealAndScoreResult>(`/games/${code}/reveal`, { method: 'POST' }),

  nextRound: (code: string) => {
    const token = getToken();
    return fetch(`${API_BASE}/games/${code}/next-round`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  endGame: (code: string) =>
    request<import('./types').EndGameResult>(`/games/${code}/end`, { method: 'POST' }),
};
```

### Step 2.4 — Update hubConnection

**File**: `Scattergories.Client/src/api/hubConnection.ts` (modified)

```typescript
import * as signalR from '@microsoft/signalr';
import type {
  GameState,
  CategoryDto,
  ScoredAnswerDto,
} from './types';

const HUB_URL = '/hubs/game';

let connection: signalR.HubConnection | null = null;
let storedToken: string | null = null;

export const hubConnection = {
  async start(
    gameCode: string,
    playerName: string,
    playerId?: string,
  ): Promise<void> {
    if (connection) {
      try { await connection.stop(); } catch { /* ignore */ }
    }

    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => storedToken ?? '',
      })
      .withAutomaticReconnect()
      .build();

    const conn = connection!;

    // ... existing .on() handlers unchanged ...

    conn.onreconnecting(() => {
      console.warn('SignalR reconnecting...');
    });

    conn.onreconnected(() => {
      connection?.invoke('JoinGameRoom', gameCode, playerName, playerId)
        .catch(err => console.error('Re-join failed:', err));
    });

    await conn.start();
    await conn.invoke('JoinGameRoom', gameCode, playerName, playerId)
      .catch(err => console.error('Failed to join game room:', err));
  },

  // NEW: Set the JWT token for SignalR auth
  setToken(token: string | null): void {
    storedToken = token;
  },

  // NEW: Stop the connection
  async stop(): Promise<void> {
    if (connection) {
      try { await connection.stop(); } catch { /* ignore */ }
      connection = null;
    }
  },

  // ... existing submitAnswers and event handlers unchanged ...
};
```

### Step 2.5 — Create Auth Components

**File**: `Scattergories.Client/src/components/Auth/GoogleSignInButton.tsx` (new)

```typescript
import { GoogleLogin, GoogleLoginResponse } from '@react-oauth/google';
import { useAuthStore } from '../../state/authStore';

interface Props {
  onSuccess: (jwt: string, user: import('../../state/authStore').UserInfo) => void;
  onError?: () => void;
  size?: 'large' | 'medium' | 'small';
}

export function GoogleSignInButton({ onSuccess, onError }: Props) {
  const signIn = useAuthStore((s) => s.signIn);

  const handleSuccess = async (credentialResponse: GoogleLoginResponse) => {
    try {
      const { jwt, user } = await signIn(credentialResponse.credential!);
      onSuccess(jwt, user);
    } catch (error) {
      if (error instanceof import('../../state/authStore').GoogleUserNotInSystem) {
        // User exists on Google but hasn't joined any game yet
        // Show a message telling them to create/join a game first
        console.log('Please join a game first:', error.email);
        onError?.();
      } else {
        onError?.();
      }
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => {
        console.warn('Google sign-in failed');
        onError?.();
      }}
      useOneTap
    />
  );
}
```

**File**: `Scattergories.Client/src/components/Header.tsx` (new)

```typescript
import { useAuthStore } from '../state/authStore';
import { useGameStore } from '../state/gameStore';
import { GoogleSignInButton } from './Auth/GoogleSignInButton';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isGoogleConfigured, signOut, setGoogleConfigured } = useAuthStore();
  const { playerName, gameCode, reset } = useGameStore();

  // Check auth status on mount
  if (!useAuthStore.getState()._initialized && isGoogleConfigured === false) {
    useAuthStore.getState()._checkAuthStatus();
  }

  const handleSignOut = () => {
    signOut();
    reset();
    navigate('/');
  };

  return (
    <header className="w-full px-4 py-3 flex items-center justify-between bg-white/10 backdrop-blur-sm">
      {/* Logo */}
      <button onClick={() => navigate('/')} className="flex items-center gap-2">
        <span className="text-white font-bold text-lg">Scattergories</span>
      </button>

      {/* Right side: Auth or User */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            {/* User avatar + name */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
                {user.playerName.charAt(0).toUpperCase()}
              </div>
              <span className="text-white text-sm">{user.playerName}</span>
              <button
                onClick={handleSignOut}
                className="text-violet-200 hover:text-white text-sm transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : isGoogleConfigured ? (
          <div className="flex items-center gap-2">
            <GoogleSignInButton
              onSuccess={() => {
                // User is now authenticated — they'll see the Home page with options
              }}
              onError={() => {
                // Fallback to guest mode
              }}
            />
            <span className="text-violet-300 text-sm">or</span>
            <button
              onClick={() => {
                // Enter guest mode
                document.getElementById('guestNameInput')?.focus();
              }}
              className="text-white hover:text-violet-200 text-sm transition-colors"
            >
              Play as guest
            </button>
          </div>
        ) : (
          // Google not configured — just guest mode
          <span className="text-violet-300 text-sm">Guest mode</span>
        )}
      </div>
    </header>
  );
}
```

### Step 2.6 — Update App.tsx

**File**: `Scattergories.Client/src/App.tsx` (modified)

```typescript
import { HashRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { GamePage } from './pages/GamePage';
import { Scoreboard } from './pages/Scoreboard';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'not-configured';

export function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <HashRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby/:code" element={<Lobby />} />
          <Route path="/game/:code" element={<GamePage />} />
          <Route path="/scoreboard/:code" element={<Scoreboard />} />
        </Routes>
      </HashRouter>
    </GoogleOAuthProvider>
  );
}
```

### Step 2.7 — Update Home.tsx with Auth

**File**: `Scattergories.Client/src/pages/Home.tsx` (modified)

The Home page becomes the main landing with three distinct states:

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, getToken } from '../api/apiClient';
import { useGameStore } from '../state/gameStore';
import { useAuthStore } from '../state/authStore';
import { GoogleSignInButton } from '../components/Auth/GoogleSignInButton';

export function Home() {
  const navigate = useNavigate();
  const { playerName, playerId, setPlayerName, joinGame, setPlayerId } = useGameStore();
  const { isAuthenticated, user, setGoogleConfigured } = useAuthStore();
  const [nameInput, setNameInput] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing auth token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      useAuthStore.getState().setToken(token);
    }

    // Check if Google auth is available
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(data => setGoogleConfigured(data.isGoogleAuthConfigured))
      .catch(() => setGoogleConfigured(false));
  }, [setGoogleConfigured]);

  const handleCreate = async () => {
    const name = nameInput || playerName;
    if (!name.trim()) { setError('Enter your name'); return; }
    setLoading(true);
    setError('');
    try {
      const code = await apiClient.createGame({ timerSeconds: 180 });
      joinGame(code, name);
      if (isAuthenticated) {
        setPlayerId(user!.playerId);
      }
      navigate(`/lobby/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const name = nameInput || playerName;
    if (!name.trim()) { setError('Enter your name'); return; }
    if (!gameCode.trim()) { setError('Enter a game code'); return; }
    setLoading(true);
    setError('');
    try {
      const googleId = isAuthenticated ? user?.googleId : undefined;
      const { playerId: newPlayerId } = await apiClient.joinGame(
        gameCode.trim().toUpperCase(), name, googleId
      );
      joinGame(gameCode.trim().toUpperCase(), name);
      if (isAuthenticated) {
        setPlayerId(user!.playerId);
      } else {
        localStorage.setItem('playerId', newPlayerId);
      }
      navigate(`/lobby/${gameCode.trim().toUpperCase()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (jwt: string, authUser: { playerId: string }) => {
    // After Google auth, auto-populate the name
    setNameInput(authUser.displayName);
    setPlayerId(authUser.playerId);
  };

  // ... render ...
}
```

**Full Home.tsx rendering logic** (enhanced UI):

```tsx
return (
  <div className="min-h-screen bg-gradient-to-br from-violet-600 to-indigo-800 flex flex-col">
    {/* Main content */}
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-center text-violet-700 mb-2">
          Scattergories
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Name, Place, Animal, Thing
        </p>

        {/* Auth section */}
        {isAuthenticated && user && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold">
              {user.playerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">{user.playerName}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
          </div>
        )}

        {/* Name input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            id="guestNameInput"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
            placeholder="Enter your name"
            maxLength={20}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading || !nameInput.trim()}
          className="w-full mb-3 py-3 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : 'Create New Game'}
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Game Code
          </label>
          <input
            type="text"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none uppercase text-center text-lg tracking-widest"
            placeholder="ABC"
            maxLength={3}
          />
        </div>

        <button
          onClick={handleJoin}
          disabled={loading || !gameCode.trim() || !nameInput.trim()}
          className="w-full py-3 border-2 border-violet-600 text-violet-600 rounded-lg font-semibold hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Joining...' : 'Join Game'}
        </button>

        {/* Google Sign-In (shown when Google is configured but user isn't signed in) */}
        {!isAuthenticated && useAuthStore.getState().isGoogleConfigured && (
          <div className="mt-6">
            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or sign in with</span>
              </div>
            </div>
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError('Google sign-in failed. Try again or play as guest.');
              }}
            />
          </div>
        )}
      </div>
    </div>
  </div>
);
```

### Step 2.8 — Update GamePage to Use Auth Token

**File**: `Scattergories.Client/src/pages/GamePage.tsx` (modified)

The `hubConnection.start()` call needs the auth token. Add a token sync:

```typescript
// At the top of the GamePage component, add:
useEffect(() => {
  const token = localStorage.getItem('authToken');
  if (token) {
    hubConnection.setToken(token);
  }
}, []);
```

This ensures the SignalR connection uses the JWT via `accessTokenFactory`.

### Step 2.9 — Update All Pages to Wrap with Header Layout

**File**: `Scattergories.Client/src/pages/Lobby.tsx`, `GamePage.tsx`, `Scoreboard.tsx`

Each page currently has its own `min-h-screen bg-gradient-to-br` wrapper. Since the Header is now at the app level, the pages should add padding-top to account for it:

In `index.css`, add:
```css
body {
  padding-top: 60px; /* space for Header */
}
```

In each page's root div, remove any top margin that would conflict.

### Step 2.10 — Environment Configuration

**File**: `Scattergories.Client/.env` (new, or add to `.env.local`):

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**File**: `Scattergories.Server/API/appsettings.json` (or `appsettings.Development.json`):

```json
{
  "JwtSettings": {
    "Secret": "YOUR-32-CHAR-MINIMUM-SECRET-KEY-CHANGE-IN-PRODUCTION",
    "Issuer": "Scattergories",
    "Audience": "ScattergoriesClient",
    "ExpiryMinutes": 1440
  },
  "GoogleSettings": {
    "ClientId": ""
  }
}
```

**File**: `Scattergories.Client/.gitignore` — ensure `.env` and `.env.local` are ignored.

---

## Phase 3: Auth Flow Sequence Diagrams

### 3A: New User — Guest First, Then Link (Current Flow, Enhanced)

```
Frontend                          Backend                      Google
------                          -------                      ------
1.  Enter name, create game  →
2.                         POST /api/games        →
3.                         CreateGameCommand →
4.                         Persist player       →
5.  ← code                 ←                     ←

6.  Submit answers       → SignalR /hubs/game (no JWT)
7.                         StubCurrentPlayer (dev)
```

### 3B: Returning User — Google Sign-In (Pre-Registered)

```
Frontend                          Backend                      Google
------                          -------                      ------
1.  Click "Sign in with Google"
2.  Google popup → ID token
3.  POST /api/auth/google      →
4.                         Validate Google token     →
5.                         ← ID token payload       ←
6.                         Find Player by GoogleId  →
7.                         Issue JWT                 →
8.  ← { jwt, playerId, email }
9.  Store token in localStorage
10. Connect SignalR:
    withUrl(..., { accessTokenFactory: () => token })
11.                       ← ?access_token=JWT
12.  QueryStringAuthMiddleware validates JWT
13.  HttpContext.Items["CurrentPlayer"] populated
14.  JoinGameRoom(gameCode, playerId) validates
15.  ← Connected
```

### 3C: Guest → Later Authenticate (Link Flow)

```
Frontend                          Backend                      DB
------                          -------                      --
1.  Join as guest → game      → POST /api/games/code/join
2.                         CreatePlayer (no GoogleId)
3.  ← { playerId: "abc-123" }

... play game ...

4.  Later: Click "Link Google"
5.  Google popup → ID token
6.  POST /api/auth/google/link →
7.                         Find Player by playerId
8.                         Set player.GoogleId
9.                         Issue JWT
10. ← { jwt }
11. Store JWT in localStorage
12. SignalR reconnects with JWT
```

---

## Phase 4: Player Transition Flow (Guest → Authenticated)

### Scenario 1: Sign In Before Joining (New Google User)

```
1. User clicks "Sign in with Google"
2. Gets Google ID token, sends to POST /api/auth/google
3. Backend: Google user NOT found in DB → returns { isNewUser: true, email, name }
4. Frontend: Shows "Please create or join a game first" message
5. User enters name, creates/joins game
   → POST /api/games (create) or /games/:code/join (join)
   → Player created with Name from Google profile
6. Later: User can link their Google account
   → POST /api/auth/google/link with playerId + ID token
7. Backend: Links GoogleId to player, issues JWT
8. Frontend: Stores JWT, reconnects SignalR with token
```

### Scenario 2: Join as Guest, Then Link

```
1. User joins game as guest (no Google)
2. Plays the game
3. After game or during: User clicks "Link Google Account"
4. Frontend: Gets Google ID token
5. POST /api/auth/google/link with existing playerId
6. Backend: Links GoogleId, issues JWT
7. Frontend: Stores JWT, reconnects SignalR
```

### Scenario 3: Returning Player (Already Has GoogleId)

```
1. User clicks "Sign in with Google"
2. Frontend: Gets Google ID token
3. POST /api/auth/google
4. Backend: Finds Player by GoogleId → { jwt, playerId }
5. Frontend: Stores JWT, auto-fills player name
6. User joins game directly with authenticated identity
7. All API calls and SignalR use JWT automatically
```

---

## Phase 5: SignalR Authentication Details

### How JWT Reaches the Hub

```
SignalR Client                    WebSocket/Server
--------------                    --------------
1. HubConnectionBuilder
   .withUrl("/hubs/game", {
     accessTokenFactory: () => token
   })

2. When starting:
   GET /hubs/game?id=xxx&access_token=JWT

3. QueryStringAuthMiddleware:
   - Reads ?access_token
   - Validates JWT
   - Sets HttpContext.User
   - Sets HttpContext.Items["CurrentPlayer"]

4. GameHub.JoinGameRoom() calls:
   _httpContextAccessor.HttpContext?.GetCurrentPlayer()

5. ICurrentPlayer has JWT claims: PlayerId, PlayerName, Email
```

### SignalR Token Refresh

The `accessTokenFactory` callback is called on every reconnection:
```typescript
// hubConnection.ts stores the latest token
let storedToken: string | null = null;

// accessTokenFactory: () => storedToken ?? ''
// When user signs in/out, call hubConnection.setToken(newToken)
// Next reconnection will pick up the new token
```

---

## File Summary

### Files to Create (Backend — 7):
| File | Project | Purpose |
|------|---------|---------|
| `API/Auth/JwtSettings.cs` | API | JWT config model |
| `API/Auth/GoogleSettings.cs` | API | Google OAuth config model |
| `API/Auth/GoogleAuthenticationService.cs` | API | Google token validation + JWT issuance |
| `API/Auth/JwtService.cs` | API | JWT token creation |
| `API/Auth/PlayerContextMiddleware.cs` | API | Derive ICurrentPlayer from JWT |
| `Infrastructure/SignalR/QueryStringAuthMiddleware.cs` | Infrastructure | SignalR JWT from query string |
| `API/Controllers/AuthenticationController.cs` | API | REST auth endpoints |

### Files to Create (Frontend — 5):
| File | Purpose |
|------|---------|
| `src/state/authStore.ts` | Zustand auth store (token, user, signIn/signOut) |
| `src/components/Auth/GoogleSignInButton.tsx` | Google Sign-In wrapper |
| `src/components/Header.tsx` | App header with auth state |
| `.env` or `.env.local` | Frontend env vars |
| `appsettings.json` additions | Backend env vars |

### Files to Modify (Backend — 6):
| File | Change |
|------|--------|
| `Scattergories.Server.csproj` | Add NuGet packages |
| `Domain/Entities/Player.cs` | Add `GoogleId`, `Email` properties |
| `Infrastructure/Data/ScattergoriesDbContext.cs` | Add unique index on `(GameId, GoogleId)` |
| `Application/Common/Interfaces/ICurrentPlayer.cs` | Add `Email`, `GoogleId` |
| `Infrastructure/Services/StubCurrentPlayer.cs` | Add stub `Email`/`GoogleId` |
| `Infrastructure/SignalR/GameHub.cs` | Derive ICurrentPlayer from HttpContext |
| `Application/Features/Games/Commands/JoinGame/JoinGameCommand.cs` | Add optional `GoogleId` |
| `Application/Features/Games/Commands/JoinGame/JoinGameHandler.cs` | Store GoogleId when joining |
| `API/Controllers/GamesController.cs` | Pass GoogleId in JoinGameRequest |
| `API/Program.cs` | Register auth services + middleware |

### Files to Modify (Frontend — 6):
| File | Change |
|------|--------|
| `package.json` | Add `@react-oauth/google` |
| `src/App.tsx` | Wrap with `GoogleOAuthProvider`, add `<Header />` |
| `src/api/apiClient.ts` | Add Authorization header from token |
| `src/api/hubConnection.ts` | Add `setToken()`, configure `accessTokenFactory` |
| `src/state/gameStore.ts` | Add `playerId` to store (already exists, but wire with auth) |
| `src/pages/Home.tsx` | Add Google Sign-In button, auth-aware flow |
| `src/index.css` | Add `body { padding-top: 60px }` for Header |

---

## Environment Variables Required

### Backend (`appsettings.json` or environment):
```json
{
  "JwtSettings": {
    "Secret": "<32-char+ random string, change per deployment>",
    "Issuer": "Scattergories",
    "Audience": "ScattergoriesClient",
    "ExpiryMinutes": 1440
  },
  "GoogleSettings": {
    "ClientId": "<Google OAuth Client ID>"
  }
}
```

### Frontend (`.env`):
```env
VITE_GOOGLE_CLIENT_ID=<Google OAuth Client ID>
```

### How to generate a JWT secret:
```bash
# Generate a 256-bit key
openssl rand -base64 32
```

---

## Testing Strategy

### Unit Tests (Backend):
1. `JwtService.GenerateToken` — verify claims, expiry, signature
2. `JwtService.TryValidateToken` — valid token returns true, invalid returns false
3. `GoogleAuthenticationService.ValidateGoogleTokenAsync` — mock GoogleJsonWebChart
4. `PlayerContextMiddleware` — verify HttpContext.Items population
5. `QueryStringAuthMiddleware` — verify SignalR JWT extraction

### Integration Tests:
1. `POST /api/auth/google` with valid Google ID token → returns JWT
2. `POST /api/auth/google` with invalid token → 401
3. `GET /api/games/code` with valid JWT → 200
4. `GET /api/games/code` without JWT → 401 (when auth is enforced)

### E2E (Frontend):
1. Home page shows Google Sign-In button when Google configured
2. After Google sign-in, Header shows avatar + name
3. API calls include Authorization header
4. SignalR connection authenticates with JWT
5. Guest flow still works without Google auth

---

## Migration Notes

### Database Migration:
```bash
dotnet ef migrations add AddGoogleIdToPlayer
dotnet ef database update
```

### Safety:
- Both `GoogleId` and `Email` are **nullable** — guest players don't have them
- The unique index on `(GameId, GoogleId)` has a filter `WHERE GoogleId IS NOT NULL`
- `GoogleSettings.ClientId` defaults to empty string — Google auth is **disabled by default**
- All existing API endpoints work without auth (backward compatible)
- `StubCurrentPlayer` continues to work in development

### Production Deployment:
1. Set `JwtSettings__Secret` to a strong random value
2. Set `GoogleSettings__ClientId` to the OAuth Client ID
3. Configure Google OAuth consent screen with the frontend URL
4. Add the frontend origin to Google OAuth authorized origins
5. Consider upgrading to asymmetric signing (RS256) for production
