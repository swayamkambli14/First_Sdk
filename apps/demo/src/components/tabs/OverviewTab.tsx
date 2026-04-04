import StatsRow from '../widgets/StatsRow';
import ActivityFeed from '../widgets/ActivityFeed';

export default function OverviewTab() {
  return (
    <div className="space-y-6">
      <h2 className="font-['Space_Mono'] text-white text-xl font-bold">Overview</h2>
      <StatsRow />
      <ActivityFeed />
    </div>
  );
}
