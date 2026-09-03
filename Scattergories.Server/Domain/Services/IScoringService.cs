namespace Scattergories.Domain.Services;

/// <summary>
/// Service responsible for scoring answers after time is up.
/// Handles validation, uniqueness detection, and point calculation.
/// </summary>
public interface IScoringService
{
    /// <summary>
    /// Scores all answers for a round and updates the game state.
    /// </summary>
    Task<ScoringResult> ScoreRound(Domain.Entities.Game game, Domain.Entities.Round round);
}

public record ScoringResult(
    Guid RoundId,
    List<ScoredAnswer> Scores,
    IReadOnlyDictionary<Guid, int> PlayerTotals,
    IReadOnlyDictionary<Guid, int> TeamTotals
);

public record ScoredAnswer(
    Guid AnswerId,
    Guid PlayerId,
    string PlayerName,
    Guid? TeamId,
    string? TeamName,
    Guid CategoryId,
    string CategoryName,
    string AnswerText,
    bool IsValid,
    bool IsUnique,
    int Points
);
