CREATE TABLE `AccountType` (
  `AccountType` varchar(255) NOT NULL DEFAULT 'ASSET',
  `MinCode` int(11) unsigned NOT NULL DEFAULT '0',
  `MaxCode` int(11) DEFAULT NULL,
  `IncreaseEntry` enum('CREDIT','DEBIT') DEFAULT NULL,
  PRIMARY KEY (`AccountType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `AccountType` (`AccountType`, `MinCode`, `MaxCode`, `IncreaseEntry`)
VALUES
	('Asset', 100, 199, 'DEBIT'),
	('Liability', 200, 250, 'CREDIT'),
	('Equity', 290, 299, 'CREDIT'),
	('Revenue', 300, 499, 'CREDIT'),
	('Expense', 500, 799, 'DEBIT');
	
	
CREATE TABLE `Account` (
  `AccountNumber` int(11) unsigned NOT NULL,
  `AccountType` varchar(255) DEFAULT NULL,
  `AccountName` text,
  `InitialBalance` decimal(20,2) DEFAULT NULL,
  `SortOrder` int(11) unsigned DEFAULT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CreatedBy` int(11) unsigned NOT NULL,
  PRIMARY KEY (`AccountNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `Account` (`AccountNumber`, `AccountType`, `AccountName`, `InitialBalance`, `SortOrder`, `Active`, `CreatedTime`, `CreatedBy`)
VALUES
	(101, 'Asset', 'Cash\"', 0.00, 101, 1, '2017-02-09 19:41:04', 0),
	(120, 'Asset', 'Accounts Receivable', 0.00, 120, 1, '2017-02-09 19:41:27', 0),
	(140, 'Asset', 'Merchandise Inventory', 0.00, 140, 1, '2017-02-09 19:42:00', 0),
	(150, 'Asset', 'Supplies', 0.00, 150, 1, '2017-02-09 19:42:10', 0),
	(160, 'Asset', 'Prepaid Insurance', 0.00, 160, 1, '2017-02-09 19:42:23', 0),
	(170, 'Asset', 'Land', 0.00, 170, 1, '2017-02-09 19:42:35', 0),
	(175, 'Asset', 'Buildings', 0.00, 175, 1, '2017-02-09 19:42:56', 0),
	(178, 'Asset', 'Accumulated Depreciation - Buildings', 0.00, 178, 0, '2017-02-09 19:43:28', 0),
	(180, 'Asset', 'Equipment', 0.00, 180, 1, '2017-02-09 19:43:46', 0),
	(188, 'Asset', 'Accumulated Depreciation - Equipment', 0.00, 188, 0, '2017-02-09 19:44:19', 0),
	(210, 'Liability', 'Notes Payable', 0.00, 210, 1, '2017-02-09 19:44:40', 0),
	(215, 'Liability', 'Accounts Payable', 0.00, 215, 1, '2017-02-09 19:44:55', 0),
	(220, 'Liability', 'Wages Payable', 0.00, 230, 1, '2017-02-09 19:45:17', 0),
	(230, 'Liability', 'Interest Payable', 0.00, 230, 1, '2017-02-09 19:45:34', 0),
	(240, 'Liability', 'Unearned Revenues', 0.00, 240, 1, '2017-02-09 19:45:57', 0),
	(250, 'Liability', 'Mortgage Loan Payable', 0.00, 250, 1, '2017-02-09 19:46:39', 0),
	(290, 'Equity', 'Owner\'s Capital', 0.00, 290, 1, '2017-02-09 19:47:03', 0),
	(295, 'Equity', 'Owner\'s Drawings', 0.00, 295, 0, '2017-02-09 19:47:25', 0),
	(310, 'Revenue', 'Service Revenues', 0.00, 310, 1, '2017-02-09 19:47:46', 0),
	(500, 'Expense', 'Salaries Expense', 0.00, 500, 1, '2017-02-09 19:48:05', 0),
	(510, 'Expense', 'Wages Expense', 0.00, 510, 1, '2017-02-09 19:48:22', 0),
	(540, 'Expense', 'Supplies Expense', 0.00, 540, 1, '2017-02-09 19:48:41', 0),
	(560, 'Expense', 'Rent Expense', 0.00, 540, 1, '2017-02-09 19:48:55', 0),
	(570, 'Expense', 'Utilities Expense', 0.00, 570, 1, '2017-02-09 19:49:22', 0),
	(576, 'Expense', 'Telephone Expense', 0.00, 576, 1, '2017-02-09 19:49:42', 0),
	(610, 'Expense', 'Advertising Expense', 0.00, 610, 1, '2017-02-09 19:49:57', 0),
	(750, 'Expense', 'Depreciation Expense', 0.00, 750, 1, '2017-02-09 19:50:18', 0);

CREATE TABLE `Journal` (
  `JournalId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `Description` text NOT NULL,
  `Closed` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`JournalId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `Entry` (
  `EntryId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `Description` text NOT NULL,
  `CreatedDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `State` varchar(255) DEFAULT NULL,
  `DeclinedReason` text,
  PRIMARY KEY (`EntryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `Employee` (
  `EmployeeId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `Username` varchar(255) NOT NULL DEFAULT '',
  `PassHash` varchar(255) NOT NULL DEFAULT '',
  `Permissions` text NOT NULL,
  `Disabled` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`EmployeeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `File` (
  `FileId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `EntryId` int(11) DEFAULT NULL,
  `Filename` text NOT NULL,
  `MimeType` varchar(255) NOT NULL,
  `Size` int(11) NOT NULL,
  `CreatedDate` datetime NOT NULL,
  `Path` text NOT NULL,
  PRIMARY KEY (`FileId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;