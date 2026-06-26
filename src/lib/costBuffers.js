/*
 * Cost buffer rationale (US gig-driver market, 2024-2025 data):
 *
 * GAS_BUFFER  = 12%
 *   - EIA data: US retail gasoline prices swing ±8–18% seasonally
 *   - Weekly spot price can jump 5–10% after refinery disruptions
 *   - 12% covers ~1 standard deviation of month-over-month movement
 *
 * MAINTENANCE_BUFFER = 8%
 *   - BLS CPI: auto parts & supplies +7.9% YoY (2022–2024 avg)
 *   - Labor rates at independent shops up 5–7% annually
 *   - 8% blends parts inflation with labor; conservative vs 10% parts peak
 *
 * These are applied to the *inputs* before cost-per-mile is derived,
 * so every calculation already prices in near-future increases.
 */

export const GAS_BUFFER         = 0.12   // +12% on gas price
export const MAINTENANCE_BUFFER = 0.08   // +8%  on maintenance cost

export function adjustedCosts(gasPrice, mpg, maintenanceCost, maintenanceFreqMonths) {
  const adjGas         = gasPrice * (1 + GAS_BUFFER)
  const adjMaintenance = maintenanceCost * (1 + MAINTENANCE_BUFFER)

  // Cost-per-mile breakdown:
  //   fuel component: adjusted gas / mpg
  //   maintenance component: adjusted monthly maintenance / estimated monthly miles
  //   We use 30 driving-days × avg 35 mi/day ≈ 1,050 mi/month as a conservative base
  //   (gig drivers doing this full-time typically log 800–1,400 mi/month)
  const MONTHLY_MILES_ESTIMATE = 1050
  const monthlyMaintCost = adjMaintenance / maintenanceFreqMonths
  const maintPerMile     = monthlyMaintCost / MONTHLY_MILES_ESTIMATE

  const fuelPerMile      = adjGas / mpg
  const totalCostPerMile = fuelPerMile + maintPerMile

  return {
    adjGas,
    adjMaintenance,
    fuelPerMile,
    maintPerMile,
    totalCostPerMile,
    // raw (no buffer) for display comparison
    rawGas: gasPrice,
    rawCostPerMile: gasPrice / mpg,
  }
}
