using Scattergories.Domain.Services;

namespace Scattergories.Infrastructure.Services;

/// <summary>
/// Handles scoring logic for the Scattergories game.
/// Validates answers, detects uniqueness, and calculates points.
/// Does NOT persist to database - the caller handles SaveChanges.
/// </summary>
public class ScoringService : IScoringService
{
    private readonly IWordFilterService _wordFilter;

    public ScoringService(IWordFilterService wordFilter)
    {
        _wordFilter = wordFilter;
    }

    public async Task<ScoringResult> ScoreRound(Domain.Entities.Game game, Domain.Entities.Round round)
    {
        var answers = round.Answers.ToList();
        if (!answers.Any())
            return CreateEmptyResult(round);

        // Phase 1: Validate each answer
        ValidateAnswers(answers, round);

        // Phase 2: Determine uniqueness
        DetermineUniqueness(answers, game);

        // Phase 3: Calculate points and update entities
        var scoredAnswers = new List<ScoredAnswer>();
        var playerScores = new Dictionary<Guid, int>();
        var teamScores = new Dictionary<Guid, int>();

        foreach (var answer in answers)
        {
            int points = 0;

            if (answer.IsValid && answer.IsUnique == true)
            {
                points = game.PointsPerAnswer;
            }

            answer.Points = points;

            if (!playerScores.ContainsKey(answer.PlayerId))
                playerScores[answer.PlayerId] = 0;
            playerScores[answer.PlayerId] += points;

            if (answer.Player?.TeamId.HasValue == true)
            {
                if (!teamScores.ContainsKey(answer.Player.TeamId.Value))
                    teamScores[answer.Player.TeamId.Value] = 0;
                teamScores[answer.Player.TeamId.Value] += points;
            }

            scoredAnswers.Add(new ScoredAnswer(
                answer.Id,
                answer.PlayerId,
                answer.Player.Name,
                answer.Player?.TeamId,
                answer.Player?.Team?.Name,
                answer.CategoryId,
                answer.Category.Name,
                answer.Text,
                answer.IsValid,
                answer.IsUnique == true,
                points
            ));
        }

        // Update player and team total scores
        foreach (var entry in playerScores)
        {
            var player = game.Players.FirstOrDefault(p => p.Id == entry.Key);
            if (player != null)
                player.TotalScore += entry.Value;
        }

        foreach (var entry in teamScores)
        {
            var team = game.Teams.FirstOrDefault(t => t.Id == entry.Key);
            if (team != null)
                team.TeamScore += entry.Value;
        }

        // Update round state
        round.State = Domain.Enums.RoundState.ScoringDone;
        round.FinishedAt = DateTime.UtcNow;

        // Determine game state
        if (game.CurrentRoundNumber >= game.RoundCount)
        {
            game.GameState = Domain.Enums.GameState.Finished;
            game.FinishedAt = DateTime.UtcNow;
        }
        else
        {
            game.CurrentRoundNumber = game.CurrentRoundNumber + 1;
            game.GameState = Domain.Enums.GameState.RoundRunning;
        }

        return new ScoringResult(
            round.Id,
            scoredAnswers,
            playerScores,
            teamScores
        );
    }

    private void ValidateAnswers(List<Domain.Entities.Answer> answers, Domain.Entities.Round round)
    {
        var letter = round.Letter.ToUpperInvariant();

        foreach (var answer in answers)
        {
            if (string.IsNullOrWhiteSpace(answer.Text))
            {
                answer.IsValid = false;
                continue;
            }

            if (!answer.Text.Trim().StartsWith(letter))
            {
                answer.IsValid = false;
                continue;
            }

            answer.IsValid = true; // Basic validation; full validation is done by scoring rules
        }
    }

    private void DetermineUniqueness(List<Domain.Entities.Answer> answers, Domain.Entities.Game game)
    {
        var validAnswers = answers.Where(a => a.IsValid).ToList();
        var groups = validAnswers
            .GroupBy(a => new { a.CategoryId, NormalizedText = a.Text.Trim().ToUpperInvariant() });

        foreach (var group in groups)
        {
            var answerCount = group.Count();
            var distinctTeams = new HashSet<Guid?>(group.Select(a => a.Player?.TeamId));
            distinctTeams.Remove(null);

            if (answerCount == 1)
            {
                // Only one player submitted this - it's unique
                group.First().IsUnique = true;
            }
            else
            {
                // Multiple players submitted the same answer
                if (distinctTeams.Count == answerCount)
                {
                    // All from different teams (or all solo) - all unique
                    foreach (var answer in group)
                        answer.IsUnique = true;
                }
                else
                {
                    // Check per-team duplicates
                    var teamGroups = group.GroupBy(a => a.Player?.TeamId);
                    foreach (var teamGroup in teamGroups)
                    {
                        if (teamGroup.Count() == 1)
                        {
                            teamGroup.First().IsUnique = true;
                        }
                        else
                        {
                            foreach (var answer in teamGroup)
                                answer.IsUnique = false;
                        }
                    }
                }
            }
        }

        // Invalid answers are not unique
        foreach (var answer in answers.Where(a => !a.IsValid))
            answer.IsUnique = false;
    }

    private static ScoringResult CreateEmptyResult(Domain.Entities.Round round)
    {
        return new ScoringResult(
            round.Id,
            new List<ScoredAnswer>(),
            new Dictionary<Guid, int>(),
            new Dictionary<Guid, int>()
        );
    }
}
