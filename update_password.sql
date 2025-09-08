-- Update password for admin@dima.servaan.com user
UPDATE "User" 
SET password = '$2b$12$m7ynsMNU84B6jxax2UMlauJLpbH8kyendLxdJf5V7f.ilmRtaKu2q'
WHERE email = 'admin@dima.servaan.com';
