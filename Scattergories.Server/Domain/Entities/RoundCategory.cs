namespace Scattergories.Domain.Entities;

/// <summary>
/// Junction table linking rounds to their categories.
/// Allows different rounds to have different category sets,
/// though typically all rounds use the same categories.
/// </summary>
public class RoundCategory
{
    public Guid RoundId { get; set; }
    public Guid CategoryId { get; set; }

    // Navigation
    public Round Round { get; set; } = null!;
    public Category Category { get; set; } = null!;
}
