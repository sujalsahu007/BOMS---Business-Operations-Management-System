using Backend.Entities;

namespace Backend.Interfaces;

public interface ISystemTestService
{
    Task<SystemTestRecord> CreateTestRecordAsync(string name);
    Task<IEnumerable<SystemTestRecord>> GetAllTestRecordsAsync();
}
