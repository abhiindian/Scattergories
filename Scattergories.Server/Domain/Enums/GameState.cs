namespace Scattergories.Domain.Enums;

/// <summary>
/// Possible states of a game.
/// Transitions are controlled by the host and triggered through commands.
/// </summary>
public enum GameState
{
    /// <summary>
    /// Game has been created; players are joining.
    /// </summary>
    Lobby,

    /// <summary>
    /// Round has begun; timer is counting down and players fill in answers.
    /// </summary>
    RoundRunning,

    /// <summary>
    /// Time is up; players can submit their answers.
    /// </summary>
    Answering,

    /// <summary>
    /// All answers are revealed with scoring; scores are displayed.
    /// </summary>
    Revealing,

    /// <summary>
    /// Game has finished; final scoreboard is shown.
    /// </summary>
    Finished
}
