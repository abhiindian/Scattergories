using MediatR;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Application.Features.Games.Commands.RevealAndScore;
using Scattergories.Domain.Entities;
using Scattergories.Domain.Enums;
using Scattergories.Domain.Exceptions;
using Scattergories.Domain.Services;

namespace Scattergories.Application.Features.Games.Commands.RoundTimeUp;

/// <summary>
/// Handler for round time-up.
/// Ensures every player has an answer entry and scores the round.
/// The next round is started by the hub method or REST endpoint after this completes.
/// </summary>
public class RoundTimeUpHandler : IRequestHandler<RoundTimeUpCommand, RoundTimeUpResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IScoringService _scoringService;

    public RoundTimeUpHandler(
        IApplicationDbContext context,
        IScoringService scoringService)
    {
        _context = context;
        _scoringService = scoringService;
    }

    public async Task<RoundTimeUpResult> Handle(RoundTimeUpCommand request, CancellationToken cancellationToken)
    {
        var game = await _context.Games
            .Include(g => g.Rounds)
                .ThenInclude(r => r.RoundCategories)
                .ThenInclude(rc => rc.Category)
            .Include(g => g.Rounds)
                .ThenInclude(r => r.Answers)
                .ThenInclude(a => a.Player)
                .ThenInclude(p => p.Team)
            .Include(g => g.Players)
            .Include(g => g.Teams)
            .Include(g => g.Categories)
            .FirstOrDefaultAsync(g => g.Id == request.GameId, cancellationToken);

        if (game == null)
            throw new ScattergoriesException("Game not found.");

        var round = game.Rounds.FirstOrDefault(r => r.RoundNumber == game.CurrentRoundNumber);
        if (round == null)
            throw new ScattergoriesException("Current round not found.");

        // Ensure every player has at least one answer entry for this round
        // (answers without text will be marked invalid during scoring)
        await EnsurePlayerAnswers(game, round, cancellationToken);

        // Score the round using the existing three-phase scoring service
        var scoringResult = await _scoringService.ScoreRound(game, round);

        // Persist scoring changes
        await _context.SaveChangesAsync(cancellationToken);

        // Map scores to DTO
        var scores = scoringResult.Scores.Select(s => new ScoredAnswerDto(
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

        // Check if game is finished
        var isFinished = game.CurrentRoundNumber >= game.RoundCount;

        if (isFinished)
        {
            game.GameState = GameState.Finished;
            game.FinishedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return new RoundTimeUpResult(
            round.Id,
            round.RoundNumber,
            round.Letter,
            scores,
            !isFinished
        );
    }

    private async Task EnsurePlayerAnswers(Game game, Round round, CancellationToken cancellationToken)
    {
        var submittedPlayerIds = await _context.Answers
            .Where(a => a.RoundId == round.Id)
            .Select(a => a.PlayerId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var player in game.Players)
        {
            if (submittedPlayerIds.Contains(player.Id))
                continue;

            // Player has no answers for this round — create empty entries per category
            var roundCategories = round.RoundCategories
                .Where(rc => rc.Category != null)
                .ToList();

            foreach (var rc in roundCategories)
            {
                player.Answers.Add(new Answer(player.Id, round.Id, rc.CategoryId, string.Empty));
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
