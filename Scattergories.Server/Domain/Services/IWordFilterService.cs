namespace Scattergories.Domain.Services;

/// <summary>
/// Service for filtering answers that violate game rules.
/// </summary>
public interface IWordFilterService
{
    /// <summary>
    /// Checks if the text contains any profanity (from the banned words list).
    /// </summary>
    bool ContainsProfanity(string text);

    /// <summary>
    /// Checks if the text matches common plural patterns.
    /// </summary>
    bool IsPlural(string text);

    /// <summary>
    /// Checks if the text is likely a proper noun (uppercase after first character).
    /// </summary>
    bool IsProperNoun(string text);
}
