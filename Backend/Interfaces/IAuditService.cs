using Backend.Entities;

namespace Backend.Interfaces;

public interface IAuditService
{
    Task LogAuditAsync(int? userId, string action, string module, string entityType, string entityId, object? oldValues, object? newValues, string? ipAddress);
}
