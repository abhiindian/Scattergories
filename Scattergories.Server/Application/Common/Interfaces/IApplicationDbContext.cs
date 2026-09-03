using Microsoft.EntityFrameworkCore;
using Scattergories.Domain.Entities;

namespace Scattergories.Application.Common.Interfaces;

/// <summary>
/// Application-level database context interface.
/// Used by MediatR handlers to access the persistence store.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<Game> Games { get; }
    DbSet<Round> Rounds { get; }
    DbSet<Player> Players { get; }
    DbSet<Team> Teams { get; }
    DbSet<Category> Categories { get; }
    DbSet<Answer> Answers { get; }
    DbSet<RoundCategory> RoundCategories { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
