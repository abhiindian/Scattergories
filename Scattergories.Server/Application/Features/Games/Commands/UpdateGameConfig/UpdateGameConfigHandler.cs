using MediatR;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Domain.Enums;

namespace Scattergories.Application.Features.Games.Commands.UpdateGameConfig;

public class UpdateGameConfigHandler : IRequestHandler<UpdateGameConfigCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateGameConfigHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateGameConfigCommand request, CancellationToken cancellationToken)
    {
        var game = await _context.Games.FirstOrDefaultAsync(g => g.Code == request.GameCode, cancellationToken);
        if (game == null)
            throw new Exception("Game not found");
            
        if (game.GameState != GameState.Lobby)
            throw new Exception("Can only edit config in lobby");

        game.RoundCount = request.RoundCount;
        game.TimerSeconds = request.TimerSeconds;
        game.PointsPerAnswer = request.PointsPerAnswer;
        game.AllowPlurals = request.AllowPlurals;
        game.AllowProperNouns = request.AllowProperNouns;
        game.AllowOffensiveWords = request.AllowOffensiveWords;

        await _context.SaveChangesAsync(cancellationToken);
    }
}

