-- Исправляем перепутанные координаты в employees
-- PostgreSQL Point format: (longitude, latitude)
-- Для России: latitude ~41-82, longitude ~19-180
-- Для Московской области: latitude ~55-56, longitude ~37-39

-- Находим и исправляем employees с перепутанными координатами
-- (если x > 50 AND x < 70 AND y > 20 AND y < 50, значит координаты перепутаны)
UPDATE employees
SET current_location = point(
  (current_location::point)[1],  -- y становится x (longitude)
  (current_location::point)[0]   -- x становится y (latitude)
)
WHERE current_location IS NOT NULL
  AND (current_location::point)[0] > 50  -- x выглядит как latitude
  AND (current_location::point)[0] < 70
  AND (current_location::point)[1] > 20  -- y выглядит как longitude  
  AND (current_location::point)[1] < 50;

-- Исправляем tasks с перепутанными координатами
UPDATE tasks
SET location = point(
  (location::point)[1],  -- y становится x (longitude)
  (location::point)[0]   -- x становится y (latitude)
)
WHERE location IS NOT NULL
  AND (location::point)[0] > 50  -- x выглядит как latitude
  AND (location::point)[0] < 70
  AND (location::point)[1] > 20  -- y выглядит как longitude
  AND (location::point)[1] < 50;

-- Исправляем start_location в tasks
UPDATE tasks
SET start_location = point(
  (start_location::point)[1],
  (start_location::point)[0]
)
WHERE start_location IS NOT NULL
  AND (start_location::point)[0] > 50
  AND (start_location::point)[0] < 70
  AND (start_location::point)[1] > 20
  AND (start_location::point)[1] < 50;

-- Исправляем completion_location в tasks
UPDATE tasks
SET completion_location = point(
  (completion_location::point)[1],
  (completion_location::point)[0]
)
WHERE completion_location IS NOT NULL
  AND (completion_location::point)[0] > 50
  AND (completion_location::point)[0] < 70
  AND (completion_location::point)[1] > 20
  AND (completion_location::point)[1] < 50;