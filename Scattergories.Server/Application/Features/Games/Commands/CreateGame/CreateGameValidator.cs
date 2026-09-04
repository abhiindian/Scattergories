using FluentValidation;

namespace Scattergories.Application.Features.Games.Commands.CreateGame;

public class CreateGameValidator : AbstractValidator<CreateGameCommand>
{
    public CreateGameValidator()
    {
        RuleFor(x => x.RoundCount)
            .InclusiveBetween(1, 9)
            .WithMessage("RoundCount must be between 1 and 9.");

        RuleFor(x => x.TimerSeconds)
            .InclusiveBetween(30, 900)
            .WithMessage("TimerSeconds must be between 30 and 900.");

        RuleFor(x => x.PointsPerAnswer)
            .InclusiveBetween(1, 100)
            .WithMessage("PointsPerAnswer must be between 1 and 100.");
    }
}
