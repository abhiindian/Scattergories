using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using System.Security.Claims;

namespace Scattergories.Infrastructure.Authorization;

/// <summary>
/// Authorization requirement: the player must be a member of the specified game.
/// </summary>
public class GameMembershipRequirement : IAuthorizationRequirement
{
    public GameMembershipRequirement() { }
}

public class GameMembershipRequirementHandler : AuthorizationHandler<GameMembershipRequirement>
{
    private readonly IApplicationDbContext _context;

    public GameMembershipRequirementHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        GameMembershipRequirement requirement)
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
        if (player == null)
        {
            context.Fail("Player is not a member of this game.");
            return;
        }

        context.Succeed(requirement);
    }
}
