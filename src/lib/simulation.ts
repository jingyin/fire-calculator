/**
 * Seeded random number generator (Mulberry32)
 * Returns a function that generates random numbers in [0, 1)
 */
function createSeededRandom(seed: number) {
  return function() {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SimulationParams {
  startingAssets: number;
  annualReturn: number; // e.g., 0.07 for 7%
  initialContribution: number;
  contributionGrowthRate: number; // e.g., 0.03 for 3% annual increase
  inflationRate: number; // e.g., 0.025 for 2.5%
  years: number;
}

export interface YearData {
  year: number;
  startingBalance: number;
  contribution: number;
  returnRate: number;
  inflationRate: number;
  growth: number;
  endingBalance: number;
  // Inflation-adjusted (real) values
  cumulativeInflation: number; // cumulative inflation multiplier
  realEndingBalance: number;
}

export interface SimulationResult {
  yearlyData: YearData[];
  finalBalance: number;
  totalContributions: number;
  totalGrowth: number;
}

/**
 * Generates randomized yearly returns that multiply to the target long-term return.
 * Uses log-normal distribution centered on the target, then scales to hit exact target.
 *
 * The product of (1 + r_i) for all years equals (1 + annualReturn)^years
 */
function generateRandomizedReturns(
  annualReturn: number,
  years: number,
  random: () => number,
  volatility: number = 0.30
): number[] {
  const targetLogReturn = Math.log(1 + annualReturn);
  const totalTargetLogReturn = targetLogReturn * years;

  // Generate random log returns using Box-Muller transform for normal distribution
  const logReturns: number[] = [];
  for (let i = 0; i < years; i++) {
    // Box-Muller transform to generate normal random numbers
    const u1 = random();
    const u2 = random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Generate log return with mean = targetLogReturn and std = volatility
    const logReturn = targetLogReturn + volatility * z;
    logReturns.push(logReturn);
  }

  // Calculate current sum of log returns
  const currentSum = logReturns.reduce((sum, r) => sum + r, 0);

  // Adjust each log return proportionally so they sum to totalTargetLogReturn
  const adjustment = (totalTargetLogReturn - currentSum) / years;
  const adjustedLogReturns = logReturns.map(r => r + adjustment);

  // Convert log returns back to actual returns
  return adjustedLogReturns.map(logR => Math.exp(logR) - 1);
}

/**
 * Generates randomized yearly inflation rates that multiply to the target long-term inflation.
 * Similar to returns but constrained so inflation doesn't go below 0.
 *
 * The product of (1 + i_j) for all years equals (1 + inflationRate)^years
 */
function generateRandomizedInflation(
  inflationRate: number,
  years: number,
  random: () => number,
  volatility: number = 0.015
): number[] {
  // If inflation rate is 0, return all zeros (no simulation needed)
  if (inflationRate === 0) {
    return new Array(years).fill(0);
  }

  const targetLogInflation = Math.log(1 + inflationRate);
  const totalTargetLogInflation = targetLogInflation * years;

  // Generate random log inflation using Box-Muller transform for normal distribution
  const logInflations: number[] = [];
  for (let i = 0; i < years; i++) {
    const u1 = random();
    const u2 = random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Generate log inflation with mean = targetLogInflation and std = volatility
    // Use smaller volatility for inflation (typically more stable than returns)
    const logInflation = targetLogInflation + volatility * z;
    logInflations.push(logInflation);
  }

  // Calculate current sum of log inflations
  const currentSum = logInflations.reduce((sum, r) => sum + r, 0);

  // Adjust each log inflation proportionally so they sum to totalTargetLogInflation
  const adjustment = (totalTargetLogInflation - currentSum) / years;
  const adjustedLogInflations = logInflations.map(r => r + adjustment);

  // Convert log inflations back to actual rates, ensuring non-negative (min 0%)
  // Note: flooring at 0 may cause cumulative inflation to exceed target slightly
  return adjustedLogInflations.map(logI => Math.max(0, Math.exp(logI) - 1));
}

/**
 * Run a single FIRE simulation with randomized yearly returns
 */
export function runSimulation(params: SimulationParams, random: () => number): SimulationResult {
  const { startingAssets, annualReturn, initialContribution, contributionGrowthRate, inflationRate, years } = params;

  const randomReturns = generateRandomizedReturns(annualReturn, years, random);
  const randomInflations = generateRandomizedInflation(inflationRate, years, random);

  const yearlyData: YearData[] = [];
  let balance = startingAssets;
  let contribution = initialContribution;
  let totalContributions = 0;
  let totalGrowth = 0;
  let cumulativeInflation = 1; // starts at 1 (no inflation in year 0)

  for (let i = 0; i < years; i++) {
    const startingBalance = balance;
    const yearReturn = randomReturns[i];
    const yearInflation = randomInflations[i];

    // Add contribution at the start of year
    balance += contribution;
    totalContributions += contribution;

    // Apply growth
    const growth = balance * yearReturn;
    balance += growth;
    totalGrowth += growth;

    // Update cumulative inflation
    cumulativeInflation *= (1 + yearInflation);

    // Calculate real (inflation-adjusted) ending balance
    const realEndingBalance = balance / cumulativeInflation;

    yearlyData.push({
      year: i + 1,
      startingBalance,
      contribution,
      returnRate: yearReturn,
      inflationRate: yearInflation,
      growth,
      endingBalance: balance,
      cumulativeInflation,
      realEndingBalance,
    });

    // Increase contribution for next year
    contribution *= (1 + contributionGrowthRate);
  }

  return {
    yearlyData,
    finalBalance: balance,
    totalContributions,
    totalGrowth,
  };
}

/**
 * Run multiple simulations to show range of possible outcomes (Monte Carlo)
 * @param seed - Base seed for reproducible simulations
 */
export function runMonteCarloSimulation(
  params: SimulationParams,
  numSimulations: number = 100,
  seed: number = Date.now()
): SimulationResult[] {
  const results: SimulationResult[] = [];
  for (let i = 0; i < numSimulations; i++) {
    // Create a different seed for each simulation
    const simulationSeed = seed + i;
    const random = createSeededRandom(simulationSeed);
    results.push(runSimulation(params, random));
  }
  return results;
}

/**
 * Calculate percentile values from multiple simulations
 * @param useRealValues - if true, use inflation-adjusted values
 */
export function calculatePercentiles(
  simulations: SimulationResult[],
  percentiles: number[] = [10, 25, 50, 75, 90],
  useRealValues: boolean = false
): Map<number, number[]> {
  const years = simulations[0].yearlyData.length;
  const result = new Map<number, number[]>();

  for (const percentile of percentiles) {
    const balances: number[] = [];

    for (let year = 0; year < years; year++) {
      const yearEndBalances = simulations
        .map(sim => useRealValues
          ? sim.yearlyData[year].realEndingBalance
          : sim.yearlyData[year].endingBalance)
        .sort((a, b) => a - b);

      const index = Math.floor((percentile / 100) * yearEndBalances.length);
      balances.push(yearEndBalances[Math.min(index, yearEndBalances.length - 1)]);
    }

    result.set(percentile, balances);
  }

  return result;
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
