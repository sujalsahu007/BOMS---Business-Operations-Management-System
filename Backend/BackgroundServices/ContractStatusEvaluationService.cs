using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Interfaces;
using Backend.DTOs;

namespace Backend.BackgroundServices;

public class ContractStatusEvaluationService : BackgroundService
{
    private readonly ILogger<ContractStatusEvaluationService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly TimeSpan _interval = TimeSpan.FromHours(1);

    public ContractStatusEvaluationService(ILogger<ContractStatusEvaluationService> logger, IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Contract Status Evaluation Background Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await EvaluateStatusesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing Contract Status Evaluation task.");
            }

            // Wait for next interval
            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("Contract Status Evaluation Background Service is stopping.");
    }

    private async Task EvaluateStatusesAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var now = DateTime.UtcNow;
        var threshold = now.AddDays(30);

        bool changesMade = false;

        // 1. Evaluate Contracts
        var transitioningContracts = await context.Contracts
            .Where(c => c.Status == "Approved" || c.Status == "Active" || c.Status == "Expiring Soon")
            .ToListAsync(stoppingToken);

        foreach (var c in transitioningContracts)
        {
            try
            {
                var oldStatus = c.Status;
                
                if (c.Status == "Approved" && c.StartDate <= now && c.EndDate > now)
                {
                    c.Status = "Active";
                }
                
                if (c.Status == "Active" && c.EndDate <= threshold && c.EndDate >= now)
                {
                    c.Status = "Expiring Soon";
                }
                
                if ((c.Status == "Active" || c.Status == "Expiring Soon" || c.Status == "Approved") && c.EndDate < now)
                {
                    c.Status = "Expired";
                }

                if (oldStatus != c.Status)
                {
                    changesMade = true;
                    if (c.Status == "Expiring Soon")
                    {
                        await notificationService.CreateNotificationAsync(new CreateNotificationDto { 
                            RecipientUserId = c.OwnerId, Type = "Contract", Priority = "High", Title = "Contract Expiring Soon", Message = $"Contract {c.ContractNumber} is expiring soon.", ReferenceType = "Contract", ReferenceId = c.ContractId.ToString() 
                        });
                    }
                    else if (c.Status == "Expired")
                    {
                        await notificationService.CreateNotificationAsync(new CreateNotificationDto { 
                            RecipientUserId = c.OwnerId, Type = "Contract", Priority = "High", Title = "Contract Expired", Message = $"Contract {c.ContractNumber} has expired.", ReferenceType = "Contract", ReferenceId = c.ContractId.ToString() 
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing transitioning contract {c.ContractId}");
            }
        }

        // 2. Evaluate Obligations
        var overdueObligations = await context.ContractObligations
            .Where(o => o.DueDate < now && o.Status != "Completed" && o.Status != "Cancelled" && o.Status != "Overdue")
            .ToListAsync(stoppingToken);

        foreach (var o in overdueObligations)
        {
            try
            {
                // Do NOT mutate o.Status = "Overdue". 
                // Overdue is calculated dynamically on read based on DueDate and current Status.
                
                var notificationExists = await context.Notifications
                    .AnyAsync(n => n.ReferenceType == "Obligation" && 
                                   n.ReferenceId == o.ObligationId.ToString() && 
                                   n.Title == "Obligation Overdue", stoppingToken);
                                   
                if (!notificationExists)
                {
                    await notificationService.CreateNotificationAsync(new CreateNotificationDto { 
                        RecipientUserId = o.OwnerId, 
                        Type = "Contract", 
                        Priority = "High", 
                        Title = "Obligation Overdue", 
                        Message = $"Obligation {o.Title} is overdue.", 
                        ReferenceType = "Obligation", 
                        ReferenceId = o.ObligationId.ToString() 
                    });
                    
                    // Note: We don't need changesMade = true because CreateNotificationAsync saves its own changes
                    // or handles its own persistence inside the INotificationService implementation.
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing overdue obligation {o.ObligationId}");
            }
        }

        if (changesMade)
        {
            await context.SaveChangesAsync(stoppingToken);
            _logger.LogInformation("Persisted background status changes for contracts and obligations.");
        }
    }
}
