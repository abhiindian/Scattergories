using MediatR;

namespace Scattergories.Application.Features.Games.Queries.GetGame;

/// <summary>
/// Query to get the current state of a game by code.
/// </summary>
public record GetGameQuery(string GameCode) : IRequest<GetGameDto>;
