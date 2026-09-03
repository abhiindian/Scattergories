using MediatR;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Application.Features.Games.Queries.GetGame;
using Scattergories.Domain.Enums;
using Scattergories.Domain.Exceptions;
using Scattergories.Domain.Services;

namespace Scattergories.Application.Features.Games.Commands.BeginRound;

/// <summary>
/// Handler for beginning a round.
/// Picks the next unused letter and broadcasts to all clients.
/// </summary>
public class BeginRoundHandler : IRequestHandler<BeginRoundCommand, BeginRoundResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ILetterService _letterService;

    public BeginRoundHandler(IApplicationDbContext context, ILetterService letterService)
    {
        _context = context;
        _letterService = letterService;
    }

    public async Task<BeginRoundResult> Handle(BeginRoundCommand request, CancellationToken cancellationToken)
    {
        var game = await _context.Games
            .Include(g => g.Rounds)
                .ThenInclude(r => r.RoundCategories)
                .ThenInclude(rc => rc.Category)
            .Include(g => g.Categories)
            .FirstOrDefaultAsync(g => g.Id == request.GameId, cancellationToken);

        if (game == null)
            throw new ScattergoriesException("Game not found.");

        if (game.GameState != GameState.RoundRunning && game.GameState != GameState.Answering && game.GameState != GameState.Revealing)
            throw new ScattergoriesException($"Cannot begin a round in state {game.GameState}.");

        // Pick a new letter
        var letter = _letterService.GetNextLetter(game);

        // Update or create the current round
        var round = game.Rounds.FirstOrDefault(r => r.RoundNumber == game.CurrentRoundNumber);
        if (round != null)
        {
            round.Letter = letter.ToString();
            round.State = RoundState.Running;
            round.StartedAt = DateTime.UtcNow;
        }

        // Persist round changes
        await _context.SaveChangesAsync(cancellationToken);

        // Broadcast the round info to clients
        var categories = game.Categories
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new CategoryDto(
                c.Id,
                c.Name,
                c.DisplayOrder
            ))
            .ToArray();

        return new BeginRoundResult(
            game.CurrentRoundNumber,
            letter.ToString(),
            game.TimerSeconds,
            categories
        );
    }
}
