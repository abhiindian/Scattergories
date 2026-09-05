using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("ScattergoriesSecretKey2025ShouldBeLongAndSecure!"));
var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
var claims = new[]
{
    new Claim(ClaimTypes.NameIdentifier, "00000000-0000-0000-0000-000000000000")
};
var token = new JwtSecurityToken("Scattergories", "scattergories-client", claims, expires: DateTime.Now.AddDays(1), signingCredentials: creds);
Console.WriteLine(new JwtSecurityTokenHandler().WriteToken(token));
