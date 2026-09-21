namespace Scattergories.Application.Features.Games.Commands.RoundTimeUp;

/// <summary>
/// Result of the round time-up operation.
/// </summary>
public record RoundTimeUpResult(
    Guid RoundId,
    int RoundNumber,
    string Letter,
    Application.Features.Games.Commands.RevealAndScore.ScoredAnswerDto[] Scores,
    bool NextRoundAvailable
);
