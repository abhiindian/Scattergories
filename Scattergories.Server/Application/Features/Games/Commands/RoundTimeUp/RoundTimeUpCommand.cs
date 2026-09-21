using MediatR;

namespace Scattergories.Application.Features.Games.Commands.RoundTimeUp;

/// <summary>
/// Command triggered when the round timer expires.
/// Auto-creates answers for players who submitted nothing, scores the round,
/// and begins the next round (or ends the game).
/// </summary>
public record RoundTimeUpCommand(
    Guid GameId
) : IRequest<RoundTimeUpResult>;
