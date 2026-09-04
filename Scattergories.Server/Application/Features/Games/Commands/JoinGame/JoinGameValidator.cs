using FluentValidation;

namespace Scattergories.Application.Features.Games.Commands.JoinGame;

public class JoinGameValidator : AbstractValidator<JoinGameCommand>
{
    public JoinGameValidator()
    {
        RuleFor(x => x.GameCode)
            .NotEmpty()
            .MaximumLength(10)
            .WithMessage("GameCode is required and must not exceed 10 characters.")
            .Matches("^[A-Z0-9]+$")
            .WithMessage("GameCode must contain only uppercase letters and digits.");

        RuleFor(x => x.PlayerName)
            .NotEmpty()
            .MaximumLength(50)
            .WithMessage("PlayerName is required and must not exceed 50 characters.")
            .Matches("^[a-zA-Z0-9 _-]+$")
            .WithMessage("PlayerName can only contain letters, digits, spaces, hyphens, and underscores.");
    }
}
