namespace Scattergories.Domain.Entities;

/// <summary>
/// The aggregate root. Represents a complete game of Scattergories.
/// Contains all rounds, players, and categories for the game.
/// The host (first player) controls state transitions.
/// </summary>
public class Game
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public int RoundCount { get; set; } = 9;
    public int TimerSeconds { get; set; } = 180;
    public int PointsPerAnswer { get; set; } = 10;
    public bool AllowPlurals { get; set; }
    public bool AllowProperNouns { get; set; }
    public bool AllowOffensiveWords { get; set; }
    public Enums.GameState GameState { get; set; } = Enums.GameState.Lobby;
    public int CurrentRoundNumber { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }

    // Navigation
    public ICollection<Round> Rounds { get; set; } = new List<Round>();
    public ICollection<Player> Players { get; set; } = new List<Player>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Team> Teams { get; set; } = new List<Team>();

    public Game() { }

    public Game(string code)
    {
        Id = Guid.NewGuid();
        Code = code;
    }
}
