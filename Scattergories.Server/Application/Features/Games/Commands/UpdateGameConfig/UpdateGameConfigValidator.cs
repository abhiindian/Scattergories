using FluentValidation;

namespace Scattergories.Application.Features.Games.Commands.UpdateGameConfig;

public class UpdateGameConfigValidator : AbstractValidator<UpdateGameConfigCommand>
{
    public UpdateGameConfigValidator()
    {
        RuleFor(x => x.GameCode).NotEmpty();
        RuleFor(x => x.RoundCount).InclusiveBetween(1, 15);
        RuleFor(x => x.TimerSeconds).InclusiveBetween(30, 600);
        RuleFor(x => x.PointsPerAnswer).GreaterThan(0);
    }
}

