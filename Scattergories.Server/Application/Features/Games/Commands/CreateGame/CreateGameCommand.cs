using MediatR;

namespace Scattergories.Application.Features.Games.Commands.CreateGame;

/// <summary>
/// Command to create a new Scattergories game.
/// </summary>
public record CreateGameCommand(
    int RoundCount = 9,
    int TimerSeconds = 180,
    int PointsPerAnswer = 10,
    bool AllowPlurals = false,
    bool AllowProperNouns = false,
    bool AllowOffensiveWords = false
) : IRequest<string>;  // Returns the game code
