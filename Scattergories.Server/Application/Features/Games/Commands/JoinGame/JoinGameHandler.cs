using MediatR;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Domain.Entities;
using Scattergories.Domain.Enums;
using Scattergories.Domain.Exceptions;

namespace Scattergories.Application.Features.Games.Commands.JoinGame;

/// <summary>
/// Handler for joining an existing game.
/// The first player joining becomes the host (set during game creation).
/// </summary>
public class JoinGameHandler : IRequestHandler<JoinGameCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public JoinGameHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(JoinGameCommand request, CancellationToken cancellationToken)
    {
        // Validate game existence and state in a single query
        var game = await _context.Games
            .Include(g => g.Players)
            .FirstOrDefaultAsync(g => g.Code == request.GameCode, cancellationToken);

        if (game == null)
            throw new ScattergoriesException($"Game with code '{request.GameCode}' not found.");

        if (game.GameState != GameState.Lobby)
            throw new ScattergoriesException("This game has already started.");

        // Check for duplicate player name within this game (prevent same-name collisions)
        if (game.Players.Any(p => p.Name.Equals(request.PlayerName, StringComparison.OrdinalIgnoreCase)))
            throw new ScattergoriesException("A player with this name already exists in the game.");

        // First player joining becomes the host
        var isFirstPlayer = !game.Players.Any();

        // Add player directly to Players DbSet (EF tracks new entities as Added by convention)
        var player = new Player(request.PlayerName, isHost: isFirstPlayer)
        {
            GameId = game.Id
        };

        await _context.Players.AddAsync(player, cancellationToken);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException)
        {
            // Fallback for concurrent join attempts where the UNIQUE constraint
            // on Player.Name catches a duplicate that the in-memory check missed
            throw new ScattergoriesException("A player with this name already exists in the game.");
        }

        return player.Id;
    }
}
