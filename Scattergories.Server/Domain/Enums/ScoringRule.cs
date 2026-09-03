namespace Scattergories.Domain.Enums;

/// <summary>
/// Scoring rules that can be toggled per game.
/// </summary>
public enum ScoringRule
{
    /// <summary>
    /// Plurals are not allowed.
    /// </summary>
    NoPlurals,

    /// <summary>
    /// Proper nouns are not allowed.
    /// </summary>
    NoProperNouns,

    /// <summary>
    /// Offensive words are not allowed.
    /// </summary>
    NoOffensiveWords
}
