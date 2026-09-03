using MediatR;

namespace Scattergories.Application.Features.Games.Commands.SubmitAnswers;

/// <summary>
/// Command to submit answers for a round.
/// </summary>
public record SubmitAnswersCommand(
    Guid GameId,
    Guid PlayerId,
    Guid RoundId,
    AnswerSubmission[] Answers
) : IRequest<Unit>;

public record AnswerSubmission(
    Guid CategoryId,
    string Text
);
