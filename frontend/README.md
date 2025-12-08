### 프로젝트

#### 프로젝트명 (가명)
- BML (Baby Meal List)

#### 프로젝트 기능 설명
1. 피드
    - 인스타그램처럼 "오늘은 우리 아이기에 무엇을 먹이지?" 라고 고민하고 스트레스 받는 주부들에게 나는 무엇을 먹었는지를 공유
2. 식단 계획
    - 주단위 식단, 월단위 식단표를 직접 계획&설계할수 있는 UI를 제공
3. 커뮤니티
    - 유아의 나이대 별로 커뮤니티를 활성화 하여 각 주부들간의 소통 유발
	- 커뮤니티의 나이대는 `0~3`세,  `3~5`세, `6~7`세 로 분류
4. 핫딜 기능
    - 핫딜 기능을 추가하여 외부 업체로 부터의 계약을 진행

#### 프로젝트 개발 방향
1. 개발 언어 선택
    - frontend : react native (React Query + API Layer 구조)
	- backend : fastapi
	- db : mysql

2. 구글 스토어에 app을 등록하는것을 목표로 함

#### 상세 화면 개발 가이드
0. 메인페이지
    - 최초 앱이 실행되었을때는 간단한 BML 이라는 로고와 함께 로딩
    - 로그인이 안되었을때는 email 과 비밀번호를 입력받는 로그인화면으로 이동
    - 로그인이 되었을때는 마이페이지로 이동
    - 로그인 한 이후에는 MMKV 에 회원에 대한 정보를 저장
        - 해당 데이터는 마이페이지 이름, 프로필이미지 등에서 불러와서 사용예정

1. 공통사항
    - 전체적인 화면 색상톤은 밝고, 육아를 하는 엄마들에게 친화적인 UI
    - header, footer, navbar 를 components 페이지에 분리
    - navbar 는 화면의 아래에 상시 위치하며, 스크롤을 내리거나 화면전환 시에는 잠시 감추기
    - navbar 의 메뉴로는 [피드보기], [공지작성], [식단관리], [마이페이지] 가 있으며 아이콘을 활용
    - interface 는 libs/types/ 디렉토리에 작성하여 사용

2. 피드리스트
    - 사용자가 올린 피드를 스크롤을 내리면서 하나씩 보기
    - 찜하기, 좋아요 기능을 추가
    - 각각의 피드의 오른쪽 상단에 세로 점3개로 계정확인, 차단하기 같은 드롭다운 노출

3. 마이페이지
    - 내 프로필 정보와 내가 올린 피드정보를 확인할수 있어야하며
    - 내 피드를 등록할 수 있어야함
        - 내 피드를 등록 시 사진첨부는 필수이며, 해쉬태그 기능, 내용등을 작성할수 있음
    - 프로필 수정을 누르면 프로필 정보 수정을 위한 화면으로 전환

4. 피드 작성하기
    - feed.id 가 있으면 수정 모드, 없으면 등록 모드
    - feed.content 를 작성 시 `#` 을 치고 한글자 이상 입력 시 hooks-> backend 와 연동하여 feeds_tags 테이블 에서 조회하여 자동완성
    - feed 의 이미지는 3장까지만 업로드 제한 (추후 달라질수 있음)

5. 회원가입 페이지
    - users 테이블을 토대로 회원가입 화면을 만들어줘
    - child_age_group 목록의 경우 hooks 를 통해 백엔드에서 조회해야해
        - 백앤드쪽은 내가 만들테니 프론트앤드영역만 작성해줘
    - profile_image 는 필수는 아니야
    - role 은 항상 USER 여야해
    - view_hash 및 시간 관련데이터는 백앤드에서 처리할야



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