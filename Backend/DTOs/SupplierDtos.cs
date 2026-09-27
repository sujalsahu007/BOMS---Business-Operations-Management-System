using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class SupplierResponseDto
{
    public int SupplierId { get; set; }
    public string SupplierCode { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? TaxNumber { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateSupplierDto
{
    [Required(ErrorMessage = "Supplier Name is required.")]
    [StringLength(200, ErrorMessage = "Supplier Name cannot exceed 200 characters.")]
    public string SupplierName { get; set; } = string.Empty;

    [StringLength(100, ErrorMessage = "Contact Person cannot exceed 100 characters.")]
    public string? ContactPerson { get; set; }

    [EmailAddress(ErrorMessage = "Invalid Email format.")]
    [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters.")]
    public string? Email { get; set; }

    [StringLength(50, ErrorMessage = "Phone cannot exceed 50 characters.")]
    public string? Phone { get; set; }

    [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters.")]
    public string? Address { get; set; }

    [StringLength(100, ErrorMessage = "City cannot exceed 100 characters.")]
    public string? City { get; set; }

    [StringLength(100, ErrorMessage = "State cannot exceed 100 characters.")]
    public string? State { get; set; }

    [StringLength(100, ErrorMessage = "Country cannot exceed 100 characters.")]
    public string? Country { get; set; }

    [StringLength(100, ErrorMessage = "Tax Number cannot exceed 100 characters.")]
    public string? TaxNumber { get; set; }

    [Required]
    [RegularExpression("^(Active|Inactive)$", ErrorMessage = "Status must be 'Active' or 'Inactive'.")]
    public string Status { get; set; } = "Active";
}

public class UpdateSupplierDto : CreateSupplierDto
{
}
