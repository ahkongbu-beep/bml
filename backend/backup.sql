-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: oncare-db-oncare.i.aivencloud.com    Database: bml
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
--

--
-- Table structure for table `ads`
--

DROP TABLE IF EXISTS `ads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `advertiser_id` int NOT NULL COMMENT '광고주 PK',
  `amount` int NOT NULL DEFAULT '0' COMMENT '광고비용',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `is_active` enum('Y','N') NOT NULL DEFAULT 'Y' COMMENT '사용 여부',
  `contents` text COMMENT '설명',
  `target_link` text COMMENT '외부링크',
  `click_count` int NOT NULL DEFAULT '0' COMMENT '광고 클릭 수',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `view_hash` varchar(255) NOT NULL DEFAULT '' COMMENT 'view_hash',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_view_hash` (`view_hash`),
  KEY `idx_advertiser_id` (`advertiser_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ads_clicks_logs`
--

DROP TABLE IF EXISTS `ads_clicks_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ads_clicks_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ads_id` int NOT NULL DEFAULT '0' COMMENT '광고.pk',
  `user_id` int NOT NULL DEFAULT '0' COMMENT 'user.pk',
  `ip` varchar(20) NOT NULL DEFAULT '' COMMENT '클릭 ip',
  `user_agent` text COMMENT 'user_agent',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `advertisers`
--

DROP TABLE IF EXISTS `advertisers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `advertisers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company` varchar(50) NOT NULL DEFAULT '' COMMENT '회사명',
  `company_number` varchar(20) NOT NULL DEFAULT '' COMMENT '사업자번호',
  `account_id` varchar(50) NOT NULL DEFAULT '' COMMENT '광고 담당자ID',
  `account_name` varchar(50) NOT NULL DEFAULT '' COMMENT '광고 담당자명',
  `account_email` varchar(100) NOT NULL DEFAULT '' COMMENT '담당자 email',
  `account_tel` varchar(20) NOT NULL DEFAULT '' COMMENT '광고 담당자 연락처',
  `account_image` varchar(255) NOT NULL DEFAULT '' COMMENT '광고담당자 프로필이미지',
  `company_biz` varchar(30) NOT NULL DEFAULT '' COMMENT '업태',
  `company_item` varchar(30) NOT NULL DEFAULT '' COMMENT '업종',
  `is_active` enum('Y','N') NOT NULL DEFAULT 'Y' COMMENT '사용여부',
  `description` text COMMENT '비고',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `view_hash` varchar(255) NOT NULL DEFAULT '' COMMENT 'view_hash',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_account` (`company_number`,`account_id`,`is_active`),
  UNIQUE KEY `uniq_view_hash` (`view_hash`),
  KEY `idx_company` (`company`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `attaches_files`
--

DROP TABLE IF EXISTS `attaches_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attaches_files` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `img_model` varchar(50) NOT NULL DEFAULT '' COMMENT 'img_model',
  `img_model_id` int NOT NULL COMMENT 'feeds.id',
  `image_url` varchar(500) NOT NULL COMMENT '이미지 경로(URL)',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '정렬 순서 (0=첫번째)',
  `width` int DEFAULT NULL COMMENT '원본 width',
  `height` int DEFAULT NULL COMMENT '원본 height',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_active` enum('Y','N') DEFAULT 'Y' COMMENT '사용여부',
  PRIMARY KEY (`id`),
  KEY `idx_feed_id` (`img_model`,`img_model_id`)
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categories_codes`
--

DROP TABLE IF EXISTS `categories_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL DEFAULT '' COMMENT '카테고리 타입',
  `code` varchar(50) NOT NULL DEFAULT '' COMMENT '카테고리 코드',
  `value` varchar(255) NOT NULL DEFAULT '' COMMENT '카테고리 값',
  `sort` int NOT NULL DEFAULT '0' COMMENT '순서',
  `is_active` varchar(3) NOT NULL DEFAULT 'Y' COMMENT '사용여부',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_type_sort` (`type`,`sort`),
  UNIQUE KEY `uniq_type_code` (`type`,`code`),
  KEY `idx_type_code` (`type`,`code`),
  KEY `idx_type_value` (`type`,`value`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '댓글 ID',
  `comment_model` varchar(50) NOT NULL DEFAULT '' COMMENT 'model',
  `comment_model_id` int unsigned NOT NULL DEFAULT '0' COMMENT 'model_id',
  `user_id` int unsigned NOT NULL DEFAULT '0' COMMENT '댓글 작성자 직원 ID',
  `parent_id` int unsigned DEFAULT NULL COMMENT '부모 댓글 ID (대댓글용)',
  `comment` text NOT NULL COMMENT '댓글 내용',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성 시간',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
  `deleted_at` datetime DEFAULT NULL COMMENT '삭제 시간 (soft delete)',
  `view_hash` varchar(255) NOT NULL DEFAULT '' COMMENT 'view_hash',
  `parent_hash` varchar(255) NOT NULL DEFAULT '' COMMENT '부모 해쉬',
  PRIMARY KEY (`id`),
  KEY `idx_comment_item` (`comment_model`,`comment_model_id`),
  KEY `idx_comment_user` (`comment_model`,`user_id`),
  KEY `idx_parent_id` (`comment_model`,`parent_id`),
  KEY `idx_view_hash` (`view_hash`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `communities`
--

DROP TABLE IF EXISTS `communities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `communities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category_code` int NOT NULL DEFAULT '0' COMMENT '분류코드',
  `user_id` int NOT NULL DEFAULT '0' COMMENT '회원 ID',
  `title` varchar(255) NOT NULL DEFAULT '' COMMENT 'title',
  `contents` text COMMENT 'contents',
  `user_nickname` varchar(50) NOT NULL DEFAULT '' COMMENT '작성 시점 닉네임',
  `user_ip` varchar(30) NOT NULL DEFAULT '' COMMENT '작성자 IP',
  `view_count` int NOT NULL DEFAULT '0' COMMENT '조회수',
  `like_count` int NOT NULL DEFAULT '0' COMMENT '좋아요 카운트',
  `is_secret` char(1) NOT NULL DEFAULT 'N' COMMENT '비밀글 여부(Y/N)',
  `is_active` char(1) NOT NULL DEFAULT 'N' COMMENT '사용여부(Y/N)',
  `is_notice` char(1) NOT NULL DEFAULT 'N' COMMENT '공지글 여부',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '등록시간',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '수정시간',
  `deleted_at` datetime DEFAULT NULL COMMENT '삭제시간',
  `pinned_at` datetime DEFAULT NULL COMMENT '고정시간(공지글인경우)',
  `view_hash` varchar(255) NOT NULL DEFAULT '' COMMENT 'view_hash',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_view_hash` (`view_hash`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `communities_comments`
--

DROP TABLE IF EXISTS `communities_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `communities_comments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '댓글 ID',
  `community_id` int unsigned NOT NULL DEFAULT '0' COMMENT '커뮤니티 ID (커뮤니티 테이블 참조)',
  `user_id` int unsigned NOT NULL DEFAULT '0' COMMENT '댓글 작성자 직원 ID',
  `parent_id` int unsigned DEFAULT NULL COMMENT '부모 댓글 ID (대댓글용)',
  `comment` text NOT NULL COMMENT '댓글 내용',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성 시간',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
  `deleted_at` datetime DEFAULT NULL COMMENT '삭제 시간 (soft delete)',
  `view_hash` varchar(255) NOT NULL DEFAULT '' COMMENT 'view_hash',
  `parent_hash` varchar(255) NOT NULL DEFAULT '' COMMENT '부모 해쉬',
  PRIMARY KEY (`id`),
  KEY `idx_community_id` (`community_id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_view_hash` (`view_hash`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `communities_likes`
--

DROP TABLE IF EXISTS `communities_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `communities_likes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `community_id` int unsigned NOT NULL DEFAULT '0' COMMENT 'feed.pk',
  `user_id` int unsigned NOT NULL COMMENT 'users.pk',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_community_user` (`community_id`,`user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `denies_users`
--

DROP TABLE IF EXISTS `denies_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `denies_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL DEFAULT '0' COMMENT '요청 user.pk',
  `deny_user_id` int NOT NULL DEFAULT '0' COMMENT '차단 user.pk',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_deny_user` (`user_id`,`deny_user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feeds_images`
--

DROP TABLE IF EXISTS `feeds_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feeds_images` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `img_model` varchar(50) NOT NULL DEFAULT '' COMMENT 'img_model',
  `img_model_id` int NOT NULL COMMENT 'feeds.id',
  `image_url` varchar(500) NOT NULL COMMENT '이미지 경로(URL)',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '정렬 순서 (0=첫번째)',
  `width` int DEFAULT NULL COMMENT '원본 width',
  `height` int DEFAULT NULL COMMENT '원본 height',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_active` enum('Y','N') DEFAULT 'Y' COMMENT '사용여부',
  PRIMARY KEY (`id`),
  KEY `idx_feed_id` (`img_model_id`)
) ENGINE=InnoDB AUTO_INCREMENT=179 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feeds_likes`
--

DROP TABLE IF EXISTS `feeds_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feeds_likes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `feed_id` int unsigned NOT NULL DEFAULT '0' COMMENT 'feed.pk',
  `user_id` int unsigned NOT NULL COMMENT 'users.pk',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_feed_user` (`feed_id`,`user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feeds_tags_mappers`
--

DROP TABLE IF EXISTS `feeds_tags_mappers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feeds_tags_mappers` (
  `feed_id` bigint NOT NULL,
  `tag_id` bigint NOT NULL,
  `model` varchar(50) NOT NULL DEFAULT '' COMMENT 'model 정보',
  PRIMARY KEY (`feed_id`,`tag_id`,`model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `foods_items`
--

DROP TABLE IF EXISTS `foods_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foods_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `food_code` varchar(50) NOT NULL COMMENT '고정 코드',
  `food_type` varchar(50) NOT NULL DEFAULT 'food',
  `food_name` varchar(50) NOT NULL COMMENT '식품명',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_code` (`food_code`),
  UNIQUE KEY `uq_type_name` (`food_type`,`food_name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `growths`
--

DROP TABLE IF EXISTS `growths`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `growths` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL COMMENT '타입',
  `months` decimal(4,1) NOT NULL COMMENT '개월수',
  `gender` enum('M','W') NOT NULL COMMENT '성별',
  `percent` varchar(10) NOT NULL DEFAULT '' COMMENT '백분률',
  `value` decimal(4,1) NOT NULL DEFAULT '0.0' COMMENT '수치',
  `is_active` enum('Y','N') NOT NULL DEFAULT 'Y' COMMENT '사용여부',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_growth` (`type`,`months`,`gender`,`percent`),
  KEY `idx_growth` (`type`,`gender`)
) ENGINE=InnoDB AUTO_INCREMENT=4753 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `growths_reports`
--

DROP TABLE IF EXISTS `growths_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `growths_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT 'users.id',
  `child_id` int NOT NULL DEFAULT '0' COMMENT 'user_child.id',
  `type` varchar(50) NOT NULL COMMENT '리포트 타입',
  `months` decimal(4,1) NOT NULL COMMENT '개월수',
  `value` decimal(4,1) NOT NULL COMMENT '아이 현재 수치',
  `percent` varchar(10) NOT NULL DEFAULT '' COMMENT '아이 현재 백분률',
  `created_at` date NOT NULL DEFAULT (curdate()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_user_report` (`type`,`user_id`,`child_id`,`created_at`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_child` (`user_id`,`child_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ingredients`
--

DROP TABLE IF EXISTS `ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredients` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '재료명',
  `category` varchar(50) DEFAULT NULL COMMENT '채소, 과일, 육류 등',
  `allergy_risk` varchar(20) DEFAULT 'LOW' COMMENT 'LOW, MEDIUM, HIGH',
  `recommended_stage` varchar(20) DEFAULT NULL COMMENT '이유식 단계 (6m+, 8m+)',
  `is_active` char(1) DEFAULT 'Y',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ingredients_mappers`
--

DROP TABLE IF EXISTS `ingredients_mappers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredients_mappers` (
  `meal_id` bigint NOT NULL,
  `ingredient_id` bigint NOT NULL,
  `score` decimal(3,2) NOT NULL DEFAULT '0.00' COMMENT '정량점수',
  PRIMARY KEY (`meal_id`,`ingredient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ingredients_nutritions`
--

DROP TABLE IF EXISTS `ingredients_nutritions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredients_nutritions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ingredient_id` bigint NOT NULL,
  `nutrient_id` bigint NOT NULL,
  `amount` decimal(10,3) DEFAULT NULL COMMENT '100g 기준',
  PRIMARY KEY (`id`),
  KEY `ingredient_id` (`ingredient_id`),
  KEY `nutrient_id` (`nutrient_id`),
  CONSTRAINT `ingredients_nutritions_ibfk_1` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`),
  CONSTRAINT `ingredients_nutritions_ibfk_2` FOREIGN KEY (`nutrient_id`) REFERENCES `nutrients` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=241 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ingredients_requests`
--

DROP TABLE IF EXISTS `ingredients_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredients_requests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL DEFAULT '0' COMMENT 'users.pk',
  `name` varchar(255) NOT NULL DEFAULT '' COMMENT '요청 재료',
  `status` enum('Y','N') NOT NULL DEFAULT 'N' COMMENT '처리상태',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_name_status` (`user_id`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meals_calendars`
--

DROP TABLE IF EXISTS `meals_calendars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meals_calendars` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_code` int NOT NULL DEFAULT '0' COMMENT '카테고리의 식사 구분 pk',
  `refer_feed_id` int NOT NULL DEFAULT '0' COMMENT '출처 ID',
  `user_id` int NOT NULL DEFAULT '0' COMMENT '요청 user.pk',
  `child_id` int NOT NULL DEFAULT '0' COMMENT '자녀 pk',
  `meal_stage` int DEFAULT '0' COMMENT '식사유형',
  `meal_stage_detail` varchar(20) DEFAULT '' COMMENT '식사유형 상세',
  `title` varchar(255) NOT NULL DEFAULT '' COMMENT '식사제목',
  `contents` text COMMENT '설명',
  `month` varchar(7) NOT NULL DEFAULT '' COMMENT 'YYYY-MM',
  `input_date` date NOT NULL COMMENT '공유일',
  `meal_condition` char(2) NOT NULL DEFAULT '2' COMMENT '아이 섭취량',
  `view_count` int NOT NULL DEFAULT '0' COMMENT '조회수',
  `like_count` int NOT NULL DEFAULT '0' COMMENT '조회수',
  `is_public` varchar(2) NOT NULL DEFAULT 'N' COMMENT '공개여부',
  `is_pre_made` varchar(2) NOT NULL DEFAULT 'N' COMMENT '기성품 여부',
  `is_active` varchar(2) NOT NULL DEFAULT 'Y' COMMENT '사용여부',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `view_hash` varchar(255) NOT NULL DEFAULT '' COMMENT 'view_hash',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_date_type` (`user_id`,`input_date`,`category_code`,`child_id`,`is_active`),
  KEY `idx_month` (`month`),
  KEY `idx_user_date` (`user_id`,`input_date`),
  KEY `idx_input_date` (`input_date`),
  KEY `idx_user` (`user_id`),
  KEY `idx_view_hash` (`view_hash`),
  KEY `idx_refer_feed_id` (`refer_feed_id`)
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meals_calendars_images`
--

DROP TABLE IF EXISTS `meals_calendars_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meals_calendars_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL DEFAULT '0' COMMENT 'users.pk',
  `month` varchar(20) NOT NULL DEFAULT '' COMMENT '날짜 Y-m',
  `image` varchar(255) NOT NULL DEFAULT '' COMMENT '캘린더 이미지',
  `is_active` varchar(2) NOT NULL DEFAULT 'Y' COMMENT '사용여부',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_month` (`user_id`,`month`,`is_active`),
  KEY `idx_user_month` (`user_id`,`month`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meals_comments`
--

DROP TABLE IF EXISTS `meals_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meals_comments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '댓글 ID',
  `meal_id` int unsigned NOT NULL DEFAULT '0' COMMENT '피드 ID (feeds 테이블 참조)',
  `user_id` int unsigned NOT NULL DEFAULT '0' COMMENT '댓글 작성자 직원 ID',
  `parent_id` int unsigned DEFAULT NULL COMMENT '부모 댓글 ID (대댓글용)',
  `comment` text NOT NULL COMMENT '댓글 내용',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성 시간',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
  `deleted_at` datetime DEFAULT NULL COMMENT '삭제 시간 (soft delete)',
  `view_hash` varchar(255) NOT NULL DEFAULT '' COMMENT 'view_hash',
  `parent_hash` varchar(255) NOT NULL DEFAULT '' COMMENT '부모 해쉬',
  `is_active` varchar(2) NOT NULL DEFAULT 'Y' COMMENT '사용여부',
  PRIMARY KEY (`id`),
  KEY `idx_meal_id` (`meal_id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meals_likes`
--

DROP TABLE IF EXISTS `meals_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meals_likes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `meal_id` int unsigned NOT NULL DEFAULT '0' COMMENT 'meals.pk',
  `user_id` int unsigned NOT NULL COMMENT 'users.pk',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_feed_user` (`meal_id`,`user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meals_mappers`
--

DROP TABLE IF EXISTS `meals_mappers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meals_mappers` (
  `user_id` bigint NOT NULL COMMENT 'user.pk',
  `category_id` bigint NOT NULL COMMENT 'category.pk',
  PRIMARY KEY (`user_id`,`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meals_scraps`
--

DROP TABLE IF EXISTS `meals_scraps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meals_scraps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL DEFAULT '0' COMMENT 'users.pk',
  `meal_id` int NOT NULL DEFAULT '0' COMMENT 'meals_calendars.pk',
  `is_active` enum('Y','N') NOT NULL DEFAULT 'Y' COMMENT '사용여부',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '정렬순서',
  `memo` varchar(255) NOT NULL DEFAULT '' COMMENT '간단메모',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_scrap` (`user_id`,`meal_id`),
  KEY `idx_user_active_created` (`user_id`,`is_active`,`created_at`),
  KEY `idx_sort_order` (`user_id`,`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meals_summaries`
--

DROP TABLE IF EXISTS `meals_summaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meals_summaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL DEFAULT '0' COMMENT 'user.pk',
  `total_score` int NOT NULL DEFAULT '0' COMMENT '총점',
  `total_summary` text COMMENT '최종요약 정보',
  `analysis_json` text COMMENT '분석 JSON',
  `suggestion` text COMMENT '제안사항',
  `is_temp` varchar(3) NOT NULL DEFAULT 'Y' COMMENT '임시데이터여부',
  `is_active` varchar(3) NOT NULL DEFAULT 'Y' COMMENT '사용여부',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `view_hash` varchar(255) NOT NULL DEFAULT '' COMMENT 'view_hash',
  PRIMARY KEY (`id`),
  UNIQUE KEY `view_hash` (`view_hash`,`is_temp`,`is_active`),
  KEY `idx_view_hash` (`view_hash`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notices`
--

DROP TABLE IF EXISTS `notices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL DEFAULT '0' COMMENT '관리자pk',
  `category_id` int NOT NULL DEFAULT '0' COMMENT '카테고리 pk',
  `title` varchar(100) NOT NULL DEFAULT '' COMMENT '공지제목',
  `content` text COMMENT '공지내용',
  `is_important` enum('Y','N') NOT NULL DEFAULT 'N' COMMENT '중요',
  `created_at` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '생성일',
  `updated_at` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '수정일',
  `ip` varchar(20) NOT NULL DEFAULT '' COMMENT 'IP',
  `status` enum('active','unactive','deleted') NOT NULL DEFAULT 'active' COMMENT '상태',
  `view_hash` varchar(255) NOT NULL DEFAULT '' COMMENT 'view_hash',
  PRIMARY KEY (`id`),
  KEY `idx_title_status` (`title`,`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `view_hash` (`view_hash`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nutrients`
--

DROP TABLE IF EXISTS `nutrients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nutrients` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '영양소 이름',
  `nutrient_group` varchar(50) DEFAULT NULL COMMENT '탄수화물, 단백질, 지방, 비타민, 무기질',
  `unit` varchar(20) DEFAULT NULL COMMENT 'g, mg, ug',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `token` varchar(128) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token` (`token`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `summaries_agents`
--

DROP TABLE IF EXISTS `summaries_agents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `summaries_agents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL DEFAULT '0' COMMENT '질의 user 정보',
  `model` varchar(50) NOT NULL DEFAULT '' COMMENT 'model',
  `model_id` int NOT NULL DEFAULT '0' COMMENT 'model_id',
  `recipe_json` json NOT NULL COMMENT '재료레시피',
  `question` text COMMENT '사용자 질의 내용',
  `answer` text COMMENT 'ai 질의 내용',
  `view_hash` varchar(255) DEFAULT NULL COMMENT 'view_hash',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `recipe_hash` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_model_rows` (`model`,`model_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_view_hash` (`view_hash`),
  KEY `idx_recipe_hash` (`recipe_hash`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sns_login_type` enum('EMAIL','KAKAO','NAVER','GOOGLE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMAIL',
  `sns_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'SNS ID',
  `address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '주소',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회원 pw',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '회원명',
  `nickname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '닉네임',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '이메일',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '전화번호 - 제거',
  `role` enum('USER','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER' COMMENT '권한',
  `profile_image` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '프로필 이미지',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '소개글',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '계정 활성(1=Y,0=N)',
  `marketing_agree` tinyint(1) NOT NULL DEFAULT '0' COMMENT '마케팅 수신 동의여부',
  `push_agree` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'PUSH 알림 여부',
  `created_at` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '가입일자',
  `updated_at` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '수정일자',
  `last_login_at` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '마지막 로그인일자',
  `referer_token` text COLLATE utf8mb4_unicode_ci COMMENT '참조 token',
  `fcm_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'fcm token',
  `deleted_at` datetime DEFAULT NULL COMMENT '탈퇴일자',
  `view_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'view_hash',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_sns` (`sns_login_type`,`sns_id`),
  UNIQUE KEY `uq_users_view_hash` (`view_hash`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_is_active` (`is_active`),
  KEY `idx_users_created_at` (`created_at`),
  KEY `idx_users_last_login_at` (`last_login_at`)
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users_childs`
--

DROP TABLE IF EXISTS `users_childs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_childs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT 'users.id',
  `child_name` varchar(50) NOT NULL COMMENT '자녀명',
  `child_birth` date NOT NULL COMMENT '자녀 생일',
  `child_gender` char(1) NOT NULL COMMENT 'M/W',
  `is_agent` char(1) NOT NULL DEFAULT 'N' COMMENT '대표 자녀 여부',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_agent` (`user_id`,`is_agent`)
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='사용자 자녀 정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users_childs_allergies`
--

DROP TABLE IF EXISTS `users_childs_allergies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_childs_allergies` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL DEFAULT '0' COMMENT 'user.id',
  `child_id` int NOT NULL DEFAULT '0' COMMENT 'users_childs.id',
  `allergy_code` varchar(50) NOT NULL DEFAULT '' COMMENT '알레르기 코드',
  `allergy_name` varchar(255) NOT NULL DEFAULT '' COMMENT '알레르기 명',
  PRIMARY KEY (`id`),
  KEY `idx_user_child` (`user_id`,`child_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=178 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'bml'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-27 14:13:02
