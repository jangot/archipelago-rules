/* @name getUserDetailById */
SELECT * FROM core.users WHERE id = :userId! Limit 1;