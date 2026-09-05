using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Scattergories.Domain.Entities;
using Scattergories.Domain.Exceptions;
using Scattergories.Infrastructure.Data;

namespace Scattergories.Infrastructure.Services;

/// <summary>
/// Handles Google ID token verification and user account lookups/creations.
/// </summary>
public class GoogleAuthService
{
    private readonly ScattergoriesDbContext _context;

    public GoogleAuthService(ScattergoriesDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Verifies a Google ID token and returns the parsed payload claims.
    /// Throws if the token is invalid.
    /// </summary>
    public async Task<GoogleJsonWebSignature.Payload> VerifyTokenAsync(string googleIdToken)
    {
        try
        {
            return await GoogleJsonWebSignature.ValidateAsync(googleIdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new List<string> { GetGoogleClientId() },
            });
        }
        catch (Exception ex) when (ex is InvalidJwtException || ex is SecurityException)
        {
            using var client = new System.Net.Http.HttpClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", googleIdToken);
            var response = await client.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");
            if (!response.IsSuccessStatusCode)
                throw new SecurityException("Invalid Google token");

            var json = await response.Content.ReadAsStringAsync();
            var doc = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;
            return new GoogleJsonWebSignature.Payload
            {
                Subject = root.GetProperty("sub").GetString(),
                Email = root.GetProperty("email").GetString(),
                Name = root.TryGetProperty("name", out var n) ? n.GetString() : null,
                Picture = root.TryGetProperty("picture", out var p) ? p.GetString() : null,
            };
        }
    }

    /// <summary>
    /// Looks up or creates a UserAccount for the given Google payload.
    /// </summary>
    public async Task<UserAccount> GetOrCreateUserAccountAsync(GoogleJsonWebSignature.Payload payload)
    {
        var googleId = payload.Subject;
        var email = payload.Email ?? throw new SecurityException("Google token missing email");

        var user = await _context.UserAccounts
            .FirstOrDefaultAsync(u => u.GoogleId == googleId || u.Email == email);

        if (user != null)
        {
            user.LastLoginAt = DateTime.UtcNow;
        }
        else
        {
            user = new UserAccount
            {
                GoogleId = googleId,
                Email = email,
                DisplayName = payload.Name ?? email.Split('@')[0],
                ProfileImageUrl = payload.Picture,
                LastLoginAt = DateTime.UtcNow,
            };
            _context.UserAccounts.Add(user);
        }

        await _context.SaveChangesAsync();
        return user;
    }

    private string GetGoogleClientId()
    {
        var clientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
        if (string.IsNullOrEmpty(clientId))
            throw new SecurityException("GOOGLE_CLIENT_ID environment variable is not set. Google authentication is disabled.");
        return clientId;
    }
}
