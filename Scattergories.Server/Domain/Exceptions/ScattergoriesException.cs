namespace Scattergories.Domain.Exceptions;

/// <summary>
/// Base exception for domain-specific errors.
/// </summary>
public class ScattergoriesException : Exception
{
    public ScattergoriesException(string message) : base(message) { }

    public ScattergoriesException(string message, Exception inner) : base(message, inner) { }
}
