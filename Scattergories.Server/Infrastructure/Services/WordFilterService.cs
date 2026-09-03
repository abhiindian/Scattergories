using Scattergories.Domain.Services;

namespace Scattergories.Infrastructure.Services;

/// <summary>
/// Filters answers based on game rules (plurals, proper nouns, profanity).
/// Uses pattern matching and a simple banned words list.
/// </summary>
public class WordFilterService : IWordFilterService
{
    // Common profanity / offensive words list (extensible via configuration)
    private static readonly string[] _profanityList =
    {
        "fuck", "shit", "damn", "bitch", "bastard", "crap", "piss", "ass", "dick",
        "cock", "pussy", "whore", "slut", "nigger", "nigga", "faggot", "fag",
        "retard", "retarded", "cunt", "boob", "tits", "penis", "vagina", "anus",
        "rape", "rapist", "murder", "kill", "die", "dead"
    };

    // Common plural suffixes to check (ordered longest-first for correct matching).
    // "s" alone is very noisy (gas, mass, bus, plus, etc.), so only flag it for
    // words where removing the trailing 's' leaves a word of 3+ characters.

    public bool ContainsProfanity(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return false;

        var lower = text.Trim().ToLowerInvariant();
        return _profanityList.Any(word => lower.Contains(word));
    }

    public bool IsPlural(string text)
    {
        if (string.IsNullOrWhiteSpace(text) || text.Length <= 1)
            return false;

        var lower = text.Trim().ToLowerInvariant();

        // Check specific plural suffixes (ordered longest-first).
        // These patterns are more reliable than bare 's' alone.
        foreach (var suffix in new[] { "ies", "ses", "xes", "zes", "ches", "shes", "es" })
        {
            if (lower.EndsWith(suffix) && lower.Length > suffix.Length)
                return true;
        }

        // Bare 's' is noisy (gas, mass, bus, plus), so only flag it when
        // the stem is 3+ characters — likely a legitimate plural (tips, cats, dogs).
        if (lower.EndsWith("s") && lower.Length > 4)
            return true;

        return false;
    }

    public bool IsProperNoun(string text)
    {
        if (string.IsNullOrWhiteSpace(text) || text.Length <= 1)
            return false;

        // A proper noun typically has uppercase letters after the first character
        // e.g., "Apple" (but not "apple")
        for (var i = 1; i < text.Length; i++)
        {
            if (char.IsUpper(text[i]))
                return true;
        }

        return false;
    }
}
