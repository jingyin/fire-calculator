# FIRE Calculator

A sophisticated Financial Independence, Retire Early (FIRE) calculator with realistic market volatility simulation using Monte Carlo methods.

## Features

### Core Functionality
- **Monte Carlo Simulation**: Runs 100 independent simulations to show the range of possible outcomes
- **Realistic Market Volatility**: Uses log-normal distribution with 30% annual volatility to simulate market ups and downs
- **Inflation Modeling**: Simulates inflation with randomized yearly rates (volatility: 1.5%)
- **Mathematically Constrained**: Ensures geometric mean return and inflation match your targets over 30 years
- **Nominal vs Real Toggle**: Switch between future dollars and today's purchasing power

### Interactive Visualizations
- **Percentile Chart**: Displays 10th, 25th, 50th, 75th, and 90th percentile outcomes over 30 years
- **Summary Cards**: Shows median, best case (90p), and worst case (10p) final balances
- **Advanced Diagnostics**: Expandable section showing year-by-year breakdowns for debugging

### User Experience
- Configurable parameters:
  - Starting assets
  - Long-term annual return (0-15%)
  - Initial annual contribution
  - Contribution growth rate (0-10%)
  - Long-term inflation rate (0-6%)
- **URL Parameter Sync**: All inputs are reflected in URL parameters for easy sharing
- Mouse wheel support for sliders
- Responsive design with dark mode
- Real-time chart updates when toggling nominal/real views

## How It Works

### The Simulation Model

The calculator uses a log-normal distribution to generate realistic returns:

1. **Generate Random Returns**: For each year, generate a random return using Box-Muller transform with:
   - Mean: `ln(1 + targetReturn)`
   - Standard deviation: 30%

2. **Constrain to Target**: Adjust returns so that:
   ```
   ∏(1 + r_i) for i=1 to 30 = (1 + targetReturn)^30
   ```

3. **Apply Returns**: For each year:
   - Add annual contribution
   - Apply market return
   - Track cumulative inflation
   - Calculate real (inflation-adjusted) balance

This approach ensures:
- Returns can be negative (market crashes)
- Returns stay above -100% (can't lose more than everything)
- Geometric mean matches your target over the full period
- Realistic volatility patterns

### Why This Matters

Different return sequences with the same average produce different outcomes due to:
- **Sequence of returns risk**: Early losses hurt more than early gains help
- **Compounding effects**: Volatility drag reduces geometric mean compared to arithmetic mean
- **Contribution timing**: Regular contributions benefit from dollar-cost averaging

## Getting Started

### Prerequisites
- Node.js 20+ (uses nvm: `nvm use 24`)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the calculator.

### Build for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 16.1.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Fonts**: Geist Sans & Geist Mono

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Main entry point
│   ├── layout.tsx         # Root layout with metadata
│   └── globals.css        # Global styles and theme
├── components/
│   ├── FIRECalculator.tsx # Main calculator component
│   ├── FIREChart.tsx      # Percentile chart visualization
│   └── ui/                # shadcn/ui components
└── lib/
    ├── simulation.ts      # Monte Carlo simulation logic
    └── utils.ts           # Utility functions
```

## Key Files

### `src/lib/simulation.ts`
Contains the core simulation logic:
- `generateRandomizedReturns()`: Generates constrained random returns
- `generateRandomizedInflation()`: Generates constrained inflation rates
- `runSimulation()`: Executes a single 30-year simulation
- `runMonteCarloSimulation()`: Runs 100 simulations
- `calculatePercentiles()`: Extracts percentile values for charting

### `src/components/FIRECalculator.tsx`
Main UI component with:
- Parameter inputs (sliders and text fields)
- Simulation trigger
- Results display with toggle
- Advanced diagnostics

### `src/components/FIREChart.tsx`
Recharts-based visualization showing:
- 5 percentile bands (10p, 25p, 50p, 75p, 90p)
- Interactive tooltips
- Responsive design

## Usage Tips

1. **Start with defaults**: The calculator comes with reasonable defaults (7% return, 2.5% inflation, 5% contribution growth)

2. **Adjust for your situation**:
   - Conservative: 5-6% return, higher inflation
   - Aggressive: 9-10% return, lower inflation

3. **Use Real values**: Toggle to "Real" to see inflation-adjusted purchasing power

4. **Check diagnostics**: Expand "Advanced Diagnostics" to verify:
   - Geometric means match your inputs
   - Returns show realistic volatility
   - Inflation behaves as expected

5. **Understand the spread**: The gap between 10p and 90p shows the impact of timing and sequence risk

6. **Share your scenario**: Copy the URL to share your exact parameters with others. Example:
   ```
   http://localhost:3000/?startingAssets=100000&annualReturn=0.07&initialContribution=20000&contributionGrowthRate=0.05&inflationRate=0.025
   ```

## Mathematical Details

### Why Log-Normal?
- Stock returns are better modeled as log-normal than normal
- Prevents returns below -100%
- Matches real-world return distributions

### Volatility Constraint
With the adjustment step, we ensure:
```
sum(log(1 + r_i)) = 30 × log(1 + targetReturn)
```

Which guarantees:
```
exp(sum(log(1 + r_i))) = (1 + targetReturn)^30
```

### Inflation Floor
Inflation rates are constrained to be non-negative using `Math.max(0, ...)`, which may cause slight deviation from the target in low-inflation scenarios.

## Limitations

1. **No market correlation**: Each simulation is independent; doesn't model market regime changes
2. **Constant contributions**: Assumes smooth contribution growth; doesn't model job changes or gaps
3. **No taxes**: All returns are pre-tax
4. **No fees**: Assumes zero investment fees
5. **No withdrawals**: Focuses on accumulation phase only

## License

MIT

## Acknowledgments

Built with Claude Code.
