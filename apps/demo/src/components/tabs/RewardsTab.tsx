import BadgeGrid from '../widgets/BadgeGrid';
import PointsHistoryTable from '../widgets/PointsHistoryTable';

export default function RewardsTab() {
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="font-['Space_Mono'] text-white text-xl font-bold">My Rewards</h2>
        <span className="font-mono text-[10px] text-amber-400/70 border border-amber-400/20 px-2 py-0.5 rounded tracking-widest uppercase">
          Demo Data
        </span>
      </div>
      <BadgeGrid />
      <PointsHistoryTable />
    </div>
  );
}
