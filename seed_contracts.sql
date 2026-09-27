-- Setup variables
DECLARE @PartyId INT = 1;
DECLARE @OwnerId INT = 1;
DECLARE @Now DATETIME2 = GETUTCDATE();
DECLARE @Yesterday DATETIME2 = DATEADD(day, -1, @Now);
DECLARE @NextYear DATETIME2 = DATEADD(year, 1, @Now);

-- 1. Active Contract
INSERT INTO Contracts (ContractNumber, Title, ContractType, Description, PartyId, StartDate, EndDate, ContractValue, Currency, OwnerId, Status, CreatedAt, UpdatedAt)
VALUES ('C-TEST-001', 'Sample Active Contract', 'Service Agreement', 'Sample data for UI testing', @PartyId, DATEADD(month, -1, @Now), @NextYear, 50000.00, 'USD', @OwnerId, 'Active', @Now, @Now);

DECLARE @ActiveContractId INT = SCOPE_IDENTITY();

-- 2. Expired Contract
INSERT INTO Contracts (ContractNumber, Title, ContractType, Description, PartyId, StartDate, EndDate, ContractValue, Currency, OwnerId, Status, CreatedAt, UpdatedAt)
VALUES ('C-TEST-002', 'Sample Expired Contract', 'NDA', 'Sample expired data', @PartyId, DATEADD(year, -1, @Now), @Yesterday, 0.00, 'USD', @OwnerId, 'Expired', @Now, @Now);

-- 3. Pending Approval Contract
INSERT INTO Contracts (ContractNumber, Title, ContractType, Description, PartyId, StartDate, EndDate, ContractValue, Currency, OwnerId, Status, CreatedAt, UpdatedAt)
VALUES ('C-TEST-003', 'Sample Pending Contract', 'Software License', 'Sample pending approval', @PartyId, @Now, @NextYear, 12000.00, 'USD', @OwnerId, 'Pending Approval', @Now, @Now);

DECLARE @PendingContractId INT = SCOPE_IDENTITY();

-- Add Approval Flow for Pending Contract
INSERT INTO ContractApprovals (ContractId, ApproverId, Action, Status, Date)
VALUES (@PendingContractId, @OwnerId, 'Pending', 'Pending', @Now);

-- 4. Contract Obligation for Active Contract
INSERT INTO ContractObligations (ContractId, Title, Description, DueDate, Status, OwnerId, Priority, CreatedAt, UpdatedAt)
VALUES (@ActiveContractId, 'Periodic Review', 'Sample Periodic Review', DATEADD(month, 1, @Now), 'Pending', @OwnerId, 'Medium', @Now, @Now);

SELECT 'Sample data inserted successfully.' AS Result;
