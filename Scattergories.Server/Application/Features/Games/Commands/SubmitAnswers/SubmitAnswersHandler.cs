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
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.PlayerId, cancellationToken);

        if (player == null)
            throw new ScattergoriesException("Player not found.");

        // Ensure player belongs to this game (prevent cross-game answer submission)
        if (player.GameId != request.GameId)
            throw new ScattergoriesException("Player does not belong to this game.");

        // Check for duplicate answers in this round from the same player
        var existingAnswers = await _context.Answers
            .Where(a => a.PlayerId == request.PlayerId && a.RoundId == round.Id)
            .Select(a => a.CategoryId)
            .ToListAsync(cancellationToken);

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
            if (existingAnswers.Contains(submission.CategoryId))
                continue; // Duplicate submission for same category

            var answer = new Answer(player.Id, round.Id, submission.CategoryId, normalizedText);
            _context.Answers.Add(answer);
            existingAnswers.Add(submission.CategoryId);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
