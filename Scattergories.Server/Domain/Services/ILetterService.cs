namespace Scattergories.Domain.Services;

/// <summary>
/// Service for selecting random letters for each round.
/// Ensures no letter is repeated within a game.
/// </summary>
public interface ILetterService
{
    /// <summary>
    /// Selects a random letter that hasn't been used in any previous round of the game.
    /// </summary>
    char GetNextLetter(Domain.Entities.Game game);
}
