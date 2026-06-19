import { motion } from "framer-motion";
import type { BusinessAnalysis } from "@/lib/api";
import { BusinessProfile } from "./results/BusinessProfile";
import { DeepAnalysis } from "./results/DeepAnalysis";
import { FlowAnalysis } from "./results/FlowAnalysis";
import { SwotGrid } from "./results/SwotGrid";
import { DecisionIntelligence } from "./results/DecisionIntelligence";
import { ComparisonSection } from "./results/ComparisonSection";
import { SideBySide } from "./results/SideBySide";
import { WhereTheyWentWrong } from "./results/WhereTheyWentWrong";
import { FinalLearnings } from "./results/FinalLearnings";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, duration: 0.38 },
});

export function AnalysisResults({ data }: { data: BusinessAnalysis }) {
  return (
    <div className="w-full space-y-5 pb-20">

      {/* Row 1: Business Profile — full width */}
      <motion.div {...fade(0)}>
        <BusinessProfile data={data} />
      </motion.div>

      {/* Row 2: Deep Analysis + SWOT side by side on xl */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <motion.div {...fade(1)}><DeepAnalysis data={data.deepAnalysis} /></motion.div>
        <motion.div {...fade(2)}><SwotGrid data={data.swot} /></motion.div>
      </div>

      {/* Row 3: Flow Analysis — full width */}
      <motion.div {...fade(3)}>
        <FlowAnalysis data={data.flowAnalysis} />
      </motion.div>

      {/* Row 4: Decision Intelligence — full width */}
      <motion.div {...fade(4)}>
        <DecisionIntelligence data={data.decisionIntelligence} />
      </motion.div>

      {/* Row 5: Success + Failure comparisons side by side on xl */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <motion.div {...fade(5)}>
          <ComparisonSection title="Successful Business Comparisons" items={data.successfulComparisons} type="success" />
        </motion.div>
        <motion.div {...fade(6)}>
          <ComparisonSection title="Failed Business Comparisons" items={data.failedComparisons} type="failure" />
        </motion.div>
      </div>

      {/* Row 6: Side-by-side patterns — full width */}
      <motion.div {...fade(7)}>
        <SideBySide data={data.sideBySide} />
      </motion.div>

      {/* Row 7: Where went wrong + Final learnings side by side on xl */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <motion.div {...fade(8)}><WhereTheyWentWrong data={data.whereTheyWentWrong} /></motion.div>
        <motion.div {...fade(9)}><FinalLearnings data={data.finalLearnings} /></motion.div>
      </div>

    </div>
  );
}
