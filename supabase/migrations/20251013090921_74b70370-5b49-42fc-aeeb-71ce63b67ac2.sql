-- Часть 1: Добавляем новые роли в существующий enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'client';