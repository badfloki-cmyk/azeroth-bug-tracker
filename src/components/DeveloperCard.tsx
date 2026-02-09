import { WoWPanel } from "./WoWPanel";
import { ClassStatusCard } from "./ClassStatusCard";

type WoWClass = 'rogue' | 'hunter' | 'warrior' | 'warlock' | 'paladin' | 'priest' | 'mage' | 'shaman' | 'druid' | 'esp';
type Status = 'optimized' | 'alpha' | 'beta';

interface ClassInfo {
  wowClass: WoWClass;
  status: Status;
  description: string;
}

interface DeveloperCardProps {
  developer: 'astro' | 'bungee';
  onReportBug: () => void;
}

const developerData = {
  astro: {
    name: "Astro",
    avatar: "/astro-avatar.png",
    classes: [
      { wowClass: 'rogue' as WoWClass, status: 'optimized' as Status, description: 'Fully Optimized PvE (PvP Beta)' },
      { wowClass: 'hunter' as WoWClass, status: 'optimized' as Status, description: 'Fully Optimized' },
      { wowClass: 'warrior' as WoWClass, status: 'optimized' as Status, description: 'Fully Optimized' },
      { wowClass: 'warlock' as WoWClass, status: 'alpha' as Status, description: 'Alpha State' },
      { wowClass: 'paladin' as WoWClass, status: 'optimized' as Status, description: 'Fully Optimized' },
    ],
  },
  bungee: {
    name: "Bungee",
    avatar: "/bungee-avatar.png",
    classes: [
      { wowClass: 'priest' as WoWClass, status: 'optimized' as Status, description: 'Fully Optimized' },
      { wowClass: 'mage' as WoWClass, status: 'optimized' as Status, description: 'Fully Optimized' },
      { wowClass: 'shaman' as WoWClass, status: 'optimized' as Status, description: 'Fully Optimized' },
      { wowClass: 'druid' as WoWClass, status: 'alpha' as Status, description: 'Alpha State' },
      { wowClass: 'esp' as WoWClass, status: 'optimized' as Status, description: 'ESP System' },
    ],
  },
};

export const DeveloperCard = ({ developer, onReportBug }: DeveloperCardProps) => {
  const data = developerData[developer];

  return (
    <WoWPanel className="flex flex-col h-full">
      {/* Developer Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 pb-4 border-b border-border">
        <div className="relative">
          <img
            src={data.avatar}
            alt={data.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-accent shadow-lg animate-glow-pulse"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-status-optimized border-2 border-card" />
        </div>

        <div>
          <h2 className="font-display text-xl sm:text-2xl wow-gold-text">{data.name}</h2>
          <p className="text-muted-foreground text-sm">Class Developer</p>
        </div>
      </div>

      {/* Class Coverage */}
      <div className="flex-1">
        <h3 className="font-display text-xs sm:text-sm text-primary mb-4 tracking-widest">
          🛠 CLASS COVERAGE & STATUS
        </h3>

        <div className="space-y-2">
          {data.classes.map((classInfo) => (
            <ClassStatusCard
              key={classInfo.wowClass}
              wowClass={classInfo.wowClass}
              status={classInfo.status}
              description={classInfo.description}
            />
          ))}
        </div>
      </div>

      {/* Report Bug Button */}
      <button
        onClick={onReportBug}
        className="wow-button-primary w-full mt-6 py-2 sm:py-3"
      >
        Report Bug for {data.name}
      </button>
    </WoWPanel>
  );
};
