using System.Collections.Concurrent;
using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Infrastructure.Data;
using Scattergories.Application.Features.Games.Commands.BeginRound;
using Scattergories.Application.Features.Games.Commands.RevealAndScore;
using Scattergories.Application.Features.Games.Commands.SubmitAnswers;
using Scattergories.Application.Features.Games.Queries.GetGame;

namespace Scattergories.Infrastructure.SignalR;

/// <summary>
/// SignalR hub for real-time game communication.
/// Handles joining game rooms, submitting answers, and broadcasting game state.
/// </summary>
[Authorize]
public class GameHub : Hub
{
    // Track connection-to-game mappings for disconnect detection
    private static readonly ConcurrentDictionary<string, string> _connectionToGame = new();
    private static readonly ConcurrentDictionary<string, HashSet<string>> _gameConnections = new();

    private readonly IMediator _mediator;
    private readonly ICurrentPlayer _currentPlayer;
    private readonly ScattergoriesDbContext _dbContext;

    public GameHub(IMediator mediator, ICurrentPlayer currentPlayer, ScattergoriesDbContext dbContext)
    {
        _mediator = mediator;
        _currentPlayer = currentPlayer;
        _dbContext = dbContext;
    }

    /// <summary>
    /// Client joins the SignalR group for a specific game.
    /// JWT is passed via accessTokenFactory (SignalR built-in auth).
    /// </summary>
    public async Task JoinGameRoom(string gameCode, string playerId)
    {
        if (string.IsNullOrWhiteSpace(gameCode))
            throw new HubException("Game code is required.");
        if (string.IsNullOrWhiteSpace(playerId))
            throw new HubException("Player ID is required.");
        if (gameCode.Length > 10)
            throw new HubException("Game code is too long.");

        // Validate the gameCode matches an existing game
        var game = await _dbContext.Games.FirstOrDefaultAsync(g => g.Code == gameCode.ToUpper());
        if (game == null)
            throw new HubException("Game not found.");

        // Verify the provided playerId is registered in this game
        var isRegistered = await _dbContext.Players
            .AnyAsync(p => p.GameId == game.Id && p.Id.ToString() == playerId);
        if (!isRegistered)
            throw new HubException("Player is not registered in this game.");

        _connectionToGame[Context.ConnectionId] = gameCode;
        _gameConnections.GetOrAdd(gameCode.ToUpper(), _ => new HashSet<string>()).Add(Context.ConnectionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, gameCode.ToUpper());
        await Clients.Group(gameCode.ToUpper()).SendAsync("LobbyUpdated", await GetGameDto(gameCode.ToUpper()));
    }

    /// <summary>
    /// Client submits all answers for the current round.
    /// </summary>
    public async Task SubmitAnswers(SubmitAnswersRequest request)
    {
        // Validate request
        if (request == null)
            throw new HubException("Answer submission is required.");
        if (request.Answers == null || request.Answers.Length == 0)
            throw new HubException("At least one answer is required.");
        if (request.Answers.Length > 50)
            throw new HubException("Too many answers submitted (maximum 50).");

        foreach (var answer in request.Answers)
        {
            if (string.IsNullOrWhiteSpace(answer.Text))
                throw new HubException("Answer text cannot be empty.");
            if (answer.Text.Length > 500)
                throw new HubException("Answer text is too long (maximum 500 characters).");
        }

        var httpContext = Context.GetHttpContext();
        var isAuth = httpContext?.User?.Identity?.IsAuthenticated == true;

        Guid gameId;
        string? playerName = null;
        Guid? teamId = null;
        string gameIdForBroadcast;
        Guid playerIdForCommand;

        if (isAuth)
        {
            // JWT-authenticated: resolve player from DB
            var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var name = httpContext.User.FindFirst(ClaimTypes.Name)?.Value;
            playerName = name;

            if (string.IsNullOrEmpty(userIdClaim))
                throw new InvalidOperationException("User ID not found in token.");

            Guid.Parse(userIdClaim); // validate early

            var user = await _dbContext.UserAccounts
                .Include(u => u.Players)
                .FirstOrDefaultAsync(u => u.Id.ToString() == userIdClaim);

            if (user == null)
                throw new InvalidOperationException("User not found.");

            var gameCode = GetGameCodeForConnection();
            if (string.IsNullOrEmpty(gameCode))
                throw new InvalidOperationException("Player not in a game.");

            var game = await _dbContext.Games.FirstOrDefaultAsync(g => g.Code == gameCode);
            if (game == null)
                throw new InvalidOperationException("Game not found.");

            var player = user.Players.FirstOrDefault(p => p.GameId == game.Id)
                ?? user.Players.FirstOrDefault();
            if (player == null)
                throw new InvalidOperationException("Player not in game.");

            gameId = game.Id;
            teamId = player.TeamId;
            gameIdForBroadcast = gameCode;
            playerIdForCommand = Guid.Parse(userIdClaim);
        }
        else
        {
            // Guest: use StubCurrentPlayer
            var stub = _currentPlayer;
            if (stub.PlayerId == null)
                throw new InvalidOperationException("Player not authenticated.");

            gameId = stub.GameId ?? Guid.Empty;
            playerName = stub.PlayerName;
            teamId = stub.TeamId;
            gameIdForBroadcast = GetGameCodeForConnection();
            playerIdForCommand = stub.PlayerId!.Value;
        }

        await _mediator.Send(new SubmitAnswersCommand(
            gameId,
            playerIdForCommand,
            request.RoundId,
            request.Answers.Select(a => new AnswerSubmission(a.CategoryId, a.Text)).ToArray()
        ));

        // Notify all players that this player has submitted
        await Clients.Group(gameIdForBroadcast).SendAsync("AnswerSubmitted", new
        {
            PlayerName = playerName,
            PlayerTeam = teamId,
            SubmittedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Host triggers reveal and scoring.
    /// </summary>
    public async Task RevealAndScore(string gameCode)
    {
        var httpContext = Context.GetHttpContext();
        if (!await IsPlayerHost(httpContext, gameCode))
            throw new HubException("Only the host can reveal and score.");

        var game = await GetGame(gameCode.ToUpper());
        if (game == null)
            throw new UnauthorizedAccessException("Game not found.");

        var result = await _mediator.Send(new RevealAndScoreCommand(game.Id));

        await Clients.Group(gameCode.ToUpper()).SendAsync("AnswersRevealed", result.Scores);
        await Clients.Group(gameCode.ToUpper()).SendAsync("ScoringComplete", result.Scores);
        await Clients.Group(gameCode.ToUpper()).SendAsync("RoundComplete", new
        {
            RoundNumber = result.RoundNumber,
            NextRoundAvailable = result.RoundNumber < 9
        });

        await Clients.Group(gameCode.ToUpper()).SendAsync("LobbyUpdated", await GetGameDto(gameCode.ToUpper()));
    }

    /// <summary>
    /// Host advances to the next round.
    /// </summary>
    public async Task BeginNextRound(string gameCode)
    {
        var httpContext = Context.GetHttpContext();
        if (!await IsPlayerHost(httpContext, gameCode))
            throw new HubException("Only the host can begin the next round.");

        var game = await GetGame(gameCode.ToUpper());
        if (game == null)
            throw new UnauthorizedAccessException("Game not found.");

        var result = await _mediator.Send(new BeginRoundCommand(game.Id));

        await Clients.Group(gameCode.ToUpper()).SendAsync("RoundStarted", new
        {
            RoundNumber = result.RoundNumber,
            Letter = result.Letter,
            TimerSeconds = result.TimerSeconds,
            Categories = result.Categories
        });

        // Start timer - clients will handle countdown
        for (var remaining = result.TimerSeconds; remaining > 0; remaining -= 5)
        {
            await Task.Delay(TimeSpan.FromSeconds(5));
            await Clients.Group(gameCode.ToUpper()).SendAsync("TimerTick", new
            {
                RemainingSeconds = Math.Max(remaining, 0),
                TotalSeconds = result.TimerSeconds
            });
        }

        // Timer up
        await Clients.Group(gameCode.ToUpper()).SendAsync("TimeUp", new
        {
            RoundNumber = game.CurrentRoundNumber,
            Letter = result.Letter
        });

        await Clients.Group(gameCode.ToUpper()).SendAsync("LobbyUpdated", await GetGameDto(gameCode.ToUpper()));
    }

    /// <summary>
    /// Client disconnects from a game room.
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Remove connection tracking
        if (_connectionToGame.TryRemove(Context.ConnectionId, out var gameCode))
        {
            if (!string.IsNullOrEmpty(gameCode) && _gameConnections.TryGetValue(gameCode, out var connections))
            {
                connections.Remove(Context.ConnectionId);
                if (connections.Count == 0)
                {
                    _gameConnections.TryRemove(gameCode, out _);
                }
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, gameCode);
            await Clients.Group(gameCode).SendAsync("PlayerLeft", new
            {
                ConnectionId = Context.ConnectionId
            });
        }
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Checks if the authenticated user in the given HttpContext is the host of the specified game.
    /// </summary>
    private async Task<bool> IsPlayerHost(HttpContext? httpContext, string gameCode)
    {
        var userIdClaim = httpContext?.User?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return false;

        var game = await _dbContext.Games
            .Include(g => g.Players)
            .FirstOrDefaultAsync(g => g.Code == gameCode);

        return game?.Players.Any(p => p.UserId == userId && p.IsHost) == true;
    }

    // --- Private Helpers ---

    private async Task<GetGameDto> GetGameDto(string gameCode)
    {
        return await _mediator.Send(new GetGameQuery(gameCode));
    }

    private async Task<Scattergories.Domain.Entities.Game?> GetGame(string gameCode)
    {
        return await _dbContext.Games.FirstOrDefaultAsync(g => g.Code == gameCode);
    }

    private string GetGameCodeForConnection()
    {
        _connectionToGame.TryGetValue(Context.ConnectionId, out var gameCode);
        return gameCode ?? string.Empty;
    }
}

// Request DTO for SignalR submissions
public record SubmitAnswersRequest(
    Guid RoundId,
    AnswerRequest[] Answers
);

public record AnswerRequest(
    Guid CategoryId,
    string Text
);
