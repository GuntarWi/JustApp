UG hollder

SELECT
    [PurchasesOC_Voids].[CashierId] AS [CashierId],
    [Cashiers].[Name] AS [CashierName], -- Add the CashierName here
    [PurchasesOC_Voids].[FamilyIslandId] AS [FamilyIslandId],
    [PurchasesOC_Voids].[FranchiseId] AS [FranchiseId],
    [PurchasesOC_Voids].[LastUpdated] AS [LastUpdated],
    [PurchasesOC_Voids].[Location] AS [Location],
    [PurchasesOC_Voids].[PurchaseAmount] AS [PurchaseAmount],
    [PurchasesOC_Voids].[PurchaseDate] AS [PurchaseDate],
    [PurchasesOC_Voids].[PurchaseId] AS [PurchaseId],
  [PurchasesOC_Voids].[VoidDate] AS [VoidDate],

	[PurchasesOC_Voids].[Method] AS [Method],
	[PurchasesOC_Voids].[Notes] AS [Notes],
	[PurchasesOC_Voids].[ReasonCode] AS [ReasonCode],


    NULL AS [CreditCard],
    NULL AS [Platform],
    NULL AS [PlayerId],
    'Void' AS [Status],
    'N/A' AS [Store],
    NULL AS [Tax],
    NULL AS [TransactionAmount],
    NULL AS [TransactionDate],
    NULL AS [TransactionID],
    NULL AS [TransactionOriginalDate],
       'Ticket Void' AS [TransactionType]
FROM [dbo].[PurchasesOC_Voids] [PurchasesOC_Voids]
LEFT JOIN [dbo].[Cashiers] [Cashiers] 
    ON [PurchasesOC_Voids].[CashierId] = [Cashiers].[CashierId]

UNION ALL

SELECT
    [Transactions].[CashierId] AS [CashierId],
    [Cashiers].[Name] AS [CashierName], 
    NULL AS [FamilyIslandId],
    NULL AS [FranchiseId],
    [Transactions].[LastUpdated] AS [LastUpdated],
    [Transactions].[Location] AS [Location],
    NULL AS [PurchaseAmount],
    NULL AS [PurchaseDate],
    [Transactions].[PurchaseId] AS [PurchaseId],
    [Transactions].[TransactionDate] AS [VoidDate],

	NULL AS [Method],
	NULL AS [Notes],
	NULL AS [ReasonCode],


    [Transactions].[CreditCard] AS [CreditCard],
    [Transactions].[Platform] AS [Platform],
    [Transactions].[PlayerId] AS [PlayerId],
    [Transactions].[Status] AS [Status],
    [Transactions].[Store] AS [Store],
    [Transactions].[Tax] AS [Tax],
    [Transactions].[TransactionAmount] AS [TransactionAmount],
    [Transactions].[TransactionDate] AS [TransactionDate],
    [Transactions].[TransactionID] AS [TransactionID],
    [Transactions].[TransactionOriginalDate] AS [TransactionOriginalDate],
    [Transactions].[TransactionType] AS [TransactionType]
FROM [dbo].[Transactions] [Transactions]
LEFT JOIN [dbo].[Cashiers] [Cashiers] 
    ON [Transactions].[CashierId] = [Cashiers].[CashierId]
WHERE [Transactions].[TransactionType] = 'Deposit Void'