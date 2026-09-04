using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Scattergories.Application.Common.Interfaces;
using Scattergories.Domain.Entities;
using Scattergories.Domain.Services;
using Scattergories.Infrastructure.Data;
using Scattergories.Infrastructure.SeedData;
using Scattergories.Infrastructure.Services;
using Scattergories.Infrastructure.SignalR;

var builder = WebApplication.CreateBuilder(args);

// --- Logging ---
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// --- Database ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=scattergories.db";

builder.Services.AddDbContext<ScattergoriesDbContext>(options =>
    options.UseSqlite(connectionString));

builder.Services.AddScoped<IApplicationDbContext, ScattergoriesDbContext>();

// --- MediatR ---
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(Scattergories.Application.Features.Games.Commands.CreateGame.CreateGameCommand).Assembly);
});

// --- FluentValidation ---
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssembly(typeof(Scattergories.Application.Features.Games.Commands.CreateGame.CreateGameCommand).Assembly);

// --- Domain Services ---
builder.Services.AddScoped<IScoringService, ScoringService>();
builder.Services.AddScoped<ILetterService, LetterService>();
builder.Services.AddScoped<IWordFilterService, WordFilterService>();

// --- Current Player ---
// In development: reads from localStorage via HttpContext.Items (StubCurrentPlayer)
// In production: resolves from authenticated HTTP/SignalR context (ProductionCurrentPlayer)
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddScoped<ICurrentPlayer, StubCurrentPlayer>();
}
else
{
    builder.Services.AddScoped<ICurrentPlayer, ProductionCurrentPlayer>();
}

// --- Authentication & Authorization ---
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is required. Configure it via appsettings or environment variables.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Scattergories";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "scattergories-client";

builder.Services.AddHttpContextAccessor();

builder.Services.AddAuthentication("JwtBearer")
    .AddJwtBearer("JwtBearer", options =>
    {
        // Allow JWT in query string for SignalR connections
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["authToken"];
                if (!string.IsNullOrEmpty(accessToken))
                    context.Token = accessToken.ToString();
                return Task.CompletedTask;
            },
        };
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(jwtSecret)),
        };
    });

builder.Services.AddAuthorization();

// --- Application Services ---
builder.Services.AddScoped<Scattergories.Infrastructure.Services.GoogleAuthService>();

// --- SignalR ---
builder.Services.AddSignalR();

// --- Controllers ---
builder.Services.AddControllers();

// --- CORS ---
var allowedOrigins = builder.Configuration.GetValue<string[]>("AllowedOrigins")
    ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// --- OpenAPI / Swagger ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter 'Bearer' followed by your JWT token",
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer",
                },
            },
            Array.Empty<string>()
        },
    });
});

var app = builder.Build();

// --- Global exception handling ---
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Scattergories.Domain.Exceptions.ScattergoriesException ex)
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsJsonAsync(new { error = ex.Message });
    }
});

// --- Seed database on startup ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ScattergoriesDbContext>();
    db.Database.EnsureCreated();

    if (!db.Categories.Any())
    {
        var categories = DefaultCategories.ToCategories();
        db.Categories.AddRange(categories);
        await db.SaveChangesAsync();
    }
}

// --- Middleware pipeline ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<GameHub>("/hubs/game").RequireAuthorization();

app.Run();
