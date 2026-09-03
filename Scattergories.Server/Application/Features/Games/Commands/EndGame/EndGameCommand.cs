using MediatR;

namespace Scattergories.Application.Features.Games.Commands.EndGame;

/// <summary>
/// Command to end a game and show the final scoreboard.
/// </summary>
public record EndGameCommand(
    Guid GameId
) : IRequest<EndGameResult>;

public record EndGameResult(
    FinalScoreDto[] Standings,
    string WinnerName
);

public record FinalScoreDto(
    Guid Id,
    string Name,
    bool IsTeam,
    int TotalScore
);
