WITH
  regional_sales AS
  (
    SELECT
      region,
      SUM(amount) AS total_sales
    FROM orders
    GROUP BY
      region
  ),
  top_regions AS
  (SELECT region FROM regional_sales WHERE total_sales > (SELECT SUM(total_sales) / 10 FROM regional_sales))
SELECT
  orders.region,
  orders.product,
  SUM(quantity) AS product_units,
  SUM(amount) AS product_sales
FROM orders
WHERE
  orders.region IN (SELECT top_regions.region FROM top_regions)
GROUP BY
  orders.region,
  orders.product
