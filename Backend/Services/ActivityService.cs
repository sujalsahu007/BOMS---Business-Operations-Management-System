using Backend.Data;
using Backend.Entities;
using Backend.Interfaces;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Services;

public class ActivityService : IActivityService
{
    private readonly ApplicationDbContext _context;
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        WriteIndented = false
    };

    public ActivityService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task LogActivityAsync(int userId, string module, string entityType, string entityId, string action, string description, object? metadata = null)
    {
        var metadataJson = metadata != null ? JsonSerializer.Serialize(metadata, _jsonOptions) : null;

        var activity = new Activity
        {
            UserId = userId,
            Module = module,
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            Description = description,
            Metadata = metadataJson,
            Timestamp = DateTime.UtcNow
        };

        _context.Activities.Add(activity);
        await _context.SaveChangesAsync();
    }
}
