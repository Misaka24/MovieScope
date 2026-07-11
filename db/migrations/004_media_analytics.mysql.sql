SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_media_entries' AND COLUMN_NAME='genres_json')=0,'ALTER TABLE user_media_entries ADD COLUMN genres_json JSON NULL AFTER release_year','SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_media_entries' AND COLUMN_NAME='original_language')=0,'ALTER TABLE user_media_entries ADD COLUMN original_language VARCHAR(32) NULL AFTER genres_json','SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_media_entries' AND COLUMN_NAME='origin_country')=0,'ALTER TABLE user_media_entries ADD COLUMN origin_country VARCHAR(8) NULL AFTER original_language','SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

