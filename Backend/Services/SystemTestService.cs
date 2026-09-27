using Backend.Data;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class SystemTestService : ISystemTestService
{
    private readonly ApplicationDbContext _context;

    public SystemTestService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SystemTestRecord> CreateTestRecordAsync(string name)
    {
        var record = new SystemTestRecord { Name = name };
        _context.SystemTestRecords.Add(record);
        await _context.SaveChangesAsync();
        return record;
    }

    public async Task<IEnumerable<SystemTestRecord>> GetAllTestRecordsAsync()
    {
        return await _context.SystemTestRecords.ToListAsync();
    }
}
