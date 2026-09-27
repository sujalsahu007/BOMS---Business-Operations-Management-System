using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class ContractDocument
{
    [Key]
    public int DocumentId { get; set; }
    
    [Required]
    public int ContractId { get; set; }
    public Contract Contract { get; set; } = null!;
    
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(1000)]
    public string FilePath { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string FileType { get; set; } = string.Empty; // e.g. application/pdf
    
    public long FileSize { get; set; }
    
    public int Version { get; set; } = 1;
    
    [Required]
    public int UploadedById { get; set; }
    public User UploadedBy { get; set; } = null!;
    
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
