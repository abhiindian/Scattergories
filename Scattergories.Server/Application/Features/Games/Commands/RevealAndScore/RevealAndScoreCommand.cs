using MediatR;

namespace Scattergories.Application.Features.Games.Commands.RevealAndScore;

/// <summary>
/// Command to reveal all answers and score the current round.
/// </summary>
public record RevealAndScoreCommand(
    Guid GameId
) : IRequest<RevealAndScoreResult>;

public record RevealAndScoreResult(
    Guid RoundId,
    int RoundNumber,
    string Letter,
    ScoredAnswerDto[] Scores
);

public record ScoredAnswerDto(
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
