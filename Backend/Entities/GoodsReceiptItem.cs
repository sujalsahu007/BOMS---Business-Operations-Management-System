using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class GoodsReceiptItem
{
    [Key]
    public int ReceiptItemId { get; set; }

    [Required]
    public int GoodsReceiptId { get; set; }
    public GoodsReceipt GoodsReceipt { get; set; } = null!;

    [Required]
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    [Required]
    public int PurchaseOrderItemId { get; set; }
    public PurchaseOrderItem PurchaseOrderItem { get; set; } = null!;

    [Required]
    public int OrderedQuantity { get; set; }

    [Required]
    public int PreviouslyReceivedQuantity { get; set; }

    [Required]
    public int ReceivedNowQuantity { get; set; }

    [Required]
    public int RemainingQuantity { get; set; }
}
