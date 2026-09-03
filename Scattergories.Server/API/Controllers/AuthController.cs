using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Domain.Entities;
using Scattergories.Domain.Exceptions;
using Scattergories.Infrastructure.Data;
using Scattergories.Infrastructure.Services;

namespace Scattergories.Server.API.Controllers;

/// <summary>
/// Authentication controller for Google Sign-In.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly GoogleAuthService _googleAuth;
    private readonly ScattergoriesDbContext _context;
    private readonly ILogger<AuthController> _logger;
    private readonly string _jwtSecret;
    private readonly string _jwtIssuer;
    private readonly string _jwtAudience;

    public AuthController(
        GoogleAuthService googleAuth,
        ScattergoriesDbContext context,
        ILogger<AuthController> logger,
        IConfiguration configuration)
    {
        _googleAuth = googleAuth;
        _context = context;
        _logger = logger;
        _jwtSecret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret is required. Configure it via appsettings or environment variables.");
        _jwtIssuer = configuration["Jwt:Issuer"] ?? "Scattergories";
        _jwtAudience = configuration["Jwt:Audience"] ?? "scattergories-client";
    }

    /// <summary>
    /// Authenticates a player using a Google ID token.
    /// Returns a JWT for subsequent API requests.
    /// POST /api/auth/google
    /// </summary>
    [HttpPost("google")]
    public async Task<ActionResult<AuthTokenResponse>> AuthenticateWithGoogle([FromBody] GoogleAuthRequest request)
    {
        try
        {
            var payload = await _googleAuth.VerifyTokenAsync(request.IdToken);
            var user = await _googleAuth.GetOrCreateUserAccountAsync(payload);

            var token = GenerateJwtToken(user);
            _logger.LogInformation("User authenticated: {Email}", user.Email);

            var userDto = new UserDto(
                user.Id.ToString(),
                user.GoogleId,
                user.Email,
                user.DisplayName,
                user.ProfileImageUrl);

            return Ok(new AuthTokenResponse(token, 3600, "Bearer", userDto));
        }
        catch (SecurityException ex)
        {
            _logger.LogWarning(ex, "Google auth failed for token");
            return Unauthorized(new { error = "invalid_token", error_description = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google auth error");
            return StatusCode(500, new { error = "internal_error" });
        }
    }

    /// <summary>
    /// Returns the current authenticated user's profile.
    /// GET /api/auth/me
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public ActionResult<UserDto> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            return Unauthorized();

        var user = _context.UserAccounts.Find(userGuid);
        if (user == null)
            return NotFound();

        return Ok(new UserDto(
            user.Id.ToString(),
            user.GoogleId,
            user.Email,
            user.DisplayName,
            user.ProfileImageUrl));
    }

    /// <summary>
    /// Joins a game as the authenticated user.
    /// POST /api/games/{code}/join/auth
    /// </summary>
    [HttpPost("games/{code}/join/auth")]
    [Authorize]
    public async Task<ActionResult<JoinGameResponse>> JoinGameWithAuth(string code, [FromBody] JoinGameAuthRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var userGuid))
            return Unauthorized();

        var user = await _context.UserAccounts.FindAsync(userGuid);
        if (user == null)
            return NotFound();

        var game = await _context.Games
            .Include(g => g.Players)
            .FirstOrDefaultAsync(g => g.Code == code.ToUpper());

        if (game == null)
            return NotFound(new { error = "game_not_found" });

        if (game.GameState != Domain.Enums.GameState.Lobby)
            return BadRequest(new { error = "game_not_in_lobby" });

        // Check if user already has a player in this game
        var existingPlayer = game.Players.FirstOrDefault(p => p.UserId == user.Id);
        if (existingPlayer != null)
            return Ok(new JoinGameResponse(existingPlayer.Id.ToString()));

        // Create new player
        var playerName = request.PlayerName ?? user.DisplayName;
        var player = new Domain.Entities.Player(playerName, isHost: false)
        {
            UserId = user.Id,
            GameId = game.Id,
        };

        // Auto-assign to first available team
        var teams = game.Teams.OrderBy(t => t.TeamScore).ToList();
        if (teams.Count > 0)
        {
            player.TeamId = teams[0].Id;
        }

        game.Players.Add(player);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {Email} joined game {Code} as {PlayerName}", user.Email, code, player.Name);

        return Ok(new JoinGameResponse(player.Id.ToString()));
    }

    private string GenerateJwtToken(UserAccount user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64),
        };

        var token = new JwtSecurityToken(
            issuer: _jwtIssuer,
            audience: _jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

// Request / Response DTOs

public record GoogleAuthRequest(string IdToken);

public record AuthTokenResponse(
    string AccessToken,
    int ExpiresIn,
    string TokenType,
    UserDto User
);

public record UserDto(
    string Id,
    string GoogleId,
    string Email,
    string Name,
    string? ProfileImageUrl
);

public record JoinGameAuthRequest(string? PlayerName = null);

public record JoinGameResponse(string PlayerId);
