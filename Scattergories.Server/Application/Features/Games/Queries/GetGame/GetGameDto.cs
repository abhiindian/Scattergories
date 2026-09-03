using Scattergories.Domain.Enums;

namespace Scattergories.Application.Features.Games.Queries.GetGame;

/// <summary>
/// DTO for returning full game state to the frontend.
/// </summary>
public record GetGameDto(
    Guid Id,
    string Code,
    GameState GameState,
    RoundDto? CurrentRound,
    PlayerDto[] Players,
    TeamDto[] Teams,
    GameSettingsDto Settings
);

public record RoundDto(
    Guid Id,
    int RoundNumber,
    string Letter,
    RoundState State,
    CategoryDto[] Categories
);

public record PlayerDto(
    Guid Id,
    string Name,
    Guid? TeamId,
    bool IsHost,
    int TotalScore
);

public record TeamDto(
    Guid Id,
    string Name,
    int TeamScore
);

public record GameSettingsDto(
    int RoundCount,
    int TimerSeconds,
    int PointsPerAnswer,
    bool AllowPlurals,
    bool AllowProperNouns,
    bool AllowOffensiveWords
);

/// <summary>
/// Shared CategoryDto for use across application features.
/// </summary>
public record CategoryDto(
    Guid Id,
    string Name,
    int DisplayOrder
);
