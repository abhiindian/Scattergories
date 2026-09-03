namespace Scattergories.Domain.Entities;

/// <summary>
/// A player participating in a game.
/// Players can be on a team or play individually.
/// </summary>
public class Player
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GameId { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? TeamId { get; set; }
    public bool IsHost { get; set; }
    public int TotalScore { get; set; }
    public Guid? UserId { get; set; }

    // Navigation
    public Game Game { get; set; } = null!;
    public Team? Team { get; set; }
    public UserAccount? UserAccount { get; set; }
    public ICollection<Answer> Answers { get; set; } = new List<Answer>();

    public Player() { }

    public Player(string name, bool isHost = false)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Player name cannot be empty.", nameof(name));

        Id = Guid.NewGuid();
        Name = name.Length > 50 ? name[..50] : name;
        IsHost = isHost;
    }
}
