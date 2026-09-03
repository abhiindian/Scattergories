using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using System.Security.Claims;

namespace Scattergories.Infrastructure.Authorization;

/// <summary>
/// Authorization requirement: the player must be the host of the specified game.
/// </summary>
public class GameHostRequirement : IAuthorizationRequirement
{
    public GameHostRequirement() { }
}

public class GameHostRequirementHandler : AuthorizationHandler<GameHostRequirement>
{
    private readonly IApplicationDbContext _context;

    public GameHostRequirementHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        GameHostRequirement requirement)
    {
        var httpContext = context.Resource as HttpContext;
        if (httpContext == null)
        {
            context.Fail();
            return;
        }

        var userIdClaim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var code = httpContext.Request.Query["code"];

        if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(code))
        {
            context.Fail("Missing authentication or game code.");
            return;
        }

        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            context.Fail("Invalid user ID in token.");
            return;
        }

        var game = await _context.Games
            .Include(g => g.Players)
            .FirstOrDefaultAsync(g => g.Code == code);

        if (game == null)
        {
            context.Fail("Game not found.");
            return;
        }

        var player = game.Players.FirstOrDefault(p => p.UserId == userId);
        if (player == null || !player.IsHost)
        {
            context.Fail("Player is not the host of this game.");
            return;
        }

        context.Succeed(requirement);
    }
}
