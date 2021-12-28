SELECT
  levelisations.id AS "id",
  levelisations.quarter AS "quarter",
  start_on AS "startOn",
  end_on AS "endOn"
FROM levelisations
WHERE
  -- Filter
  -- Ids filter, for loading specific ids, skip if empty array
  ($q = '' OR (levelisations.quarter = $q)) AND (cardinality($ids::int[]) = 0 OR (levelisations.id = ANY ($ids::int[])))
-- Sort by difference, dateOn, value
ORDER BY
  CASE WHEN $sortField = 'quarter' AND $sortOrder = 'DESC' THEN quarter END DESC,
  CASE WHEN $sortField = 'quarter' AND $sortOrder = 'ASC' THEN quarter END ASC
-- Pagination
LIMIT $limit::int
OFFSET $offset::int
