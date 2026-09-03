namespace Scattergories.Domain.Entities;

/// <summary>
/// Stores Google authentication info for players.
/// A user can have multiple player entries across different games,
/// but only one user account.
/// </summary>
public class UserAccount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string GoogleId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Player> Players { get; set; } = new List<Player>();
}
