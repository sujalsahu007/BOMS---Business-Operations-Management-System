namespace Backend.Authorization;

public interface IPermissionService
{
    Task<bool> HasPermissionAsync(int userId, string permissionCode);
}
