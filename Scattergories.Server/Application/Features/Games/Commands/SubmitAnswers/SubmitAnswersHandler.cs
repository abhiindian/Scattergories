using MediatR;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Domain.Entities;
using Scattergories.Domain.Enums;
using Scattergories.Domain.Exceptions;
using Scattergories.Domain.Services;

namespace Scattergories.Application.Features.Games.Commands.SubmitAnswers;

/// <summary>
/// Handler for submitting answers.
/// Validates that answers start with the round letter and persist them.
/// </summary>
public class SubmitAnswersHandler : IRequestHandler<SubmitAnswersCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly IWordFilterService _wordFilter;

    public SubmitAnswersHandler(IApplicationDbContext context, IWordFilterService wordFilter)
    {
        _context = context;
        _wordFilter = wordFilter;
    }

    public async Task<Unit> Handle(SubmitAnswersCommand request, CancellationToken cancellationToken)
    {
        var game = await _context.Games
            .Include(g => g.Rounds)
                .ThenInclude(r => r.RoundCategories)
                .ThenInclude(rc => rc.Category)
            .FirstOrDefaultAsync(g => g.Id == request.GameId &&
                (g.GameState == GameState.RoundRunning || g.GameState == GameState.Answering), cancellationToken);

        if (game == null)
            throw new ScattergoriesException("Game not found or not in the correct state for answer submission.");

        var round = game.Rounds.FirstOrDefault(r => r.Id == request.RoundId);
        if (round == null)
            throw new ScattergoriesException("Round not found.");

        var player = await _context.Players
            .Include(p => p.Answers)
            .FirstOrDefaultAsync(p => p.Id == request.PlayerId, cancellationToken);

        if (player == null)
            throw new ScattergoriesException("Player not found.");

        // Ensure player belongs to this game (prevent cross-game answer submission)
        if (player.GameId != request.GameId)
            throw new ScattergoriesException("Player does not belong to this game.");

        // Validate no duplicate answers from the same player in the same round
        var existingAnswers = player.Answers.Where(a => a.RoundId == round.Id).ToList();

        foreach (var submission in request.Answers)
        {
            // Skip empty submissions
            if (string.IsNullOrWhiteSpace(submission.Text))
                continue;

            var normalizedText = submission.Text.Trim();
            var normalizedLetter = round.Letter.ToUpperInvariant();

            if (!normalizedText.StartsWith(normalizedLetter))
                continue; // Will be marked invalid during scoring

            // Check if player already submitted for this category in this round
            if (existingAnswers.Any(a => a.CategoryId == submission.CategoryId))
                continue; // Duplicate submission for same category

            var answer = new Answer(player.Id, round.Id, submission.CategoryId, normalizedText);
            player.Answers.Add(answer);
            existingAnswers.Add(answer);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
