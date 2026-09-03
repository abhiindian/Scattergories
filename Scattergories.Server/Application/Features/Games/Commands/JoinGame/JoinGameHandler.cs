using MediatR;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Domain.Entities;
using Scattergories.Domain.Enums;
using Scattergories.Domain.Exceptions;

namespace Scattergories.Application.Features.Games.Commands.JoinGame;

/// <summary>
/// Handler for joining an existing game.
/// The first player joining becomes the host.
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
        var game = await _context.Games
            .Include(g => g.Players)
            .ThenInclude(p => p.Team)
            .FirstOrDefaultAsync(g => g.Code == request.GameCode, cancellationToken);

        if (game == null)
            throw new ScattergoriesException($"Game with code '{request.GameCode}' not found.");

        if (game.GameState != GameState.Lobby)
            throw new ScattergoriesException("This game has already started.");

        var player = new Player(request.PlayerName)
        {
            GameId = game.Id
        };

        // First player becomes the host
        if (!game.Players.Any())
        {
            player.IsHost = true;
            game.StartedAt = DateTime.UtcNow;
        }

        game.Players.Add(player);
        await _context.SaveChangesAsync(cancellationToken);

        return player.Id;
    }
}
