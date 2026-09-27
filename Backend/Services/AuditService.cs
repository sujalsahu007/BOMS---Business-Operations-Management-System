using Backend.Data;
using Backend.Entities;
using Backend.Interfaces;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Services;

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        WriteIndented = false
    };

    public AuditService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task LogAuditAsync(int? userId, string action, string module, string entityType, string entityId, object? oldValues, object? newValues, string? ipAddress)
    {
        var oldValuesJson = oldValues != null ? JsonSerializer.Serialize(StripSensitiveInfo(oldValues), _jsonOptions) : null;
        var newValuesJson = newValues != null ? JsonSerializer.Serialize(StripSensitiveInfo(newValues), _jsonOptions) : null;

        var log = new AuditLog
        {
            UserId = userId,
            Action = action,
            Module = module,
            EntityType = entityType,
            EntityId = entityId,
            OldValues = oldValuesJson,
            NewValues = newValuesJson,
            IpAddress = ipAddress,
            Timestamp = DateTime.UtcNow
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    private object StripSensitiveInfo(object data)
    {
        // Simple serialization masking for common sensitive fields
        var dict = JsonSerializer.Deserialize<Dictionary<string, object>>(JsonSerializer.Serialize(data, _jsonOptions));
        if (dict == null) return data;
        
        var sensitiveKeys = new[] { "PasswordHash", "Password", "Token", "Secret" };
        foreach (var key in sensitiveKeys)
        {
            var matchedKey = dict.Keys.FirstOrDefault(k => k.Equals(key, StringComparison.OrdinalIgnoreCase));
            if (matchedKey != null)
            {
                dict[matchedKey] = "*****";
            }
        }
        return dict;
    }
}
