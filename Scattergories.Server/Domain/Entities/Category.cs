namespace Scattergories.Domain.Entities;

/// <summary>
/// A category in the game (e.g. Name, Place, Animal).
/// These are reference data seeded at startup.
/// </summary>
public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }

    // Navigation
    public ICollection<RoundCategory> RoundCategories { get; set; } = new List<RoundCategory>();

    public Category() { }

    public Category(string name, int displayOrder)
    {
        Id = Guid.NewGuid();
        Name = name;
        DisplayOrder = displayOrder;
    }
}
