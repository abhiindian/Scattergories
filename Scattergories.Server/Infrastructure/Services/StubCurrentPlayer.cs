using Scattergories.Application.Common.Interfaces;

namespace Scattergories.Infrastructure.Services;

/// <summary>
/// WARNING: Development use only. Do NOT use in production.
/// This class uses mutable static state and should never be registered
/// as scoped in a production environment.
/// In production, resolve player identity from the authenticated SignalR/HTTP context.
/// </summary>
public class StubCurrentPlayer : ICurrentPlayer
{
    private static readonly Lazy<StubCurrentPlayer> _instance = new(() => new StubCurrentPlayer());
    private Guid _playerId = Guid.NewGuid();

    public static StubCurrentPlayer Instance => _instance.Value;

    public Guid? PlayerId => _playerId;
    public string? PlayerName { get; set; }
    public Guid? GameId { get; set; }
    public Guid? TeamId { get; set; }
    public string? Email { get; set; }
    public string? GoogleId { get; set; }

    public static void SetPlayer(Guid? playerId, string? playerName)
    {
        _instance.Value._playerId = playerId ?? Guid.NewGuid();
        _instance.Value.PlayerName = playerName;
    }
}
