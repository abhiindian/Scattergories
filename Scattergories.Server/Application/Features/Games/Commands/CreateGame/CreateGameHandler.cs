using MediatR;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Domain.Entities;
using Scattergories.Domain.Enums;

namespace Scattergories.Application.Features.Games.Commands.CreateGame;

/// <summary>
/// Handler for creating a new game.
/// Generates a unique game code and sets initial state to Lobby.
/// </summary>
public class CreateGameHandler : IRequestHandler<CreateGameCommand, string>
{
    private readonly IApplicationDbContext _context;

    public CreateGameHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string> Handle(CreateGameCommand request, CancellationToken cancellationToken)
    {
        var code = GenerateUniqueCode();
        var game = new Domain.Entities.Game(code)
        {
            RoundCount = request.RoundCount,
            TimerSeconds = request.TimerSeconds,
            PointsPerAnswer = request.PointsPerAnswer,
            AllowPlurals = request.AllowPlurals,
            AllowProperNouns = request.AllowProperNouns,
            AllowOffensiveWords = request.AllowOffensiveWords
        };

        _context.Games.Add(game);
        await _context.SaveChangesAsync(cancellationToken);

        return code;
    }

    private string GenerateUniqueCode()
    {
        // Remove ambiguous characters (0/O, 1/I/L) to prevent confusion
        const string chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
        const int length = 6;

        string code;
        do
        {
            var buffer = new byte[length];
            System.Security.Cryptography.RandomNumberGenerator.Fill(buffer);
            code = new string(Enumerable.Range(0, length)
                .Select(i => chars[buffer[i] % (byte)chars.Length])
                .ToArray());
        } while (_context.Games.Any(g => g.Code == code));

        return code;
    }
}
