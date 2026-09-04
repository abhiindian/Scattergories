using System.Security.Claims;
using Scattergories.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Scattergories.Infrastructure.Services;

/// <summary>
/// Production implementation of ICurrentPlayer.
/// Resolves player identity from the authenticated SignalR / HTTP context.
/// Each HTTP/SignalR request gets a fresh instance (scoped lifetime).
/// </summary>
public class ProductionCurrentPlayer : ICurrentPlayer
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ProductionCurrentPlayer(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? PlayerId
    {
        get
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext?.User?.Identity?.IsAuthenticated != true)
                return null;

            var userIdClaim = httpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
                return userId;

            return null;
        }
    }

    public string? PlayerName
    {
        get
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext?.User?.Identity?.IsAuthenticated != true)
                return null;

            return httpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
        }
    }

    public Guid? GameId => null;  // Resolved per-operation from context
    public Guid? TeamId => null;  // Resolved per-operation from DB lookup
}
