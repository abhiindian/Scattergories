using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Domain.Entities;

namespace Scattergories.Infrastructure.Data;

/// <summary>
/// EF Core DbContext for the Scattergories application.
/// Configures entity relationships and provides persistence.
/// </summary>
public class ScattergoriesDbContext : DbContext, IApplicationDbContext
{
    public ScattergoriesDbContext(DbContextOptions<ScattergoriesDbContext> options)
        : base(options) { }

    public DbSet<Game> Games => Set<Game>();
    public DbSet<Round> Rounds => Set<Round>();
    public DbSet<Player> Players => Set<Player>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Answer> Answers => Set<Answer>();
    public DbSet<RoundCategory> RoundCategories => Set<RoundCategory>();
    public DbSet<UserAccount> UserAccounts => Set<UserAccount>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure relationships
        modelBuilder.Entity<Game>()
            .HasMany(g => g.Rounds)
            .WithOne(r => r.Game)
            .HasForeignKey(r => r.GameId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Game>()
            .HasMany(g => g.Players)
            .WithOne(p => p.Game)
            .HasForeignKey(p => p.GameId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Game>()
            .HasMany(g => g.Teams)
            .WithOne(t => t.Game)
            .HasForeignKey(t => t.GameId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Game>()
            .HasIndex(g => g.Code)
            .IsUnique();

        modelBuilder.Entity<Round>()
            .HasMany(r => r.RoundCategories)
            .WithOne(rc => rc.Round)
            .HasForeignKey(rc => rc.RoundId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Round>()
            .HasMany(r => r.Answers)
            .WithOne(a => a.Round)
            .HasForeignKey(a => a.RoundId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Player>()
            .HasMany(p => p.Answers)
            .WithOne(a => a.Player)
            .HasForeignKey(a => a.PlayerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Player>()
            .HasOne(p => p.Team)
            .WithMany(t => t.Players)
            .HasForeignKey(p => p.TeamId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Player>()
            .HasOne(p => p.UserAccount)
            .WithMany(u => u.Players)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<UserAccount>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<UserAccount>()
            .HasIndex(u => u.GoogleId)
            .IsUnique();

        modelBuilder.Entity<Category>()
            .HasIndex(c => c.Name)
            .IsUnique();

        modelBuilder.Entity<RoundCategory>()
            .HasKey(rc => new { rc.RoundId, rc.CategoryId });

        modelBuilder.Entity<RoundCategory>()
            .HasOne(rc => rc.Category)
            .WithMany(c => c.RoundCategories)
            .HasForeignKey(rc => rc.CategoryId);

        modelBuilder.Entity<Answer>()
            .HasOne(a => a.Category)
            .WithMany()
            .HasForeignKey(a => a.CategoryId);

        modelBuilder.Entity<Answer>()
            .HasIndex(a => new { a.PlayerId, a.RoundId, a.CategoryId })
            .IsUnique();

        // --- String length constraints (security) ---
        modelBuilder.Entity<Player>()
            .Property(p => p.Name)
            .HasMaxLength(50)
            .IsRequired();

        modelBuilder.Entity<Answer>()
            .Property(a => a.Text)
            .HasMaxLength(500)
            .IsRequired();

        modelBuilder.Entity<Category>()
            .Property(c => c.Name)
            .HasMaxLength(100)
            .IsRequired();

        modelBuilder.Entity<Game>()
            .Property(g => g.Code)
            .HasMaxLength(10)
            .IsRequired();

        modelBuilder.Entity<Round>()
            .Property(r => r.Letter)
            .HasMaxLength(2)
            .IsRequired();

        modelBuilder.Entity<UserAccount>()
            .Property(u => u.GoogleId)
            .HasMaxLength(256)
            .IsRequired();

        modelBuilder.Entity<UserAccount>()
            .Property(u => u.Email)
            .HasMaxLength(256)
            .IsRequired();

        modelBuilder.Entity<UserAccount>()
            .Property(u => u.DisplayName)
            .HasMaxLength(100)
            .IsRequired();

        // Seed default categories
        modelBuilder.Entity<Category>().HasData(
            new Category("Name", 1) { Id = Guid.Parse("11111111-1111-1111-1111-111111111111") },
            new Category("Place", 2) { Id = Guid.Parse("22222222-2222-2222-2222-222222222222") },
            new Category("Animal", 3) { Id = Guid.Parse("33333333-3333-3333-3333-333333333333") },
            new Category("Thing", 4) { Id = Guid.Parse("44444444-4444-4444-4444-444444444444") },
            new Category("Food", 5) { Id = Guid.Parse("55555555-5555-5555-5555-555555555555") },
            new Category("City", 6) { Id = Guid.Parse("66666666-6666-6666-6666-666666666666") },
            new Category("Color", 7) { Id = Guid.Parse("77777777-7777-7777-7777-777777777777") },
            new Category("Brand", 8) { Id = Guid.Parse("88888888-8888-8888-8888-888888888888") },
            new Category("Occupation", 9) { Id = Guid.Parse("99999999-9999-9999-9999-999999999999") }
        );
    }
}
