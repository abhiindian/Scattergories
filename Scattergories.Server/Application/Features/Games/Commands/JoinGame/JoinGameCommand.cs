using MediatR;

namespace Scattergories.Application.Features.Games.Commands.JoinGame;

/// <summary>
/// Command to join an existing game.
/// </summary>
public record JoinGameCommand(
    string GameCode,
    string PlayerName
) : IRequest<Guid>;  // Returns the player ID
