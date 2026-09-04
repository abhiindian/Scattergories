using Scattergories.Domain.Services;

namespace Scattergories.Infrastructure.Services;

/// <summary>
/// Selects random letters for each round.
/// Ensures no letter is repeated within a single game.
/// </summary>
public class LetterService : ILetterService
{
    private const string Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    // Random.Shared is thread-safe (internally uses per-thread instance pooling)
    private static readonly Random SharedRandom = Random.Shared;

    public char GetNextLetter(Domain.Entities.Game game)
    {
        // Collect all letters already used in this game
        var usedLetters = game.Rounds
            .Select(r => r.Letter.ToUpperInvariant())
            .ToHashSet();

        // Filter to unused letters
        var available = Alphabet
            .Where(c => !usedLetters.Contains(c.ToString()))
            .ToArray();

        // If all letters used (shouldn't happen with 9 rounds / 26 letters), pick random
        if (available.Length == 0)
            available = Alphabet.ToArray();

        return available[SharedRandom.Next(available.Length)];
    }
}
