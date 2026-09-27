using Backend.Entities;

namespace Backend.Interfaces;

public interface IActivityService
{
    Task LogActivityAsync(int userId, string module, string entityType, string entityId, string action, string description, object? metadata = null);
}
