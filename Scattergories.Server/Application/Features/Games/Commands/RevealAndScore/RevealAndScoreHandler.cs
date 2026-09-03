using MediatR;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Domain.Entities;
using Scattergories.Domain.Exceptions;
using Scattergories.Domain.Services;

namespace Scattergories.Application.Features.Games.Commands.RevealAndScore;

/// <summary>
/// Handler for revealing and scoring a round.
/// Scores the round, persists changes, and returns the result.
/// </summary>
public class RevealAndScoreHandler : IRequestHandler<RevealAndScoreCommand, RevealAndScoreResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IScoringService _scoringService;

    public RevealAndScoreHandler(IApplicationDbContext context, IScoringService scoringService)
    {
        _context = context;
        _scoringService = scoringService;
    }

    public async Task<RevealAndScoreResult> Handle(RevealAndScoreCommand request, CancellationToken cancellationToken)
    {
        var game = await _context.Games
            .Include(g => g.Teams)
            .Include(g => g.Rounds)
                .ThenInclude(r => r.RoundCategories)
                .ThenInclude(rc => rc.Category)
            .Include(g => g.Rounds)
                .ThenInclude(r => r.Answers)
                .ThenInclude(a => a.Player)
                .ThenInclude(p => p.Team)
            .Include(g => g.Rounds)
                .ThenInclude(r => r.Answers)
                .ThenInclude(a => a.Category)
            .FirstOrDefaultAsync(g => g.Id == request.GameId, cancellationToken);

        if (game == null)
            throw new ScattergoriesException("Game not found.");

        var round = game.Rounds.FirstOrDefault(r => r.RoundNumber == game.CurrentRoundNumber);
        if (round == null)
            throw new ScattergoriesException("Current round not found.");

        var result = await _scoringService.ScoreRound(game, round);

        // Persist changes
        await _context.SaveChangesAsync(cancellationToken);

        // Map to DTO
        var scores = result.Scores.Select(s => new ScoredAnswerDto(
            s.AnswerId,
            s.PlayerId,
            s.PlayerName,
            s.TeamId,
            s.TeamName,
            s.CategoryId,
            s.CategoryName,
            s.AnswerText,
            s.IsValid,
            s.IsUnique,
            s.Points
        )).ToArray();

        return new RevealAndScoreResult(round.Id, round.RoundNumber, round.Letter, scores);
    }
}
