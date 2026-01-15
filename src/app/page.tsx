import { Suspense } from "react";
import { FIRECalculator } from "@/components/FIRECalculator";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <FIRECalculator />
    </Suspense>
  );
}
