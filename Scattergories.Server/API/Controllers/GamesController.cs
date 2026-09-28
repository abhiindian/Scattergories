using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Application.Features.Games.Commands.BeginRound;
using Scattergories.Application.Features.Games.Commands.CreateGame;
using Scattergories.Application.Features.Games.Commands.EndGame;
using Scattergories.Application.Features.Games.Commands.JoinGame;
using Scattergories.Application.Features.Games.Commands.RevealAndScore;
using Scattergories.Application.Features.Games.Commands.RoundTimeUp;
using Scattergories.Application.Features.Games.Commands.StartGame;
using Scattergories.Application.Features.Games.Commands.SubmitAnswers;
using Scattergories.Application.Features.Games.Queries.GetGame;
using Scattergories.Domain.Enums;
using Scattergories.Domain.Services;
using Scattergories.Infrastructure.Data;
using System.Security.Claims;

namespace Scattergories.Server.API.Controllers;

/// <summary>
/// REST API controller for game operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class GamesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ScattergoriesDbContext _context;
    private readonly ILogger<GamesController> _logger;
    private readonly ILetterService _letterService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly Microsoft.AspNetCore.SignalR.IHubContext<Scattergories.Infrastructure.SignalR.GameHub> _hubContext;

    public GamesController(
        IMediator mediator,
        ScattergoriesDbContext context,
        ILogger<GamesController> logger,
        ILetterService letterService,
        IHttpContextAccessor httpContextAccessor,
        Microsoft.AspNetCore.SignalR.IHubContext<Scattergories.Infrastructure.SignalR.GameHub> hubContext)
    {
        _mediator = mediator;
        _context = context;
        _logger = logger;
        _letterService = letterService;
        _httpContextAccessor = httpContextAccessor;
        _hubContext = hubContext;
    }

    /// <summary>
    /// Create a new game.
    /// POST /api/games
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateGame([FromBody] CreateGameRequest request)
    {
        var command = new CreateGameCommand(
            request.RoundCount,
            request.TimerSeconds,
            request.PointsPerAnswer,
            request.AllowPlurals,
            request.AllowProperNouns,
            request.AllowOffensiveWords,
            request.Categories
        );

        var code = await _mediator.Send(command);
        return Ok(new { code });
    }

    /// <summary>
    /// Update an existing game configuration.
    /// PUT /api/games/{code}/config
    /// </summary>
    [HttpPut("{code}/config")]
    [Authorize]
    public async Task<IActionResult> UpdateGameConfig(string code, [FromBody] UpdateGameConfigRequest request)
    {
        var command = new Scattergories.Application.Features.Games.Commands.UpdateGameConfig.UpdateGameConfigCommand(
            code,
            request.RoundCount,
            request.TimerSeconds,
            request.PointsPerAnswer,
            request.AllowPlurals,
            request.AllowProperNouns,
            request.AllowOffensiveWords,
            request.Categories
        );

        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Join an existing game.
    /// POST /api/games/{code}/join
    /// </summary>
    [HttpPost("{code}/join")]
    public async Task<IActionResult> JoinGame(string code, [FromBody] JoinGameRequest request)
    {
        var command = new JoinGameCommand(code, request.PlayerName);
        var playerId = await _mediator.Send(command);
        return Ok(new { playerId });
    }

    /// <summary>
    /// Get the current state of a game.
    /// GET /api/games/{code}
    /// </summary>
    [HttpGet("{code}")]
    public async Task<ActionResult<GetGameDto>> GetGame(string code)
    {
        var query = new GetGameQuery(code);
        var game = await _mediator.Send(query);
        return Ok(game);
    }

    /// <summary>
    /// Host starts the game.
    /// POST /api/games/{code}/start
    /// </summary>
    [HttpPost("{code}/start")]
    public async Task<IActionResult> StartGame(string code, [FromQuery] Guid? playerId)
    {
        var game = await GetGameEntity(code);
        if (game == null) return NotFound();

        if (playerId.HasValue)
        {
            // Guest flow: resolve by playerId query parameter
            var player = game.Players.FirstOrDefault(p => p.Id == playerId.Value);
            if (player == null) return NotFound("Player not found in game.");
            if (!player.IsHost) return Forbid("Only the host can start the game.");
        }
        else
        {
            // Authenticated flow: resolve by JWT
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("nameid");
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var player = game.Players.FirstOrDefault(p => p.UserId == userId);
            if (player == null || !player.IsHost)
                return Forbid();
        }

        var command = new StartGameCommand(game.Id);
        await _mediator.Send(command);

        // Reload the entity after the command creates rounds — the game entity here is stale
        game = await GetGameEntity(code);
        if (game == null) return NotFound();

        // Pick the next letter and set round state — inline to avoid concurrency conflict
        // with a separate BeginRound command (both would try to SaveChanges on the same entity).
        var letter = _letterService.GetNextLetter(game).ToString();
        var round = game.Rounds.FirstOrDefault(r => r.RoundNumber == 1);
        if (round != null)
        {
            round.Letter = letter;
            round.State = Domain.Enums.RoundState.Running;
            round.StartedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        var categories = game.Categories.OrderBy(c => c.DisplayOrder)
            .Select(c => new { c.Id, c.Name, c.DisplayOrder }).ToArray();

        await _hubContext.Clients.Group(code.ToUpper()).SendAsync("RoundStarted", new
        {
            RoundNumber = 1,
            Letter = letter,
            TimerSeconds = game.TimerSeconds,
            Categories = categories
        });

        // Start timer loop in background
        _ = Task.Run(async () =>
        {
            for (var remaining = game.TimerSeconds; remaining > 0; remaining -= 5)
            {
                await Task.Delay(TimeSpan.FromSeconds(5));
                await _hubContext.Clients.Group(code.ToUpper()).SendAsync("TimerTick", new
                {
                    RemainingSeconds = Math.Max(remaining, 0),
                    TotalSeconds = game.TimerSeconds
                });
            }

            await _hubContext.Clients.Group(code.ToUpper()).SendAsync("TimeUp", new
            {
                RoundNumber = 1,
                Letter = letter
            });
        });

        return NoContent();
    }

    /// <summary>
    /// Submit answers (REST fallback for SignalR).
    /// POST /api/games/{code}/answers
    /// </summary>
    [HttpPost("{code}/answers")]
    public async Task<IActionResult> SubmitAnswers(string code, [FromQuery] Guid? playerId, [FromBody] SubmitAnswersRequest request)
    {
        var game = await GetGameEntity(code);
        if (game == null) return NotFound();

        Guid resolvedPlayerId;

        if (playerId.HasValue)
        {
            // Guest flow: resolve by playerId query parameter
            var player = game.Players.FirstOrDefault(p => p.Id == playerId.Value);
            if (player == null) return NotFound("Player not found in game.");
            resolvedPlayerId = player.Id;
        }
        else
        {
            // Authenticated flow: resolve from JWT
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("nameid");
            Guid playerFromJwt;

            if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userGuid))
            {
                var player = await _context.Players
                    .FirstOrDefaultAsync(p => p.UserId == userGuid && p.GameId == game.Id);
                if (player == null)
                    return Unauthorized("Player not found in game.");
                playerFromJwt = player.Id;
            }
            else
            {
                return Unauthorized("Authentication required.");
            }
            resolvedPlayerId = playerFromJwt;
        }

        var command = new SubmitAnswersCommand(
            game.Id,
            resolvedPlayerId,
            request.RoundId,
            request.Answers.Select(a => new AnswerSubmission(a.CategoryId, a.Text)).ToArray()
        );

        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Host reveals and scores the current round.
    /// POST /api/games/{code}/reveal
    /// </summary>
    [HttpPost("{code}/reveal")]
    [Authorize]
    public async Task<ActionResult<RevealAndScoreResult>> RevealAndScore(string code)
    {
        var game = await GetGameEntity(code);
        if (game == null) return NotFound();

        var command = new RevealAndScoreCommand(game.Id);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Host advances to the next round.
    /// POST /api/games/{code}/next-round
    /// </summary>
    [HttpPost("{code}/next-round")]
    [Authorize]
    public async Task<IActionResult> NextRound(string code)
    {
        var game = await GetGameEntity(code);
        if (game == null) return NotFound();

        if (game.GameState == GameState.Finished)
            return BadRequest("Game is already finished.");

        if (game.CurrentRoundNumber >= game.RoundCount)
            return BadRequest("No more rounds available.");

        // Set the letter for the next round
        var nextRound = game.Rounds.FirstOrDefault(r => r.RoundNumber == game.CurrentRoundNumber + 1);
        if (nextRound != null)
        {
            nextRound.Letter = _letterService.GetNextLetter(game).ToString();
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Host ends the game.
    /// POST /api/games/{code}/end
    /// </summary>
    [HttpPost("{code}/end")]
    [Authorize]
    public async Task<ActionResult<EndGameResult>> EndGame(string code)
    {
        var game = await GetGameEntity(code);
        if (game == null) return NotFound();

        var command = new EndGameCommand(game.Id);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Scores the current round and starts the next round automatically.
    /// POST /api/games/{code}/time-up
    /// </summary>
    [HttpPost("{code}/time-up")]
    [Authorize]
    public async Task<ActionResult<RoundTimeUpResult>> RoundTimeUp(string code)
    {
        var game = await GetGameEntity(code);
        if (game == null) return NotFound();

        var command = new RoundTimeUpCommand(game.Id);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// List all available categories.
    /// GET /api/categories
    /// </summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.Categories
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new { c.Id, c.Name, c.DisplayOrder })
            .ToArrayAsync();
        return Ok(categories);
    }

    /// <summary>
    /// Health check.
    /// GET /api/games/health
    /// </summary>
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }

    private async Task<Scattergories.Domain.Entities.Game?> GetGameEntity(string code)
    {
        return await _context.Games
            .Include(g => g.Rounds)
            .Include(g => g.Players)
            .Include(g => g.Teams)
            .Include(g => g.Categories)
            .FirstOrDefaultAsync(g => g.Code == code);
    }
}

// Request DTOs
public record CreateGameRequest(
    int RoundCount = 9,
    int TimerSeconds = 180,
    int PointsPerAnswer = 10,
    bool AllowPlurals = false,
    bool AllowProperNouns = false,
    bool AllowOffensiveWords = false,
    string[]? Categories = null
);

public record JoinGameRequest(
    string PlayerName
);

public record SubmitAnswersRequest(
    Guid RoundId,
    AnswerDto[] Answers
);

public record AnswerDto(
    Guid CategoryId,
    string Text
);

public record UpdateGameConfigRequest(
    int RoundCount,
    int TimerSeconds,
    int PointsPerAnswer,
    bool AllowPlurals,
    bool AllowProperNouns,
    bool AllowOffensiveWords,
    string[]? Categories
);
