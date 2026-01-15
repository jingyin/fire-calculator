"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  runMonteCarloSimulation,
  calculatePercentiles,
  formatCurrency,
  formatPercent,
  type SimulationParams,
} from "@/lib/simulation";
import { FIREChart } from "./FIREChart";

const DEFAULT_PARAMS: SimulationParams = {
  startingAssets: 100000,
  annualReturn: 0.07,
  initialContribution: 20000,
  contributionGrowthRate: 0.05,
  inflationRate: 0.025,
  years: 30,
};

export function FIRECalculator() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize params from URL or defaults
  const [params, setParams] = useState<SimulationParams>(() => {
    const urlParams: Partial<SimulationParams> = {};

    const startingAssets = searchParams.get("startingAssets");
    if (startingAssets) urlParams.startingAssets = Number(startingAssets);

    const annualReturn = searchParams.get("annualReturn");
    if (annualReturn) urlParams.annualReturn = Number(annualReturn);

    const initialContribution = searchParams.get("initialContribution");
    if (initialContribution) urlParams.initialContribution = Number(initialContribution);

    const contributionGrowthRate = searchParams.get("contributionGrowthRate");
    if (contributionGrowthRate) urlParams.contributionGrowthRate = Number(contributionGrowthRate);

    const inflationRate = searchParams.get("inflationRate");
    if (inflationRate) urlParams.inflationRate = Number(inflationRate);

    return { ...DEFAULT_PARAMS, ...urlParams };
  });

  const [simulations, setSimulations] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showReal, setShowReal] = useState(() => {
    const viewParam = searchParams.get("view");
    return viewParam === "nominal" ? false : true; // default to real
  });
  const [showDebug, setShowDebug] = useState(false);
  const [seed, setSeed] = useState<number | null>(() => {
    const seedParam = searchParams.get("seed");
    return seedParam ? Number(seedParam) : null;
  });

  // Update URL when params, view, or seed change
  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set("startingAssets", params.startingAssets.toString());
    newSearchParams.set("annualReturn", params.annualReturn.toString());
    newSearchParams.set("initialContribution", params.initialContribution.toString());
    newSearchParams.set("contributionGrowthRate", params.contributionGrowthRate.toString());
    newSearchParams.set("inflationRate", params.inflationRate.toString());
    newSearchParams.set("view", showReal ? "real" : "nominal");
    if (seed !== null) {
      newSearchParams.set("seed", seed.toString());
    }

    const newUrl = `${pathname}?${newSearchParams.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [params, showReal, seed, pathname, router]);

  // Auto-run simulation if seed is in URL on mount
  useEffect(() => {
    if (seed !== null && simulations === null) {
      runSimulationWithSeed(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const runSimulationWithSeed = (simulationSeed: number) => {
    setIsCalculating(true);
    setTimeout(() => {
      const results = runMonteCarloSimulation(params, 100, simulationSeed);
      const nominalPercentiles = calculatePercentiles(results, [10, 25, 50, 75, 90], false);
      const realPercentiles = calculatePercentiles(results, [10, 25, 50, 75, 90], true);

      setSimulations({
        results,
        nominalPercentiles,
        realPercentiles,
      });
      setIsCalculating(false);
    }, 100);
  };

  const handleCalculate = () => {
    // Always generate a new seed when user clicks Calculate
    const newSeed = Math.floor(Math.random() * 1000000);
    setSeed(newSeed);
    runSimulationWithSeed(newSeed);
  };

  const updateParam = (key: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  // Get current percentiles based on toggle
  const currentPercentiles = simulations
    ? (showReal ? simulations.realPercentiles : simulations.nominalPercentiles)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-slate-900 dark:text-slate-50">
            FIRE Calculator
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Financial Independence, Retire Early - with realistic market volatility
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Parameters</CardTitle>
              <CardDescription>Adjust your financial scenario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Starting Assets */}
              <div className="space-y-2">
                <Label htmlFor="startingAssets">Starting Assets</Label>
                <Input
                  id="startingAssets"
                  type="number"
                  value={params.startingAssets}
                  onChange={(e) => updateParam("startingAssets", Number(e.target.value))}
                  step="10000"
                />
                <p className="text-sm text-slate-500">
                  {formatCurrency(params.startingAssets)}
                </p>
              </div>

              {/* Annual Return */}
              <div className="space-y-2">
                <Label htmlFor="annualReturn">
                  Long-term Annual Return: {formatPercent(params.annualReturn)}
                </Label>
                <Slider
                  id="annualReturn"
                  min={0}
                  max={0.15}
                  step={0.001}
                  value={[params.annualReturn]}
                  onValueChange={([value]) => updateParam("annualReturn", value)}
                />
                <p className="text-xs text-slate-500">
                  Geometric average over 30 years (scroll to adjust)
                </p>
              </div>

              {/* Initial Contribution */}
              <div className="space-y-2">
                <Label htmlFor="initialContribution">Initial Annual Contribution</Label>
                <Input
                  id="initialContribution"
                  type="number"
                  value={params.initialContribution}
                  onChange={(e) => updateParam("initialContribution", Number(e.target.value))}
                  step="1000"
                />
                <p className="text-sm text-slate-500">
                  {formatCurrency(params.initialContribution)}
                </p>
              </div>

              {/* Contribution Growth Rate */}
              <div className="space-y-2">
                <Label htmlFor="contributionGrowthRate">
                  Contribution Growth: {formatPercent(params.contributionGrowthRate)}
                </Label>
                <Slider
                  id="contributionGrowthRate"
                  min={0}
                  max={0.10}
                  step={0.001}
                  value={[params.contributionGrowthRate]}
                  onValueChange={([value]) => updateParam("contributionGrowthRate", value)}
                />
                <p className="text-xs text-slate-500">
                  Annual increase in contributions (scroll to adjust)
                </p>
              </div>

              {/* Inflation Rate */}
              <div className="space-y-2">
                <Label htmlFor="inflationRate">
                  Long-term Inflation: {formatPercent(params.inflationRate)}
                </Label>
                <Slider
                  id="inflationRate"
                  min={0}
                  max={0.06}
                  step={0.001}
                  value={[params.inflationRate]}
                  onValueChange={([value]) => updateParam("inflationRate", value)}
                />
                <p className="text-xs text-slate-500">
                  Average inflation over 30 years (scroll to adjust)
                </p>
              </div>

              <Button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="w-full"
                size="lg"
              >
                {isCalculating ? "Calculating..." : "Calculate"}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {simulations ? (
              <>
                {/* Inflation Toggle */}
                <div className="flex justify-end">
                  <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-700 p-1">
                    <button
                      onClick={() => setShowReal(false)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        !showReal
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      Nominal
                    </button>
                    <button
                      onClick={() => setShowReal(true)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        showReal
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      Real
                    </button>
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>50p (Median)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(
                          currentPercentiles.get(50)[29]
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>90p (Best Case)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(
                          currentPercentiles.get(90)[29]
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>10p (Worst Case)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(
                          currentPercentiles.get(10)[29]
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      30-Year Portfolio Growth {showReal && "(Real)"}
                    </CardTitle>
                    <CardDescription>
                      100 simulations showing range of possible outcomes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FIREChart
                      key={showReal ? "real" : "nominal"}
                      percentiles={currentPercentiles}
                      years={30}
                    />
                  </CardContent>
                </Card>

                {/* Debug Section */}
                <Card>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setShowDebug(!showDebug)}
                  >
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="text-xs">{showDebug ? "▼" : "▶"}</span>
                      Advanced Diagnostics
                    </CardTitle>
                  </CardHeader>
                  {showDebug && (
                    <CardContent className="space-y-6">
                      {(() => {
                        // Find representative simulations for each percentile
                        const sortedByFinal = [...simulations.results].sort(
                          (a: any, b: any) => a.finalBalance - b.finalBalance
                        );
                        const getPercentileSim = (p: number) =>
                          sortedByFinal[Math.floor((p / 100) * sortedByFinal.length)];

                        const percentileSims = [
                          { label: "10p", sim: getPercentileSim(10) },
                          { label: "50p", sim: getPercentileSim(50) },
                          { label: "90p", sim: getPercentileSim(90) },
                        ];

                        return percentileSims.map(({ label, sim }) => (
                          <div key={label}>
                            <h4 className="font-semibold text-sm mb-2">
                              {label} Scenario (Final: {formatCurrency(sim.finalBalance)} nominal, {formatCurrency(sim.yearlyData[29].realEndingBalance)} real)
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="text-xs w-full border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="text-left p-1">Year</th>
                                    <th className="text-right p-1">Return</th>
                                    <th className="text-right p-1">Inflation</th>
                                    <th className="text-right p-1">Contribution</th>
                                    <th className="text-right p-1">Nominal</th>
                                    <th className="text-right p-1">Real</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sim.yearlyData.map((year: any) => (
                                    <tr
                                      key={year.year}
                                      className="border-b border-slate-100 dark:border-slate-800"
                                    >
                                      <td className="p-1">{year.year}</td>
                                      <td className={`text-right p-1 ${year.returnRate < 0 ? "text-red-600" : "text-green-600"}`}>
                                        {(year.returnRate * 100).toFixed(1)}%
                                      </td>
                                      <td className="text-right p-1">
                                        {(year.inflationRate * 100).toFixed(1)}%
                                      </td>
                                      <td className="text-right p-1">
                                        {formatCurrency(year.contribution)}
                                      </td>
                                      <td className="text-right p-1">
                                        {formatCurrency(year.endingBalance)}
                                      </td>
                                      <td className="text-right p-1">
                                        {formatCurrency(year.realEndingBalance)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t-2 border-slate-300 dark:border-slate-600 font-semibold">
                                    <td className="p-1">Geo Mean</td>
                                    <td className="text-right p-1">
                                      {((Math.pow(
                                        sim.yearlyData.reduce((acc: number, y: any) => acc * (1 + y.returnRate), 1),
                                        1 / 30
                                      ) - 1) * 100).toFixed(2)}%
                                    </td>
                                    <td className="text-right p-1">
                                      {((Math.pow(
                                        sim.yearlyData.reduce((acc: number, y: any) => acc * (1 + y.inflationRate), 1),
                                        1 / 30
                                      ) - 1) * 100).toFixed(2)}%
                                    </td>
                                    <td colSpan={3}></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        ));
                      })()}
                    </CardContent>
                  )}
                </Card>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <p className="text-slate-500 dark:text-slate-400 text-lg">
                    Adjust parameters and click Calculate to see your FIRE projection
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
