namespace Scattergories.Domain.Entities;

/// <summary>
/// A single round of the game, identified by a letter (A-Z).
/// Each round uses a subset of the game's categories.
/// </summary>
public class Round
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GameId { get; set; }
    public int RoundNumber { get; set; }
    public string Letter { get; set; } = string.Empty;
    public Enums.RoundState State { get; set; } = Enums.RoundState.Waiting;
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }

    // Navigation
    public Game Game { get; set; } = null!;
    public ICollection<RoundCategory> RoundCategories { get; set; } = new List<RoundCategory>();
    public ICollection<Answer> Answers { get; set; } = new List<Answer>();

    public Round() { }

    public Round(int roundNumber, string letter, DateTime? startedAt = null, DateTime? finishedAt = null)
    {
        Id = Guid.NewGuid();
        RoundNumber = roundNumber;
        Letter = letter.ToUpperInvariant();
        StartedAt = startedAt;
        FinishedAt = finishedAt;
    }
}
