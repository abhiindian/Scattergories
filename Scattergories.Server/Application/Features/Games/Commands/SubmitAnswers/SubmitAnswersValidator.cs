using FluentValidation;

namespace Scattergories.Application.Features.Games.Commands.SubmitAnswers;

public class SubmitAnswersValidator : AbstractValidator<SubmitAnswersCommand>
{
    public SubmitAnswersValidator()
    {
        RuleFor(x => x.GameId)
            .NotEmpty()
            .WithMessage("GameId is required.");

        RuleFor(x => x.PlayerId)
            .NotEmpty()
            .WithMessage("PlayerId is required.");

        RuleFor(x => x.RoundId)
            .NotEmpty()
            .WithMessage("RoundId is required.");

        RuleFor(x => x.Answers)
            .NotEmpty()
            .WithMessage("At least one answer is required.");

        RuleFor(x => x.Answers)
            .Must(answers => answers.Distinct().Count() == answers.Length)
            .WithMessage("Duplicate answer submissions are not allowed.");
    }
}
