using MediatR;

namespace Scattergories.Application.Features.Games.Commands.UpdateGameConfig;

/// <summary>
/// Command to update the configuration of a Scattergories game.
/// </summary>
public record UpdateGameConfigCommand(
    string GameCode,
    int RoundCount,
    int TimerSeconds,
    int PointsPerAnswer,
    bool AllowPlurals,
    bool AllowProperNouns,
    bool AllowOffensiveWords
) : IRequest;

