#### 테이블 정의
- users 테이블
    ```
    CREATE TABLE `users` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `sns_login_type` ENUM('EMAIL','KAKAO','NAVER','GOOGLE') NOT NULL DEFAULT 'EMAIL',
        `sns_id` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'SNS ID',
        `address` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '주소',
        `password` VARCHAR(255) DEFAULT NULL COMMENT '회원 pw',
        `name` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '회원명',
        `nickname` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '닉네임',
        `email` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '이메일',
        `phone` VARCHAR(20) NOT NULL DEFAULT '' COMMENT '전화번호 - 제거',
        `role` ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER' COMMENT '권한',
        `profile_image` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '프로필 이미지',
        `description` TEXT COMMENT '소개글',
        `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '계정 활성(1=Y,0=N)',
        `child_birth` DATE DEFAULT NULL COMMENT '자녀생년월일',
        `child_gender` ENUM('M','W') NOT NULL DEFAULT 'M' COMMENT '자녀 성별',
        `child_age_group` INT(5) NOT NULL DEFAULT 0 COMMENT 'AGE_GROUP 카테고리 pk',
        `marketing_agree` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '마케팅 수신 동의여부',
        `push_agree` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'PUSH 알림 여부',
        `created_at` DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '가입일자',
        `updated_at` DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '수정일자',
        `last_login_at` DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '마지막 로그인일자',
        `deleted_at` DATETIME DEFAULT NULL COMMENT '탈퇴일자',
        `view_hash` VARCHAR(255) DEFAULT NULL COMMENT 'view_hash',
        PRIMARY KEY (`id`),
        UNIQUE KEY `uq_users_email` (`email`),
        UNIQUE KEY `uq_users_phone` (`phone`),
        UNIQUE KEY `uq_users_sns` (`sns_login_type`,`sns_id`),
        UNIQUE KEY `uq_users_view_hash` (`view_hash`),
        KEY `idx_users_role` (`role`),
        KEY `idx_users_is_active` (`is_active`),
        KEY `idx_users_created_at` (`created_at`),
        KEY `idx_users_last_login_at` (`last_login_at`),
        KEY `idx_child_birth` (`child_birth`),
        KEY `idx_child_age_group` (`child_age_group`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

- categories_codes
  ```
  CREATE TABLE "categories_codes" (
    "id" int NOT NULL AUTO_INCREMENT,
    "type" varchar(50) NOT NULL DEFAULT '' COMMENT '카테고리 타입',
    "code" varchar(50) NOT NULL DEFAULT '' COMMENT '카테고리 코드',
    "value" varchar(255) NOT NULL DEFAULT '' COMMENT '카테고리 값',
    "sort" int NOT NULL DEFAULT '0' COMMENT '순서',
    "is_active" varchar(3) NOT NULL DEFAULT 'Y' COMMENT '사용여부',
    PRIMARY KEY ("id"),
    UNIQUE KEY "uniq_type_sort" ("type","sort"),
    UNIQUE KEY "uniq_type_code" ("type","code"),
    KEY "idx_type_code" ("type","code"),
    KEY "idx_type_value" ("type","value"),
    KEY "idx_is_active" ("is_active")
  )

- feeds
  ```
    CREATE TABLE "feeds" (
        "id" int NOT NULL AUTO_INCREMENT,
        "user_id" int NOT NULL COMMENT 'Users.pk',
        "title" varchar(255) NOT NULL DEFAULT '' COMMENT 'feed 제목',
        "content" text NOT NULL COMMENT 'feed 내용',
        "is_public" enum('Y','N') DEFAULT 'Y' COMMENT '공개여부',
        "view_count" int NOT NULL DEFAULT '0' COMMENT '조회수',
        "like_count" int NOT NULL DEFAULT '0' COMMENT '관심수',
        "created_at" datetime DEFAULT CURRENT_TIMESTAMP,
        "updated_at" datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY ("id"),
        KEY "idx_user_id" ("user_id"),
        KEY "idx_created_at" ("created_at"),
        KEY "idx_public_created" ("is_public","created_at")
    )

- feeds_tags
   ```
    CREATE TABLE "feeds_tags" (
        "id" bigint NOT NULL AUTO_INCREMENT,
        "name" varchar(100) NOT NULL,
        PRIMARY KEY ("id"),
        UNIQUE KEY "name" ("name")
    )

- feeds_tags_mappers
   ```
    CREATE TABLE "feeds_tags_mappers" (
        "feed_id" bigint NOT NULL,
        "tag_id" bigint NOT NULL,
        PRIMARY KEY ("feed_id","tag_id")
    )

- feeds_images
   ```
    CREATE TABLE "feeds_images" (
        "id" bigint NOT NULL AUTO_INCREMENT,
        "feed_id" int NOT NULL COMMENT 'feeds.id',
        "image_url" varchar(500) NOT NULL COMMENT '이미지 경로(URL)',
        "sort_order" int NOT NULL DEFAULT '0' COMMENT '정렬 순서 (0=첫번째)',
        "width" int DEFAULT NULL COMMENT '원본 width',
        "height" int DEFAULT NULL COMMENT '원본 height',
        "created_at" datetime DEFAULT CURRENT_TIMESTAMP,
        "is_active" enum('Y','N') DEFAULT 'Y' COMMENT '사용여부',
        PRIMARY KEY ("id"),
        KEY "idx_feed_id" ("feed_id"),
        CONSTRAINT "fk_feeds_images_feed_id" FOREIGN KEY ("feed_id") REFERENCES "feeds" ("id") ON DELETE CASCADE
    )

- feeds_likes
    ```
    CREATE TABLE "feeds_likes" (
        "id" int unsigned NOT NULL AUTO_INCREMENT,
        "feed_id" int unsigned NOT NULL DEFAULT '0' COMMENT 'feed.pk',
        "user_id" int unsigned NOT NULL COMMENT 'users.pk',
        "created_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("id"),
        UNIQUE KEY "unique_feed_user" ("feed_id","user_id")
    )

- feeds_comments
    ```
    CREATE TABLE "feeds_comments" (
        "id" int unsigned NOT NULL AUTO_INCREMENT COMMENT '댓글 ID',
        "feed_id" int unsigned NOT NULL DEFAULT '0' COMMENT '피드 ID (feeds 테이블 참조)',
        "user_id" int unsigned NOT NULL DEFAULT '0' COMMENT '댓글 작성자 직원 ID',
        "parent_id" int unsigned DEFAULT NULL COMMENT '부모 댓글 ID (대댓글용)',
        "comment" text NOT NULL COMMENT '댓글 내용',
        "created_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성 시간',
        "updated_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
        "deleted_at" datetime DEFAULT NULL COMMENT '삭제 시간 (soft delete)',
        "view_hash" varchar(255) NOT NULL DEFAULT '' COMMENT 'view_hash',
        "parent_hash" varchar(255) NOT NULL DEFAULT '' COMMENT '부모 해쉬',
        PRIMARY KEY ("id"),
        KEY "idx_feed_id" ("feed_id"),
        KEY "idx_parent_id" ("parent_id")
    )

- denies_users
    ```
    CREATE TABLE "denies_users" (
        "id" int NOT NULL AUTO_INCREMENT,
        "user_id" int NOT NULL DEFAULT '0' COMMENT '요청 user.pk',
        "deny_user_id" int NOT NULL DEFAULT '0' COMMENT '차단 user.pk',
        "created_at" datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("id"),
        UNIQUE KEY "uq_deny_user" ("user_id","deny_user_id"),
        KEY "idx_user_id" ("user_id")
    )

- notices
   ```
    CREATE TABLE "notices" (
        "id" int NOT NULL AUTO_INCREMENT,
        "admin_id" int NOT NULL DEFAULT '0' COMMENT '관리자pk',
        "category_id" int NOT NULL DEFAULT '0' COMMENT '카테고리 pk',
        "title" varchar(100) NOT NULL DEFAULT '' COMMENT '공지제목',
        "content" text COMMENT '공지내용',
        "is_important" enum('Y','N') NOT NULL DEFAULT 'N' COMMENT '중요',
        "created_at" datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '생성일',
        "updated_at" datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '수정일',
        "ip" varchar(20) NOT NULL DEFAULT '' COMMENT 'IP',
        "status" enum('active','unactive','deleted') NOT NULL DEFAULT 'active' COMMENT '상태',
        "view_hash" varchar(255) NOT NULL DEFAULT '' COMMENT 'view_hash',
        PRIMARY KEY ("id"),
        KEY "idx_title_status" ("title","status"),
        KEY "idx_created_at" ("created_at"),
        KEY "view_hash" ("view_hash")
    )

- users
   ```
    CREATE TABLE "users" (
        "id" int NOT NULL AUTO_INCREMENT,
        "sns_login_type" enum('EMAIL','KAKAO','NAVER','GOOGLE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMAIL',
        "sns_id" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'SNS ID',
        "address" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '주소',
        "password" varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회원 pw',
        "name" varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '회원명',
        "nickname" varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '닉네임',
        "email" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '이메일',
        "phone" varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '전화번호 - 제거',
        "role" enum('USER','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER' COMMENT '권한',
        "profile_image" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '프로필 이미지',
        "description" text COLLATE utf8mb4_unicode_ci COMMENT '소개글',
        "is_active" tinyint(1) NOT NULL DEFAULT '1' COMMENT '계정 활성(1=Y,0=N)',
        "child_birth" date DEFAULT NULL COMMENT '자녀생년월일',
        "child_gender" enum('M','W') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'M' COMMENT '자녀 성별',
        "child_age_group" int NOT NULL DEFAULT '0' COMMENT 'AGE_GROUP 카테고리 pk',
        "marketing_agree" tinyint(1) NOT NULL DEFAULT '0' COMMENT '마케팅 수신 동의여부',
        "push_agree" tinyint(1) NOT NULL DEFAULT '0' COMMENT 'PUSH 알림 여부',
        "created_at" datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '가입일자',
        "updated_at" datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '수정일자',
        "last_login_at" datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '마지막 로그인일자',
        "deleted_at" datetime DEFAULT NULL COMMENT '탈퇴일자',
        "view_hash" varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'view_hash',
        PRIMARY KEY ("id"),
        UNIQUE KEY "uq_users_email" ("email"),
        UNIQUE KEY "uq_users_phone" ("phone"),
        UNIQUE KEY "uq_users_sns" ("sns_login_type","sns_id"),
        UNIQUE KEY "uq_users_view_hash" ("view_hash"),
        KEY "idx_users_role" ("role"),
        KEY "idx_users_is_active" ("is_active"),
        KEY "idx_users_created_at" ("created_at"),
        KEY "idx_users_last_login_at" ("last_login_at"),
        KEY "idx_child_birth" ("child_birth"),
        KEY "idx_child_age_group" ("child_age_group")
    )