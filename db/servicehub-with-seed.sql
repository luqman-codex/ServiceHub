/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;
DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `SequelizeMeta` WRITE;
/*!40000 ALTER TABLE `SequelizeMeta` DISABLE KEYS */;
INSERT INTO `SequelizeMeta` VALUES
('0001-create-roles.js'),
('0002-create-users.js'),
('0003-create-categories.js'),
('0004-create-provider-profiles.js'),
('0005-create-provider-availability.js'),
('0006-create-services.js'),
('0007-create-bookings.js'),
('0008-create-payments.js'),
('0009-create-notifications.js');
/*!40000 ALTER TABLE `SequelizeMeta` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint(20) unsigned NOT NULL,
  `provider_id` bigint(20) unsigned DEFAULT NULL,
  `service_id` bigint(20) unsigned NOT NULL,
  `status` enum('PENDING','ACCEPTED','REJECTED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `scheduled_at` datetime(3) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `address` varchar(500) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `accepted_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) DEFAULT NULL,
  `completed_at` datetime(3) DEFAULT NULL,
  `cancelled_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_bookings_customer_id` (`customer_id`),
  KEY `idx_bookings_provider_id` (`provider_id`),
  KEY `idx_bookings_service_id` (`service_id`),
  KEY `idx_bookings_status` (`status`),
  KEY `idx_bookings_scheduled_at` (`scheduled_at`),
  KEY `idx_bookings_status_scheduled` (`status`,`scheduled_at`),
  CONSTRAINT `fk_bookings_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_provider` FOREIGN KEY (`provider_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES
(1,4,NULL,1,'PENDING','2026-06-25 10:00:00.000',79.99,'USD','12 Maple St','Please bring eco supplies',NULL,NULL,NULL,NULL,NULL,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(2,4,2,2,'ACCEPTED','2026-06-26 14:00:00.000',29.99,'USD','12 Maple St',NULL,NULL,'2026-06-19 09:30:00.000',NULL,NULL,NULL,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(3,5,3,3,'COMPLETED','2026-06-10 11:00:00.000',49.99,'USD','88 Oak Ave','Kitchen sink leak',NULL,'2026-06-09 12:00:00.000','2026-06-10 11:05:00.000','2026-06-10 12:20:00.000',NULL,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(4,4,NULL,1,'PENDING','2026-07-01 10:00:00.000',79.99,'USD','99 Test Ave','smoke test booking',NULL,NULL,NULL,NULL,NULL,'2026-06-18 23:51:13.000','2026-06-18 23:51:13.000'),
(5,4,2,1,'COMPLETED','2026-07-01 10:00:00.000',79.99,'USD','99 Test Ave','smoke test',NULL,'2026-06-18 23:54:01.000','2026-06-18 23:54:01.000','2026-06-18 23:54:01.000',NULL,'2026-06-18 23:54:01.000','2026-06-18 23:54:01.000');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `slug` varchar(140) NOT NULL,
  `description` text DEFAULT NULL,
  `icon_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_name` (`name`),
  UNIQUE KEY `uq_categories_slug` (`slug`),
  KEY `idx_categories_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES
(1,'Cleaning','cleaning','Home and office cleaning services',NULL,1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(2,'Plumbing','plumbing','Repairs and installations',NULL,1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(3,'Salon at Home','salon-at-home','Beauty and grooming at home',NULL,1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(4,'Electrical','electrical','Electrical repairs and fittings',NULL,1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `booking_id` bigint(20) unsigned DEFAULT NULL,
  `type` enum('BOOKING_CREATED','BOOKING_ACCEPTED','BOOKING_REJECTED','BOOKING_IN_PROGRESS','BOOKING_COMPLETED','BOOKING_CANCELLED','PAYMENT','SYSTEM') NOT NULL,
  `title` varchar(160) NOT NULL,
  `body` text DEFAULT NULL,
  `is_read` tinyint(4) NOT NULL DEFAULT 0,
  `read_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_booking_id` (`booking_id`),
  KEY `idx_notifications_user_unread` (`user_id`,`is_read`),
  CONSTRAINT `fk_notifications_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES
(1,4,1,'BOOKING_CREATED','Booking placed','Your Deep Home Cleaning request is pending.',0,NULL,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(2,4,2,'BOOKING_ACCEPTED','Booking accepted','Pat Provider accepted your Bathroom Cleaning.',0,NULL,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(3,5,3,'BOOKING_COMPLETED','Service completed','Your Leak Repair is complete.',1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(4,4,4,'BOOKING_CREATED','Booking placed','Your booking request is pending.',0,NULL,'2026-06-18 23:51:13.000','2026-06-18 23:51:13.000'),
(5,4,5,'BOOKING_CREATED','Booking placed','Your booking request is pending.',0,NULL,'2026-06-18 23:54:01.000','2026-06-18 23:54:01.000'),
(6,4,5,'BOOKING_ACCEPTED','Booking accepted','Your booking is now ACCEPTED.',0,NULL,'2026-06-18 23:54:01.000','2026-06-18 23:54:01.000'),
(7,4,5,'BOOKING_IN_PROGRESS','Booking in progress','Your booking is now IN_PROGRESS.',0,NULL,'2026-06-18 23:54:01.000','2026-06-18 23:54:01.000'),
(8,4,5,'BOOKING_COMPLETED','Booking completed','Your booking is now COMPLETED.',0,NULL,'2026-06-18 23:54:01.000','2026-06-18 23:54:01.000');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `booking_id` bigint(20) unsigned NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `method` enum('CARD','CASH','WALLET','MOCK') NOT NULL DEFAULT 'MOCK',
  `status` enum('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `transaction_ref` varchar(80) DEFAULT NULL,
  `paid_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payments_booking_id` (`booking_id`),
  UNIQUE KEY `uq_payments_transaction_ref` (`transaction_ref`),
  KEY `idx_payments_status` (`status`),
  CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES
(1,3,49.99,'USD','MOCK','PAID','MOCK-TXN-0001','2026-06-10 12:21:00.000','2026-06-18 23:49:27.000','2026-06-18 23:49:27.000');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `provider_availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `provider_availability` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `provider_id` bigint(20) unsigned NOT NULL,
  `day_of_week` enum('MON','TUE','WED','THU','FRI','SAT','SUN') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_available` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pa_provider_day_start` (`provider_id`,`day_of_week`,`start_time`),
  KEY `idx_pa_provider_id` (`provider_id`),
  CONSTRAINT `fk_provider_availability_provider` FOREIGN KEY (`provider_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `provider_availability` WRITE;
/*!40000 ALTER TABLE `provider_availability` DISABLE KEYS */;
INSERT INTO `provider_availability` VALUES
(1,2,'MON','09:00:00','17:00:00',1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(2,2,'WED','09:00:00','17:00:00',1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(3,2,'FRI','09:00:00','13:00:00',1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(4,3,'TUE','10:00:00','18:00:00',1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(5,3,'THU','10:00:00','18:00:00',1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000');
/*!40000 ALTER TABLE `provider_availability` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `provider_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `provider_profiles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `bio` text DEFAULT NULL,
  `skills` varchar(500) DEFAULT NULL,
  `service_area` varchar(255) DEFAULT NULL,
  `rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `is_verified` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_provider_profiles_user_id` (`user_id`),
  KEY `idx_provider_profiles_rating` (`rating`),
  CONSTRAINT `fk_provider_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `provider_profiles` WRITE;
/*!40000 ALTER TABLE `provider_profiles` DISABLE KEYS */;
INSERT INTO `provider_profiles` VALUES
(1,2,'Experienced home cleaning professional.','deep-cleaning,kitchen,bathroom','Downtown',4.80,1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(2,3,'Licensed plumber, 8 years experience.','leak-repair,installation,drainage','Uptown',4.60,1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000');
/*!40000 ALTER TABLE `provider_profiles` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` enum('CUSTOMER','PROVIDER','ADMIN') NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roles_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES
(1,'CUSTOMER','End user who browses and books services','2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(2,'PROVIDER','Professional who fulfills bookings','2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(3,'ADMIN','Platform operator managing users, catalog, bookings','2026-06-18 23:49:27.000','2026-06-18 23:49:27.000');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint(20) unsigned NOT NULL,
  `name` varchar(160) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `duration_minutes` int(10) unsigned DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_services_category_name` (`category_id`,`name`),
  KEY `idx_services_category_id` (`category_id`),
  KEY `idx_services_is_active` (`is_active`),
  KEY `idx_services_name` (`name`),
  CONSTRAINT `fk_services_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES
(1,1,'Deep Home Cleaning','Full-home deep cleaning',79.99,'USD',180,NULL,1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(2,1,'Bathroom Cleaning','Single bathroom deep clean',29.99,'USD',60,NULL,1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(3,2,'Leak Repair','Fix leaking pipes/taps',49.99,'USD',90,NULL,1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(4,2,'Water Heater Install','Install a new water heater',149.99,'USD',150,NULL,1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(5,3,'Haircut at Home','Professional haircut at your home',24.99,'USD',45,NULL,1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(6,3,'Manicure & Pedicure','Hand and foot grooming',39.99,'USD',75,NULL,1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(7,4,'Switch/Socket Repair','Repair faulty switches/sockets',34.99,'USD',60,NULL,1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(8,4,'Ceiling Fan Installation','Mount and wire a ceiling fan',44.99,'USD',90,NULL,1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint(20) unsigned NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(190) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role_id` (`role_id`),
  KEY `idx_users_phone` (`phone`),
  KEY `idx_users_is_active` (`is_active`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,3,'Platform Admin','admin@servicehub.test','+10000000001','$2a$10$F9IT4.nLFgtSYDgzPFGs7uTCy38qIQ.n3Axm2RyZn2WsDoZ9CMGZa',1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(2,2,'Pat Provider','provider1@servicehub.test','+10000000002','$2a$10$SGP9hNNQ8qe/71bjsMf0HejqozvZyxaKkaSsMwpYK4NeWaOD3yjHK',1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(3,2,'Quinn Plumber','provider2@servicehub.test','+10000000003','$2a$10$QR1FaQS/enipImquYHSomuyaE3qCVBNEZYIp2ZgKG4iDrdwTWAxuC',1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(4,1,'Casey Customer','customer1@servicehub.test','+10000000004','$2a$10$uEx2nWczjgtvK/uEL6sL0OnHvuJ0GVpah/wmWGC1KyhgE0q3WYJS.',1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000'),
(5,1,'Dana Customer','customer2@servicehub.test','+10000000005','$2a$10$mmLCVYcBYqWuhyTtAiKw4.akLbtNkEUSPnVXocjcWSod4Fy03AyiO',1,'2026-06-18 23:49:27.000','2026-06-18 23:49:27.000');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

