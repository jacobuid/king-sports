-- Verified Clerk account and KingAuth account for the same owner.
-- Preserve team, player, track, assignment and object IDs during the auth cutover.
UPDATE teams SET owner_user_id = '206b7c4f-39a4-48d5-8886-62f11fd39250' WHERE owner_user_id = 'user_3LRpOTZsy6xSKwWDUKQm0NKIqkR';
UPDATE music_tracks SET owner_user_id = '206b7c4f-39a4-48d5-8886-62f11fd39250' WHERE owner_user_id = 'user_3LRpOTZsy6xSKwWDUKQm0NKIqkR';
UPDATE music_assignments SET owner_user_id = '206b7c4f-39a4-48d5-8886-62f11fd39250' WHERE owner_user_id = 'user_3LRpOTZsy6xSKwWDUKQm0NKIqkR';
UPDATE music_search_limits SET owner_user_id = '206b7c4f-39a4-48d5-8886-62f11fd39250' WHERE owner_user_id = 'user_3LRpOTZsy6xSKwWDUKQm0NKIqkR';
UPDATE profiles SET user_id = '206b7c4f-39a4-48d5-8886-62f11fd39250' WHERE user_id = 'user_3LRpOTZsy6xSKwWDUKQm0NKIqkR';
