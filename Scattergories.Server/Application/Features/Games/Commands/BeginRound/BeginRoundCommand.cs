using MediatR;
using Scattergories.Application.Features.Games.Queries.GetGame;

namespace Scattergories.Application.Features.Games.Commands.BeginRound;

/// <summary>
/// Command to begin a round (pick letter, set timer).
/// </summary>
public record BeginRoundCommand(
    Guid GameId
) : IRequest<BeginRoundResult>;

public record BeginRoundResult(
    int RoundNumber,
    string Letter,
    int TimerSeconds,
    CategoryDto[] Categories
);
