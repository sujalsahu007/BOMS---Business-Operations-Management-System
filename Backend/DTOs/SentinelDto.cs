using System;
using System.Collections.Generic;

namespace Backend.DTOs;

public class SentinelFindingDto
{
    public string Id { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty; // Critical, High, Medium, Low
    public string Module { get; set; } = string.Empty; // Inventory, Contracts, Loyalty
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Metric { get; set; } = string.Empty;
    public DateTime DetectedAt { get; set; }
    public SentinelActionDto PrimaryAction { get; set; } = new();
    
    public string Status { get; set; } = "Open"; // Open, Acknowledged
    public List<SentinelRelatedImpactDto> RelatedImpacts { get; set; } = new();
}

public class SentinelActionDto
{
    public string Label { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public class SentinelRelatedImpactDto
{
    public string Description { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
}

public class SentinelDashboardDto
{
    public DateTime LastScanned { get; set; }
    public Dictionary<string, int> SeverityCounts { get; set; } = new();
    public Dictionary<string, int> ModuleCounts { get; set; } = new();
    public List<SentinelFindingDto> ImmediateAttention { get; set; } = new();
    public List<SentinelFindingDto> OtherItems { get; set; } = new();
}
