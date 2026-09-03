using MediatR;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Domain.Enums;
using Scattergories.Domain.Exceptions;

namespace Scattergories.Application.Features.Games.Commands.EndGame;

/// <summary>
/// Handler for ending a game.
/// Computes final standings and sets game state to Finished.
/// </summary>
public class EndGameHandler : IRequestHandler<EndGameCommand, EndGameResult>
{
    private readonly IApplicationDbContext _context;

    public EndGameHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EndGameResult> Handle(EndGameCommand request, CancellationToken cancellationToken)
    {
        var game = await _context.Games
            .Include(g => g.Teams)
            .Include(g => g.Players)
                .ThenInclude(p => p.Team)
            .FirstOrDefaultAsync(g => g.Id == request.GameId, cancellationToken);

        if (game == null)
            throw new ScattergoriesException("Game not found.");

        if (game.GameState == GameState.Finished)
            throw new ScattergoriesException("Game is already finished.");

        game.GameState = GameState.Finished;
        game.FinishedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        // Compute standings: teams first (by TeamScore), then solo players (by TotalScore)
        var standings = new List<FinalScoreDto>();

        // Teams sorted by score descending
        var teamScores = game.Teams
            .Select(t => new FinalScoreDto(t.Id, t.Name, true, t.TeamScore))
            .OrderByDescending(s => s.TotalScore);

        // Solo players (those without a team)
        var soloScores = game.Players
            .Where(p => p.TeamId == null)
            .Select(p => new FinalScoreDto(p.Id, p.Name, false, p.TotalScore))
            .OrderByDescending(s => s.TotalScore);

        standings.AddRange(teamScores);
        standings.AddRange(soloScores);

        // Sort everything together by score
        standings = standings.OrderByDescending(s => s.TotalScore).ToList();

        var winnerName = standings.Any() ? standings[0].Name : "No one";

        return new EndGameResult(standings.ToArray(), winnerName);
    }
}
