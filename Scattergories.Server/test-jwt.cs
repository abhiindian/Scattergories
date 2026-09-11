using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

class Program {
    static void Main() {
        var handler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("ScattergoriesSecretKey2025ShouldBeLongAndSecure!"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
        };
        
        var token = new JwtSecurityToken("issuer", "audience", claims, null, DateTime.UtcNow.AddHours(1), creds);
        var tokenString = handler.WriteToken(token);
        
        Console.WriteLine("Token: " + tokenString);
        
        var parsed = handler.ReadJwtToken(tokenString);
        foreach (var c in parsed.Claims) {
            Console.WriteLine(c.Type + ": " + c.Value);
        }
    }
}
