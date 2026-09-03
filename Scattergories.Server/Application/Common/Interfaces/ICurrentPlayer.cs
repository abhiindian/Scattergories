namespace Scattergories.Application.Common.Interfaces;

/// <summary>
/// Provides information about the currently authenticated/acting player.
/// In multiplayer mode, resolved from the SignalR connection.
/// In single-machine mode, resolved from the local session.
/// </summary>
public interface ICurrentPlayer
{
    Guid? PlayerId { get; }
    string? PlayerName { get; }
    Guid? GameId { get; }
    Guid? TeamId { get; }
}
