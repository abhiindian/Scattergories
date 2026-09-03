namespace Scattergories.Domain.Entities;

/// <summary>
/// A team of players in a game.
/// Teams are auto-generated when team play is enabled.
/// </summary>
public class Team
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GameId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int TeamScore { get; set; }

    // Navigation
    public Game Game { get; set; } = null!;
    public ICollection<Player> Players { get; set; } = new List<Player>();

    public Team() { }

    public Team(string name)
    {
        Id = Guid.NewGuid();
        Name = name;
    }
}
