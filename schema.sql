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
  `AccountNumber` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `AccountType` varchar(255) DEFAULT NULL,
  `AccountName` text,
  `InitialBalance` decimal(20,2) DEFAULT NULL,
  `SortOrder` int(11) unsigned DEFAULT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CreatedBy` int(11) unsigned NOT NULL,
  PRIMARY KEY (`AccountNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;