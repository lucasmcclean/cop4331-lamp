DROP TABLE IF EXISTS `Contacts`, `Users`;

CREATE TABLE `Users` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `First Name` varchar(50) NOT NULL DEFAULT '',
  `Last Name` varchar(50) NOT NULL DEFAULT '',
  `Login` varchar(50) NOT NULL DEFAULT '',
  `Password` varchar(255) NOT NULL DEFAULT '',
  `Date Created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Date Updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `idx_users_login` (`Login`)
);

CREATE TABLE `Contacts` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `First Name` varchar(50) NOT NULL DEFAULT '',
  `Last Name` varchar(50) NOT NULL DEFAULT '',
  `E-mail Address` varchar(50) NOT NULL DEFAULT '',
  `Phone Number` varchar(50) NOT NULL DEFAULT '',
  `Date Created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Date Updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `UserID` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`),
  KEY `UserID` (`UserID`),
  KEY `idx_contacts_name` (`First Name`,`Last Name`),
  CONSTRAINT `fk_Contacts_UserID` FOREIGN KEY (`UserID`) REFERENCES `Users` (`ID`)
);