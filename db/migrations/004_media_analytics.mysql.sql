SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_media_entries' AND COLUMN_NAME='genres_json')=0,'ALTER TABLE user_media_entries ADD COLUMN genres_json JSON NULL AFTER release_year','SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS user_media_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  media_type ENUM('movie','tv') NOT NULL,
  tmdb_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('interaction','status','favorite','rating','review') NOT NULL DEFAULT 'interaction',
  watch_status ENUM('want','watching','watched') NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  rating DECIMAL(3,1) NULL,
  has_review BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_media_events_title_time (media_type,tmdb_id,created_at),
  KEY idx_media_events_time (created_at),
  CONSTRAINT fk_media_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_media_entries' AND COLUMN_NAME='original_language')=0,'ALTER TABLE user_media_entries ADD COLUMN original_language VARCHAR(32) NULL AFTER genres_json','SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_media_entries' AND COLUMN_NAME='origin_country')=0,'ALTER TABLE user_media_entries ADD COLUMN origin_country VARCHAR(8) NULL AFTER original_language','SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
