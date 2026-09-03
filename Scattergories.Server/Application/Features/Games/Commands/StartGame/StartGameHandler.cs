using MediatR;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Domain.Entities;
using Scattergories.Domain.Enums;
using Scattergories.Domain.Exceptions;

namespace Scattergories.Application.Features.Games.Commands.StartGame;

/// <summary>
/// Handler for starting a game.
/// Creates the rounds and associates the default categories with each round.
/// </summary>
public class StartGameHandler : IRequestHandler<StartGameCommand>
{
    private readonly IApplicationDbContext _context;

    public StartGameHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(StartGameCommand request, CancellationToken cancellationToken)
    {
        var game = await _context.Games
            .Include(g => g.Players)
            .Include(g => g.Teams)
            .Include(g => g.Categories)
            .Include(g => g.Rounds)
            .ThenInclude(r => r.RoundCategories)
                .ThenInclude(rc => rc.Category)
            .Include(g => g.Rounds)
            .ThenInclude(r => r.Answers)
                .ThenInclude(a => a.Player)
            .Include(g => g.Rounds)
            .ThenInclude(r => r.Answers)
                .ThenInclude(a => a.Category)
            .FirstOrDefaultAsync(g => g.Id == request.GameId, cancellationToken);

        if (game == null)
            throw new ScattergoriesException("Game not found.");

        if (game.GameState != GameState.Lobby)
            throw new ScattergoriesException($"Game is in state {game.GameState}. Cannot start from this state.");

        if (game.Players.Count < 1)
            throw new ScattergoriesException("At least one player is required to start the game.");

        game.GameState = GameState.RoundRunning;
        game.CurrentRoundNumber = 1;

        // Create rounds and link categories
        for (int i = 1; i <= game.RoundCount; i++)
        {
            var round = new Round(i, string.Empty)
            {
                GameId = game.Id,
                State = RoundState.Waiting
            };

            foreach (var category in game.Categories)
            {
                round.RoundCategories.Add(new RoundCategory
                {
                    RoundId = round.Id,
                    CategoryId = category.Id
                });
            }

            game.Rounds.Add(round);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
