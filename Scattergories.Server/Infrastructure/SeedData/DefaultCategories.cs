using Scattergories.Domain.Entities;

namespace Scattergories.Infrastructure.SeedData;

/// <summary>
/// Default category data for the game.
/// Mirrors the EF Core seed data in the DbContext for runtime availability.
/// </summary>
public static class DefaultCategories
{
    public static readonly (Guid Id, string Name, int DisplayOrder)[] Items =
    {
        (Guid.Parse("11111111-1111-1111-1111-111111111111"), "Name", 1),
        (Guid.Parse("22222222-2222-2222-2222-222222222222"), "Place", 2),
        (Guid.Parse("33333333-3333-3333-3333-333333333333"), "Animal", 3),
        (Guid.Parse("44444444-4444-4444-4444-444444444444"), "Thing", 4),
        (Guid.Parse("55555555-5555-5555-5555-555555555555"), "Food", 5),
        (Guid.Parse("66666666-6666-6666-6666-666666666666"), "City", 6),
        (Guid.Parse("77777777-7777-7777-7777-777777777777"), "Color", 7),
        (Guid.Parse("88888888-8888-8888-8888-888888888888"), "Brand", 8),
        (Guid.Parse("99999999-9999-9999-9999-999999999999"), "Occupation", 9),
    };

    public static List<Category> ToCategories()
    {
        return Items.Select(i => new Category(i.Name, i.DisplayOrder) { Id = i.Id }).ToList();
    }
}
