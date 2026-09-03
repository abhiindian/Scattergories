namespace Scattergories.Domain.Exceptions;

/// <summary>
/// Exception thrown when authentication or token validation fails.
/// </summary>
public class SecurityException : Exception
{
    public SecurityException(string message) : base(message) { }

    public SecurityException(string message, Exception inner) : base(message, inner) { }
}
