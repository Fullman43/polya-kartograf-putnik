-- Часть 1: Добавляем новые значения к enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'organization_owner';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'organization_admin';