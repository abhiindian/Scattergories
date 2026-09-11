using MediatR;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Domain.Entities;
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
        var game = await _context.Games
            .Include(g => g.Categories)
            .FirstOrDefaultAsync(g => g.Code == request.GameCode, cancellationToken);
            
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

        if (request.Categories != null && request.Categories.Any())
        {
            game.Categories.Clear();
            int order = 1;
            foreach (var catName in request.Categories)
            {
                var trimmed = catName.Trim();
                if (string.IsNullOrWhiteSpace(trimmed)) continue;
                
                var existing = await _context.Categories.FirstOrDefaultAsync(c => c.Name == trimmed, cancellationToken);
                if (existing != null)
                {
                    game.Categories.Add(existing);
                }
                else
                {
                    var newCat = new Category(trimmed, order);
                    _context.Categories.Add(newCat);
                    game.Categories.Add(newCat);
                }
                order++;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
