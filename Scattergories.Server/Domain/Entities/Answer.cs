namespace Scattergories.Domain.Entities;

/// <summary>
/// A player's submitted answer for a single category in a single round.
/// Validation and scoring results are stored after the reveal phase.
/// </summary>
public class Answer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlayerId { get; set; }
    public Guid RoundId { get; set; }
    public Guid CategoryId { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsValid { get; set; }
    public bool? IsUnique { get; set; }
    public int? Points { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Player Player { get; set; } = null!;
    public Round Round { get; set; } = null!;
    public Category Category { get; set; } = null!;

    public Answer() { }

    public Answer(Guid playerId, Guid roundId, Guid categoryId, string text)
    {
        Id = Guid.NewGuid();
        PlayerId = playerId;
        RoundId = roundId;
        CategoryId = categoryId;
        Text = text.Trim();
        SubmittedAt = DateTime.UtcNow;
    }
}
