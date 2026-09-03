namespace Scattergories.Domain.ValueObjects;

/// <summary>
/// Result of validating an answer against the game rules.
/// </summary>
public sealed class AnswerValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; init; } = new();
    public bool IsPlural { get; init; }
    public bool IsProperNoun { get; init; }
    public bool ContainsProfanity { get; init; }
    public bool WrongStartingLetter { get; init; }

    public static AnswerValidationResult Valid() => new() { IsValid = true };

    public static AnswerValidationResult Invalid(string error)
        => new() { IsValid = false, Errors = [error] };

    public static AnswerValidationResult Invalid(List<string> errors)
        => new() { IsValid = false, Errors = errors };

    public void AddError(string error)
    {
        IsValid = false;
        Errors.Add(error);
    }
}
