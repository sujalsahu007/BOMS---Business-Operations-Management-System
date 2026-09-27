using Backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<SystemTestRecord> SystemTestRecords { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<RolePermission> RolePermissions { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<Activity> Activities { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<ProductCategory> ProductCategories { get; set; }
    public DbSet<Product> Products { get; set; }
    
    public DbSet<Warehouse> Warehouses { get; set; } = null!;
    public DbSet<WarehouseStock> WarehouseStocks { get; set; } = null!;
    public DbSet<InventoryTransaction> InventoryTransactions { get; set; } = null!;
    public DbSet<Supplier> Suppliers { get; set; } = null!;
    
    public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
    public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
    public DbSet<POApproval> POApprovals { get; set; }
    public DbSet<GoodsReceipt> GoodsReceipts { get; set; }
    public DbSet<GoodsReceiptItem> GoodsReceiptItems { get; set; }
    
    public DbSet<StockTransfer> StockTransfers { get; set; }
    public DbSet<StockAdjustment> StockAdjustments { get; set; }

    // Contract Management
    public DbSet<ContractParty> ContractParties { get; set; } = null!;
    public DbSet<Contract> Contracts { get; set; } = null!;
    public DbSet<ContractObligation> ContractObligations { get; set; } = null!;
    public DbSet<ContractApproval> ContractApprovals { get; set; } = null!;
    public DbSet<ContractDocument> ContractDocuments { get; set; } = null!;
    public DbSet<SigningRequest> SigningRequests { get; set; } = null!;

    // Customer Loyalty
    public DbSet<LoyaltyProgram> LoyaltyPrograms { get; set; } = null!;
    public DbSet<LoyaltyTier> LoyaltyTiers { get; set; } = null!;
    public DbSet<LoyaltyBenefit> LoyaltyBenefits { get; set; } = null!;
    public DbSet<LoyaltyReward> LoyaltyRewards { get; set; } = null!;
    public DbSet<LoyaltyPromotion> LoyaltyPromotions { get; set; } = null!;
    public DbSet<LoyaltyMembership> LoyaltyMemberships { get; set; } = null!;
    public DbSet<LoyaltyTransaction> LoyaltyTransactions { get; set; } = null!;

    // Sentinel
    public DbSet<SentinelState> SentinelStates { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User Constraints
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
        });

        // Role Constraints
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasIndex(e => e.RoleName).IsUnique();
            entity.Property(e => e.RoleName).IsRequired().HasMaxLength(100);
        });

        // Permission Constraints
        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasIndex(e => e.PermissionCode).IsUnique();
            entity.Property(e => e.PermissionCode).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PermissionName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Module).IsRequired().HasMaxLength(50);
        });

        // UserRole Junction
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(ur => new { ur.UserId, ur.RoleId });
            entity.HasOne(ur => ur.User).WithMany(u => u.UserRoles).HasForeignKey(ur => ur.UserId);
            entity.HasOne(ur => ur.Role).WithMany(r => r.UserRoles).HasForeignKey(ur => ur.RoleId);
        });

        // RolePermission Junction
        modelBuilder.Entity<RolePermission>()
            .HasKey(rp => new { rp.RoleId, rp.PermissionId });

        modelBuilder.Entity<RolePermission>()
            .HasOne(rp => rp.Role).WithMany(r => r.RolePermissions).HasForeignKey(rp => rp.RoleId);
        modelBuilder.Entity<RolePermission>()
            .HasOne(rp => rp.Permission).WithMany(p => p.RolePermissions).HasForeignKey(rp => rp.PermissionId);

        // Sentinel
        modelBuilder.Entity<SentinelState>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.FindingId }).IsUnique();
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // Notification Setup
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(n => n.NotificationId);
            entity.HasOne(n => n.User).WithMany().HasForeignKey(n => n.RecipientUserId);
            entity.Property(n => n.Type).IsRequired().HasMaxLength(50);
            entity.Property(n => n.Priority).IsRequired().HasMaxLength(20);
            entity.Property(n => n.Title).IsRequired().HasMaxLength(200);
            entity.Property(n => n.ReferenceType).HasMaxLength(50);
            entity.Property(n => n.ReferenceId).HasMaxLength(100);
        });

        // Activity Setup
        modelBuilder.Entity<Activity>(entity =>
        {
            entity.HasKey(a => a.ActivityId);
            entity.HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId);
            entity.Property(a => a.Module).IsRequired().HasMaxLength(100);
            entity.Property(a => a.EntityType).IsRequired().HasMaxLength(100);
            entity.Property(a => a.EntityId).IsRequired().HasMaxLength(100);
            entity.Property(a => a.Action).IsRequired().HasMaxLength(100);
            entity.Property(a => a.Description).IsRequired().HasMaxLength(500);
        });

        // AuditLog Setup
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(a => a.AuditLogId);
            entity.HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId).IsRequired(false);
            entity.Property(a => a.Action).IsRequired().HasMaxLength(100);
            entity.Property(a => a.Module).IsRequired().HasMaxLength(100);
            entity.Property(a => a.EntityType).IsRequired().HasMaxLength(100);
            entity.Property(a => a.EntityId).IsRequired().HasMaxLength(100);
            entity.Property(a => a.IpAddress).HasMaxLength(50);
        });

        // Loyalty Transaction Setup
        modelBuilder.Entity<LoyaltyTransaction>(entity =>
        {
            entity.HasOne(e => e.LoyaltyMembership)
                  .WithMany()
                  .HasForeignKey(e => e.MembershipId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.CreatedBy)
                  .WithMany()
                  .HasForeignKey(e => e.CreatedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Loyalty Membership Setup
        modelBuilder.Entity<LoyaltyMembership>(entity =>
        {
            entity.HasIndex(e => new { e.PartyId, e.LoyaltyProgramId }).IsUnique();
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.PointsBalance).HasColumnType("decimal(18,2)");
            entity.Property(e => e.LifetimePoints).HasColumnType("decimal(18,2)");
            
            // Delete behavior
            entity.HasOne(e => e.ContractParty)
                  .WithMany()
                  .HasForeignKey(e => e.PartyId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.LoyaltyProgram)
                  .WithMany()
                  .HasForeignKey(e => e.LoyaltyProgramId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.LoyaltyTier)
                  .WithMany()
                  .HasForeignKey(e => e.TierId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ProductCategory Setup
        modelBuilder.HasSequence<int>("CategoryCodeSeq").StartsAt(1).IncrementsBy(1);
        modelBuilder.Entity<ProductCategory>(entity =>
        {
            entity.HasKey(e => e.CategoryId);
            entity.HasIndex(e => e.CategoryCode).IsUnique();
            entity.Property(e => e.CategoryCode)
                .HasDefaultValueSql("CONCAT('CAT-', RIGHT('0000' + CAST(NEXT VALUE FOR CategoryCodeSeq AS VARCHAR(10)), 4))");
            entity.Property(e => e.CategoryName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
        });

        // Product Setup
        modelBuilder.HasSequence<int>("ProductCodeSeq").StartsAt(1).IncrementsBy(1);
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.ProductId);
            entity.HasIndex(e => e.ProductCode).IsUnique();
            entity.Property(e => e.ProductCode)
                .HasDefaultValueSql("CONCAT('PROD-', RIGHT('0000' + CAST(NEXT VALUE FOR ProductCodeSeq AS VARCHAR(10)), 4))");
            entity.HasIndex(e => e.SKU).IsUnique();
            entity.Property(e => e.SKU).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ProductName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Brand).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.UnitOfMeasure).HasMaxLength(50);
            entity.Property(e => e.CostPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.SellingPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.ImageUrl).HasMaxLength(1000);
            
            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure sequences
        modelBuilder.HasSequence<int>("WarehouseCodeSeq")
            .StartsAt(1)
            .IncrementsBy(1);

        modelBuilder.HasSequence<int>("TransactionCodeSeq")
            .StartsAt(1)
            .IncrementsBy(1);
            
        modelBuilder.HasSequence<int>("SupplierCodeSeq")
            .StartsAt(1)
            .IncrementsBy(1);

        modelBuilder.HasSequence<int>("PONumberSeq")
            .StartsAt(1)
            .IncrementsBy(1);

        modelBuilder.HasSequence<int>("GoodsReceiptNumberSeq")
            .StartsAt(1)
            .IncrementsBy(1);

        modelBuilder.HasSequence<int>("PartyCodeSeq")
            .StartsAt(1)
            .IncrementsBy(1);

        modelBuilder.HasSequence<int>("ContractNumberSeq")
            .StartsAt(1)
            .IncrementsBy(1);

        // Warehouse Configuration
        modelBuilder.Entity<Warehouse>(entity =>
        {
            entity.HasIndex(e => e.WarehouseCode).IsUnique();
        });

        // Warehouse Stock Configuration
        modelBuilder.Entity<WarehouseStock>(entity =>
        {
            // Unique constraint: ProductId + WarehouseId
            entity.HasIndex(e => new { e.ProductId, e.WarehouseId }).IsUnique();
            
            // RowVersion for optimistic concurrency
            entity.Property(e => e.RowVersion).IsRowVersion();
        });

        // Inventory Transaction Configuration
        modelBuilder.Entity<InventoryTransaction>(entity =>
        {
            entity.HasIndex(e => e.TransactionCode).IsUnique();
            
            entity.HasOne(e => e.Creator)
                  .WithMany()
                  .HasForeignKey(e => e.CreatedBy)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Purchase Order Configuration
        modelBuilder.Entity<PurchaseOrder>(entity =>
        {
            entity.HasIndex(e => e.PONumber).IsUnique();
            entity.Property(e => e.PONumber)
                .HasDefaultValueSql("CONCAT('PO-', RIGHT('0000' + CAST(NEXT VALUE FOR PONumberSeq AS VARCHAR(10)), 4))");
                
            entity.HasOne(e => e.Supplier)
                  .WithMany()
                  .HasForeignKey(e => e.SupplierId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.Warehouse)
                  .WithMany()
                  .HasForeignKey(e => e.WarehouseId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.Creator)
                  .WithMany()
                  .HasForeignKey(e => e.CreatedBy)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Purchase Order Item Configuration
        modelBuilder.Entity<PurchaseOrderItem>(entity =>
        {
            entity.HasOne(e => e.PurchaseOrder)
                  .WithMany(po => po.Items)
                  .HasForeignKey(e => e.PurchaseOrderId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.Product)
                  .WithMany()
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // PO Approval Configuration
        modelBuilder.Entity<POApproval>(entity =>
        {
            entity.HasOne(e => e.PurchaseOrder)
                  .WithMany(po => po.Approvals)
                  .HasForeignKey(e => e.PurchaseOrderId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.Approver)
                  .WithMany()
                  .HasForeignKey(e => e.ApproverId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Goods Receipt Configuration
        modelBuilder.Entity<GoodsReceipt>(entity =>
        {
            entity.HasIndex(e => e.ReceiptNumber).IsUnique();
            entity.Property(e => e.ReceiptNumber)
                .HasDefaultValueSql("CONCAT('GR-', RIGHT('0000' + CAST(NEXT VALUE FOR GoodsReceiptNumberSeq AS VARCHAR(10)), 4))");

            entity.HasOne(e => e.PurchaseOrder)
                  .WithMany()
                  .HasForeignKey(e => e.PurchaseOrderId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Warehouse)
                  .WithMany()
                  .HasForeignKey(e => e.WarehouseId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Receiver)
                  .WithMany()
                  .HasForeignKey(e => e.ReceivedBy)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Goods Receipt Item Configuration
        modelBuilder.Entity<GoodsReceiptItem>(entity =>
        {
            entity.HasOne(e => e.GoodsReceipt)
                  .WithMany(gr => gr.Items)
                  .HasForeignKey(e => e.GoodsReceiptId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Product)
                  .WithMany()
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PurchaseOrderItem)
                  .WithMany()
                  .HasForeignKey(e => e.PurchaseOrderItemId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GoodsReceiptItem>()
            .HasOne(gi => gi.Product)
            .WithMany()
            .HasForeignKey(gi => gi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Stock Transfer
        modelBuilder.Entity<StockTransfer>()
            .HasOne(t => t.SourceWarehouse)
            .WithMany()
            .HasForeignKey(t => t.SourceWarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<StockTransfer>()
            .HasOne(t => t.DestinationWarehouse)
            .WithMany()
            .HasForeignKey(t => t.DestinationWarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<StockTransfer>()
            .HasOne(t => t.Product)
            .WithMany()
            .HasForeignKey(t => t.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<StockTransfer>()
            .HasOne(t => t.Creator)
            .WithMany()
            .HasForeignKey(t => t.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Stock Adjustment
        modelBuilder.Entity<SigningRequest>()
            .HasIndex(r => r.SecureToken)
            .IsUnique();

        modelBuilder.Entity<LoyaltyProgram>()
            .HasIndex(p => p.ProgramCode)
            .IsUnique();

        modelBuilder.Entity<LoyaltyTier>()
            .HasIndex(t => new { t.LoyaltyProgramId, t.TierCode })
            .IsUnique();

        modelBuilder.Entity<LoyaltyTier>()
            .HasOne(t => t.LoyaltyProgram)
            .WithMany(p => p.Tiers)
            .HasForeignKey(t => t.LoyaltyProgramId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LoyaltyTier>()
            .HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LoyaltyBenefit>()
            .HasOne(b => b.Tier)
            .WithMany(t => t.Benefits)
            .HasForeignKey(b => b.TierId)
            .OnDelete(DeleteBehavior.Cascade); // Deleting a tier deletes its benefits.

        modelBuilder.Entity<LoyaltyBenefit>()
            .HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LoyaltyReward>()
            .HasIndex(r => r.RewardCode)
            .IsUnique();

        modelBuilder.Entity<LoyaltyReward>()
            .HasOne(r => r.LoyaltyProgram)
            .WithMany(p => p.Rewards)
            .HasForeignKey(r => r.LoyaltyProgramId)
            .OnDelete(DeleteBehavior.Cascade); // Deleting program deletes rewards

        modelBuilder.Entity<LoyaltyReward>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LoyaltyPromotion>()
            .HasIndex(p => p.PromotionCode)
            .IsUnique();

        modelBuilder.Entity<LoyaltyPromotion>()
            .HasOne(p => p.LoyaltyProgram)
            .WithMany(prog => prog.Promotions)
            .HasForeignKey(p => p.LoyaltyProgramId)
            .OnDelete(DeleteBehavior.Cascade); // Deleting program deletes promotions

        modelBuilder.Entity<LoyaltyPromotion>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<StockAdjustment>()
            .HasOne(a => a.Warehouse)
            .WithMany()
            .HasForeignKey(a => a.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<StockAdjustment>()
            .HasOne(a => a.Product)
            .WithMany()
            .HasForeignKey(a => a.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<StockAdjustment>()
            .HasOne(a => a.Creator)
            .WithMany()
            .HasForeignKey(a => a.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // ======================= CONTRACT MANAGEMENT =======================
        modelBuilder.Entity<ContractParty>(entity =>
        {
            entity.HasIndex(e => e.PartyCode).IsUnique();
            entity.Property(e => e.PartyCode)
                .HasDefaultValueSql("CONCAT('PARTY-', RIGHT('0000' + CAST(NEXT VALUE FOR PartyCodeSeq AS VARCHAR(10)), 4))");
        });

        modelBuilder.Entity<Contract>(entity =>
        {
            entity.HasIndex(e => e.ContractNumber).IsUnique();
            entity.Property(e => e.ContractNumber)
                .HasDefaultValueSql("CONCAT('CON-', RIGHT('0000' + CAST(NEXT VALUE FOR ContractNumberSeq AS VARCHAR(10)), 4))");
            
            // RowVersion for optimistic concurrency
            entity.Property(e => e.RowVersion).IsRowVersion();

            // Foreign Keys
            entity.HasOne(c => c.Party)
                  .WithMany(p => p.Contracts)
                  .HasForeignKey(c => c.PartyId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.Owner)
                  .WithMany()
                  .HasForeignKey(c => c.OwnerId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ContractObligation>(entity =>
        {
            entity.HasOne(o => o.Contract)
                  .WithMany(c => c.Obligations)
                  .HasForeignKey(o => o.ContractId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(o => o.Owner)
                  .WithMany()
                  .HasForeignKey(o => o.OwnerId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ContractApproval>(entity =>
        {
            entity.HasOne(a => a.Contract)
                  .WithMany(c => c.Approvals)
                  .HasForeignKey(a => a.ContractId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Approver)
                  .WithMany()
                  .HasForeignKey(a => a.ApproverId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ======================= SEEDING =======================

        // Seed Admin User
        modelBuilder.Entity<User>().HasData(
            new User
            {
                UserId = 1,
                Username = "admin",
                FirstName = "System",
                LastName = "Administrator",
                Email = "admin@hoshoboms.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123!"),
                Status = UserStatus.Active,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                UserId = 2,
                Username = "manager",
                FirstName = "Test",
                LastName = "Manager",
                Email = "manager@hoshoboms.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager@123!"),
                Status = UserStatus.Active,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                UserId = 103,
                Username = "inv_mgr",
                FirstName = "Inventory",
                LastName = "Manager",
                Email = "inventory@hoshoboms.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass@123!"),
                Status = UserStatus.Active,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                UserId = 104,
                Username = "fin_mgr",
                FirstName = "Finance",
                LastName = "Manager",
                Email = "finance@hoshoboms.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass@123!"),
                Status = UserStatus.Active,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                UserId = 105,
                Username = "con_mgr",
                FirstName = "Contract",
                LastName = "Manager",
                Email = "contract@hoshoboms.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass@123!"),
                Status = UserStatus.Active,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                UserId = 106,
                Username = "loy_mgr",
                FirstName = "Loyalty",
                LastName = "Manager",
                Email = "loyalty@hoshoboms.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass@123!"),
                Status = UserStatus.Active,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                UserId = 107,
                Username = "exec",
                FirstName = "Test",
                LastName = "Executive",
                Email = "executive@hoshoboms.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass@123!"),
                Status = UserStatus.Active,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        // Seed Roles
        var roles = new[]
        {
            new Role { RoleId = 1, RoleName = "Administrator", Description = "System Administrator" },
            new Role { RoleId = 2, RoleName = "Inventory Manager", Description = "Manages inventory" },
            new Role { RoleId = 3, RoleName = "Finance Manager", Description = "Manages finances and approvals" },
            new Role { RoleId = 4, RoleName = "Contract Manager", Description = "Manages contracts" },
            new Role { RoleId = 5, RoleName = "Loyalty Manager", Description = "Manages customer loyalty programs" },
            new Role { RoleId = 6, RoleName = "Management", Description = "General management role" },
            new Role { RoleId = 7, RoleName = "Executive", Description = "Executive view role" }
        };
        modelBuilder.Entity<Role>().HasData(roles);

        // Seed Permissions
        var permissions = new[]
        {
            new Permission { PermissionId = 1, PermissionCode = "Dashboard.View", PermissionName = "View Dashboard", Module = "Dashboard" },
            
            new Permission { PermissionId = 2, PermissionCode = "Users.View", PermissionName = "View Users", Module = "Users" },
            new Permission { PermissionId = 3, PermissionCode = "Users.Create", PermissionName = "Create Users", Module = "Users" },
            new Permission { PermissionId = 4, PermissionCode = "Users.Edit", PermissionName = "Edit Users", Module = "Users" },
            new Permission { PermissionId = 5, PermissionCode = "Users.Manage", PermissionName = "Manage Users", Module = "Users" },
            
            new Permission { PermissionId = 6, PermissionCode = "Roles.View", PermissionName = "View Roles", Module = "Roles" },
            new Permission { PermissionId = 7, PermissionCode = "Roles.Create", PermissionName = "Create Roles", Module = "Roles" },
            new Permission { PermissionId = 8, PermissionCode = "Roles.Edit", PermissionName = "Edit Roles", Module = "Roles" },
            new Permission { PermissionId = 9, PermissionCode = "Roles.Manage", PermissionName = "Manage Roles", Module = "Roles" },
            
            new Permission { PermissionId = 10, PermissionCode = "Notifications.View", PermissionName = "View Notifications", Module = "Notifications" },
            new Permission { PermissionId = 11, PermissionCode = "Notifications.Manage", PermissionName = "Manage Notifications", Module = "Notifications" },
            
            new Permission { PermissionId = 12, PermissionCode = "Settings.View", PermissionName = "View Settings", Module = "Settings" },
            new Permission { PermissionId = 13, PermissionCode = "Settings.Edit", PermissionName = "Edit Settings", Module = "Settings" },

            new Permission { PermissionId = 14, PermissionCode = "Inventory.View", PermissionName = "View Inventory", Module = "Inventory" },
            new Permission { PermissionId = 15, PermissionCode = "Inventory.Create", PermissionName = "Create Inventory", Module = "Inventory" },
            new Permission { PermissionId = 16, PermissionCode = "Inventory.Edit", PermissionName = "Edit Inventory", Module = "Inventory" },
            new Permission { PermissionId = 17, PermissionCode = "Inventory.Delete", PermissionName = "Delete Inventory", Module = "Inventory" },
            new Permission { PermissionId = 18, PermissionCode = "Inventory.Approve", PermissionName = "Approve Inventory", Module = "Inventory" },

            new Permission { PermissionId = 19, PermissionCode = "Contracts.View", PermissionName = "View Contracts", Module = "Contracts" },
            new Permission { PermissionId = 20, PermissionCode = "Contracts.Create", PermissionName = "Create Contracts", Module = "Contracts" },
            new Permission { PermissionId = 21, PermissionCode = "Contracts.Edit", PermissionName = "Edit Contracts", Module = "Contracts" },
            new Permission { PermissionId = 22, PermissionCode = "Contracts.Delete", PermissionName = "Delete Contracts", Module = "Contracts" },
            new Permission { PermissionId = 23, PermissionCode = "Contracts.Approve", PermissionName = "Approve Contracts", Module = "Contracts" },

            new Permission { PermissionId = 24, PermissionCode = "Loyalty.View", PermissionName = "View Loyalty", Module = "Loyalty" },
            new Permission { PermissionId = 25, PermissionCode = "Loyalty.Create", PermissionName = "Create Loyalty", Module = "Loyalty" },
            new Permission { PermissionId = 26, PermissionCode = "Loyalty.Edit", PermissionName = "Edit Loyalty", Module = "Loyalty" },
            new Permission { PermissionId = 27, PermissionCode = "Loyalty.Delete", PermissionName = "Delete Loyalty", Module = "Loyalty" },
            new Permission { PermissionId = 28, PermissionCode = "Loyalty.Manage", PermissionName = "Manage Loyalty", Module = "Loyalty" },

            new Permission { PermissionId = 29, PermissionCode = "Audit.View", PermissionName = "View Audit Logs", Module = "Security" },
            new Permission { PermissionId = 30, PermissionCode = "Activity.View", PermissionName = "View Activity Timeline", Module = "Security" }
        };
        modelBuilder.Entity<Permission>().HasData(permissions);

        // Assign Admin User to Administrator Role
        // Assign Manager User to Management Role (Id: 6)
        modelBuilder.Entity<UserRole>().HasData(
            new UserRole { UserId = 1, RoleId = 1 },
            new UserRole { UserId = 2, RoleId = 6 },
            new UserRole { UserId = 103, RoleId = 2 },
            new UserRole { UserId = 104, RoleId = 3 },
            new UserRole { UserId = 105, RoleId = 4 },
            new UserRole { UserId = 106, RoleId = 5 },
            new UserRole { UserId = 107, RoleId = 7 }
        );

        // Assign all permissions to Administrator
        var adminRolePermissions = permissions.Select(p => new RolePermission { RoleId = 1, PermissionId = p.PermissionId }).ToArray();
        modelBuilder.Entity<RolePermission>().HasData(adminRolePermissions);

        // Helper to get permission IDs by code
        var pMap = permissions.ToDictionary(p => p.PermissionCode, p => p.PermissionId);

        // Seed Role Permissions
        var rolePermissions = new List<RolePermission>();

        // Inventory Manager
        var invMgrPerms = new[] { "Dashboard.View", "Inventory.View", "Inventory.Create", "Inventory.Edit" };
        foreach (var p in invMgrPerms) rolePermissions.Add(new RolePermission { RoleId = 2, PermissionId = pMap[p] });

        // Finance Manager
        var finMgrPerms = new[] { "Dashboard.View", "Inventory.View", "Inventory.Approve", "Contracts.View", "Contracts.Approve" };
        foreach (var p in finMgrPerms) rolePermissions.Add(new RolePermission { RoleId = 3, PermissionId = pMap[p] });

        // Contract Manager
        var conMgrPerms = new[] { "Dashboard.View", "Contracts.View", "Contracts.Create", "Contracts.Edit" };
        foreach (var p in conMgrPerms) rolePermissions.Add(new RolePermission { RoleId = 4, PermissionId = pMap[p] });

        // Loyalty Manager
        var loyMgrPerms = new[] { "Dashboard.View", "Loyalty.View", "Loyalty.Create", "Loyalty.Edit", "Loyalty.Manage" };
        foreach (var p in loyMgrPerms) rolePermissions.Add(new RolePermission { RoleId = 5, PermissionId = pMap[p] });

        // Management
        var mgtPerms = new[] { "Dashboard.View", "Inventory.View", "Contracts.View", "Loyalty.View", "Notifications.View", "Audit.View", "Activity.View" };
        foreach (var p in mgtPerms) rolePermissions.Add(new RolePermission { RoleId = 6, PermissionId = pMap[p] });

        // Executive
        var execPerms = new[] { "Dashboard.View", "Inventory.View", "Contracts.View", "Loyalty.View" };
        foreach (var p in execPerms) rolePermissions.Add(new RolePermission { RoleId = 7, PermissionId = pMap[p] });

        modelBuilder.Entity<RolePermission>().HasData(rolePermissions);

        // Seed 3 unread notifications for admin test user
        modelBuilder.Entity<Notification>().HasData(
            new Notification { NotificationId = 1, RecipientUserId = 1, Type = "System", Priority = "Normal", Title = "Welcome to HOSHO BOMS", Message = "Welcome to the new enterprise system.", IsRead = false, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Notification { NotificationId = 2, RecipientUserId = 1, Type = "Security", Priority = "High", Title = "System Maintenance", Message = "System maintenance scheduled for tonight.", IsRead = false, CreatedAt = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc) },
            new Notification { NotificationId = 3, RecipientUserId = 1, Type = "Inventory", Priority = "Normal", Title = "Low Stock Alert", Message = "Widget X is running low on stock.", ReferenceType = "Inventory", ReferenceId = "W-100", IsRead = false, CreatedAt = new DateTime(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc) },
            new Notification { NotificationId = 4, RecipientUserId = 2, Type = "Approval", Priority = "Critical", Title = "Contract Approval Required", Message = "Contract #992 awaits your approval.", ReferenceType = "Contract", ReferenceId = "992", IsRead = false, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        // Seed some system activities
        modelBuilder.Entity<Activity>().HasData(
            new Activity { ActivityId = 1, UserId = 1, Module = "Users", EntityType = "User", EntityId = "2", Action = "Created", Description = "Created user Test Manager", Timestamp = DateTime.UtcNow.AddMinutes(-10) },
            new Activity { ActivityId = 2, UserId = 2, Module = "Inventory", EntityType = "Inventory", EntityId = "W-100", Action = "Updated", Description = "Updated stock for Widget X", Timestamp = DateTime.UtcNow.AddMinutes(-25) },
            new Activity { ActivityId = 3, UserId = 1, Module = "Roles", EntityType = "Role", EntityId = "1", Action = "Modified", Description = "Modified permissions for Administrator role", Timestamp = DateTime.UtcNow.AddHours(-1) },
            new Activity { ActivityId = 4, UserId = 2, Module = "Contracts", EntityType = "Contract", EntityId = "992", Action = "Approved", Description = "Approved Contract #992", Timestamp = DateTime.UtcNow.AddHours(-2) }
        );
    }
}
