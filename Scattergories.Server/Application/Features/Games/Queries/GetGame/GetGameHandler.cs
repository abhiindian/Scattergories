using MediatR;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Application.Features.Games.Queries.GetGame;

namespace Scattergories.Application.Features.Games.Queries.GetGame;

/// <summary>
/// Handler for getting game state.
/// Returns a fully populated DTO with all related data.
/// </summary>
public class GetGameHandler : IRequestHandler<GetGameQuery, GetGameDto>
{
    private readonly IApplicationDbContext _context;

    public GetGameHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<GetGameDto> Handle(GetGameQuery request, CancellationToken cancellationToken)
    {
        var game = await _context.Games
            .Include(g => g.Players)
            .Include(g => g.Teams)
            .Include(g => g.Rounds)
                .ThenInclude(r => r.RoundCategories)
                .ThenInclude(rc => rc.Category)
            .Include(g => g.Rounds)
                .ThenInclude(r => r.Answers)
                .ThenInclude(a => a.Player)
                .ThenInclude(p => p.Team)
            .Include(g => g.Rounds)
                .ThenInclude(r => r.Answers)
                .ThenInclude(a => a.Category)
            .FirstOrDefaultAsync(g => g.Code == request.GameCode, cancellationToken);

        if (game == null)
            throw new Domain.Exceptions.ScattergoriesException($"Game with code '{request.GameCode}' not found.");

        var currentRound = game.Rounds
            .Where(r => r.RoundNumber <= game.CurrentRoundNumber)
            .OrderByDescending(r => r.RoundNumber)
            .FirstOrDefault();

        var roundDto = currentRound != null ? new RoundDto(
            currentRound.Id,
            currentRound.RoundNumber,
            currentRound.Letter,
            currentRound.State,
            currentRound.RoundCategories
                .Select(rc => new CategoryDto(rc.Category!.Id, rc.Category.Name, rc.Category.DisplayOrder))
                .ToArray()
        ) : null;

        var players = game.Players.Select(p => new PlayerDto(
            p.Id,
            p.Name,
            p.TeamId,
            p.IsHost,
            p.TotalScore
        )).ToArray();

        var teams = game.Teams.Select(t => new TeamDto(
            t.Id,
            t.Name,
            t.TeamScore
        )).ToArray();

        var settings = new GameSettingsDto(
            game.RoundCount,
            game.TimerSeconds,
            game.PointsPerAnswer,
            game.AllowPlurals,
            game.AllowProperNouns,
            game.AllowOffensiveWords
        );

        return new GetGameDto(
            game.Id,
            game.Code,
            game.GameState,
            roundDto,
            players,
            teams,
            settings
        );
    }
}
