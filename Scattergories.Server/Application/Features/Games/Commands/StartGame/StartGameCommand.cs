using MediatR;

namespace Scattergories.Application.Features.Games.Commands.StartGame;

/// <summary>
/// Command to start the game (transition from Lobby to the first round).
/// </summary>
public record StartGameCommand(
    Guid GameId
) : IRequest;
