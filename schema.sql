DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(32) NOT NULL,
  `guild_id` varchar(32) NOT NULL,
  `channel_id` varchar(32) NOT NULL,
  `join_time` datetime NOT NULL,
  `leave_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_guild` (`user_id`,`guild_id`),
  KEY `idx_leave_time` (`leave_time`)
) ENGINE=InnoDB AUTO_INCREMENT=687 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(32) NOT NULL,
  `guild_id` varchar(32) NOT NULL,
  `total_seconds` int(11) NOT NULL DEFAULT 0,
  `last_level` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_guild_unique` (`user_id`,`guild_id`),
  KEY `idx_user_guild` (`user_id`,`guild_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1215 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
