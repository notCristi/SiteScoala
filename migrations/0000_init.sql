CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'invited' NOT NULL,
	`password_hash` text,
	`password_changed_at` integer,
	`ui_locale` text DEFAULT 'ro' NOT NULL,
	`failed_logins` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`type` text DEFAULT 'news' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`title_ro` text NOT NULL,
	`title_de` text,
	`title_en` text,
	`summary_ro` text,
	`summary_de` text,
	`summary_en` text,
	`body_md_ro` text,
	`body_md_de` text,
	`body_md_en` text,
	`body_html_ro` text,
	`body_html_de` text,
	`body_html_en` text,
	`cover_media_id` text,
	`pinned_banner` integer DEFAULT false NOT NULL,
	`banner_level` text DEFAULT 'info' NOT NULL,
	`banner_text_ro` text,
	`banner_text_de` text,
	`banner_text_en` text,
	`banner_until` integer,
	`event_start` integer,
	`event_end` integer,
	`pinned_top` integer DEFAULT false NOT NULL,
	`source_url` text,
	`published_at` integer,
	`rev` integer DEFAULT 1 NOT NULL,
	`de_rev` integer,
	`en_rev` integer,
	`de_state` text DEFAULT 'missing' NOT NULL,
	`en_state` text DEFAULT 'missing' NOT NULL,
	`created_by` text,
	`updated_by` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `announcements_slug_unique` ON `announcements` (`slug`);--> statement-breakpoint
CREATE INDEX `ann_pub_idx` ON `announcements` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `ann_banner_idx` ON `announcements` (`pinned_banner`,`banner_until`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`summary` text,
	`ip_prefix` text
);
--> statement-breakpoint
CREATE INDEX `audit_at_idx` ON `audit_log` (`at`);--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`topic` text DEFAULT 'secretariat' NOT NULL,
	`message` text NOT NULL,
	`locale` text DEFAULT 'ro' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`ip_prefix` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `msg_status_idx` ON `contact_messages` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `departments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name_ro` text NOT NULL,
	`name_de` text,
	`name_en` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `departments_slug_unique` ON `departments` (`slug`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title_ro` text NOT NULL,
	`title_de` text,
	`title_en` text,
	`description_ro` text,
	`description_de` text,
	`description_en` text,
	`category` text NOT NULL,
	`cycles` text DEFAULT '' NOT NULL,
	`academic_year` text,
	`doc_language` text DEFAULT 'ro' NOT NULL,
	`r2_key` text,
	`external_url` text,
	`original_filename` text,
	`mime` text,
	`file_ext` text,
	`size_bytes` integer,
	`sha256` text,
	`pages` integer,
	`issued_at` integer,
	`registration_no` text,
	`valid_until` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`rev` integer DEFAULT 1 NOT NULL,
	`de_rev` integer,
	`en_rev` integer,
	`de_state` text DEFAULT 'missing' NOT NULL,
	`en_state` text DEFAULT 'missing' NOT NULL,
	`created_by` text,
	`updated_by` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_r2_key_unique` ON `documents` (`r2_key`);--> statement-breakpoint
CREATE INDEX `docs_cat_idx` ON `documents` (`status`,`category`,`academic_year`);--> statement-breakpoint
CREATE TABLE `galleries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title_ro` text NOT NULL,
	`title_de` text,
	`title_en` text,
	`description_ro` text,
	`description_de` text,
	`description_en` text,
	`cover_media_id` text,
	`event_date` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`rev` integer DEFAULT 1 NOT NULL,
	`de_rev` integer,
	`en_rev` integer,
	`de_state` text DEFAULT 'missing' NOT NULL,
	`en_state` text DEFAULT 'missing' NOT NULL,
	`created_by` text,
	`updated_by` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `galleries_slug_unique` ON `galleries` (`slug`);--> statement-breakpoint
CREATE TABLE `gallery_items` (
	`gallery_id` integer NOT NULL,
	`media_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`gallery_id`, `media_id`),
	FOREIGN KEY (`gallery_id`) REFERENCES `galleries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `guide_steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guide_id` integer NOT NULL,
	`sort_order` integer NOT NULL,
	`title_ro` text NOT NULL,
	`title_de` text,
	`title_en` text,
	`body_md_ro` text,
	`body_md_de` text,
	`body_md_en` text,
	`body_html_ro` text,
	`body_html_de` text,
	`body_html_en` text,
	`when_ro` text,
	`when_de` text,
	`when_en` text,
	`starts_at` integer,
	`ends_at` integer,
	`is_deadline` integer DEFAULT false NOT NULL,
	`checklist_json` text,
	`link_url` text,
	`document_id` integer,
	FOREIGN KEY (`guide_id`) REFERENCES `guides`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guide_steps_order` ON `guide_steps` (`guide_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `guides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`kind` text NOT NULL,
	`academic_year` text,
	`title_ro` text NOT NULL,
	`title_de` text,
	`title_en` text,
	`lead_ro` text,
	`lead_de` text,
	`lead_en` text,
	`body_md_ro` text,
	`body_md_de` text,
	`body_md_en` text,
	`body_html_ro` text,
	`body_html_de` text,
	`body_html_en` text,
	`faq_json` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`rev` integer DEFAULT 1 NOT NULL,
	`de_rev` integer,
	`en_rev` integer,
	`de_state` text DEFAULT 'missing' NOT NULL,
	`en_state` text DEFAULT 'missing' NOT NULL,
	`created_by` text,
	`updated_by` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guides_slug_unique` ON `guides` (`slug`);--> statement-breakpoint
CREATE TABLE `invites` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`purpose` text NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`src` text,
	`variants_json` text,
	`mime` text,
	`size_bytes` integer,
	`sha256` text,
	`width` integer,
	`height` integer,
	`focal_x` real DEFAULT 0.5 NOT NULL,
	`focal_y` real DEFAULT 0.5 NOT NULL,
	`placeholder` text,
	`youtube_id` text,
	`alt_ro` text,
	`alt_de` text,
	`alt_en` text,
	`caption_ro` text,
	`caption_de` text,
	`caption_en` text,
	`credit` text,
	`license` text,
	`source_url` text,
	`original_filename` text,
	`uploaded_by` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`title_ro` text NOT NULL,
	`title_de` text,
	`title_en` text,
	`lead_ro` text,
	`lead_de` text,
	`lead_en` text,
	`body_md_ro` text,
	`body_md_de` text,
	`body_md_en` text,
	`body_html_ro` text,
	`body_html_de` text,
	`body_html_en` text,
	`meta_description_ro` text,
	`meta_description_de` text,
	`meta_description_en` text,
	`hero_media_id` text,
	`data_json` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`rev` integer DEFAULT 1 NOT NULL,
	`de_rev` integer,
	`en_rev` integer,
	`de_state` text DEFAULT 'missing' NOT NULL,
	`en_state` text DEFAULT 'missing' NOT NULL,
	`created_by` text,
	`updated_by` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`hero_media_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_key_unique` ON `pages` (`key`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`kind` text NOT NULL,
	`title_ro` text NOT NULL,
	`title_de` text,
	`title_en` text,
	`summary_ro` text,
	`summary_de` text,
	`summary_en` text,
	`body_md_ro` text,
	`body_md_de` text,
	`body_md_en` text,
	`body_html_ro` text,
	`body_html_de` text,
	`body_html_en` text,
	`partners` text,
	`funding` text,
	`period` text,
	`cover_media_id` text,
	`gallery_id` integer,
	`external_url` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`rev` integer DEFAULT 1 NOT NULL,
	`de_rev` integer,
	`en_rev` integer,
	`de_state` text DEFAULT 'missing' NOT NULL,
	`en_state` text DEFAULT 'missing' NOT NULL,
	`created_by` text,
	`updated_by` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`gallery_id`) REFERENCES `galleries`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `purge_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tags_json` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`done_at` integer
);
--> statement-breakpoint
CREATE TABLE `redirects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_path` text NOT NULL,
	`to_path` text NOT NULL,
	`code` integer DEFAULT 301 NOT NULL,
	`note` text,
	`hits` integer DEFAULT 0 NOT NULL,
	`last_hit_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `redirects_from_path_unique` ON `redirects` (`from_path`);--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`data_json` text NOT NULL,
	`saved_by` text,
	`saved_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rev_entity_idx` ON `revisions` (`entity_type`,`entity_id`,`saved_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`csrf_secret` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`absolute_expires_at` integer NOT NULL,
	`user_agent` text,
	`ip_prefix` text,
	FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_exp_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_by` text
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`full_name` text NOT NULL,
	`sort_name` text NOT NULL,
	`title_prefix` text,
	`role_ro` text,
	`role_de` text,
	`role_en` text,
	`category` text NOT NULL,
	`department_id` integer,
	`subject_ro` text,
	`subject_de` text,
	`subject_en` text,
	`email` text,
	`show_email` integer DEFAULT false NOT NULL,
	`photo_media_id` text,
	`photo_consent` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 1000 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_by` text,
	`updated_by` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`photo_media_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `staff_cat_idx` ON `staff` (`status`,`category`,`sort_order`);--> statement-breakpoint
CREATE TABLE `student_life` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`kind` text NOT NULL,
	`title_ro` text NOT NULL,
	`title_de` text,
	`title_en` text,
	`summary_ro` text,
	`summary_de` text,
	`summary_en` text,
	`body_md_ro` text,
	`body_md_de` text,
	`body_md_en` text,
	`body_html_ro` text,
	`body_html_de` text,
	`body_html_en` text,
	`cover_media_id` text,
	`gallery_id` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`rev` integer DEFAULT 1 NOT NULL,
	`de_rev` integer,
	`en_rev` integer,
	`de_state` text DEFAULT 'missing' NOT NULL,
	`en_state` text DEFAULT 'missing' NOT NULL,
	`created_by` text,
	`updated_by` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`gallery_id`) REFERENCES `galleries`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_life_slug_unique` ON `student_life` (`slug`);--> statement-breakpoint
CREATE TABLE `timeline_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`year_label` text,
	`title_ro` text NOT NULL,
	`title_de` text,
	`title_en` text,
	`body_ro` text,
	`body_de` text,
	`body_en` text,
	`media_id` text,
	`source_url` text,
	`era` text DEFAULT 'modern' NOT NULL,
	`highlight` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`rev` integer DEFAULT 1 NOT NULL,
	`de_rev` integer,
	`en_rev` integer,
	`de_state` text DEFAULT 'missing' NOT NULL,
	`en_state` text DEFAULT 'missing' NOT NULL,
	`created_by` text,
	`updated_by` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE set null
);
