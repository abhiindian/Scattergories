namespace Scattergories.Domain.Enums;

/// <summary>
/// Possible states of an individual round.
/// </summary>
public enum RoundState
{
    Waiting,
    Running,
    Answering,
    Revealed,
    ScoringDone
}
