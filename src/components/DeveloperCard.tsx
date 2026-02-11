import { WoWPanel } from "./WoWPanel";
import { ClassStatusCard } from "./ClassStatusCard";
import { useDiscordStatus } from "@/hooks/useDiscordStatus";

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
  onRequestFeature: () => void;
}

const developerData = {
  astro: {
    name: "Astro",
    discordId: "173179043598827522",
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
    discordId: "260411245000261632",
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

const statusColors = {
  online: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]',
  idle: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]',
  dnd: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
  offline: 'bg-zinc-500 shadow-none',
};

const statusLabels = {
  online: 'Online',
  idle: 'Away',
  dnd: 'Busy',
  offline: 'Offline',
};

export const DeveloperCard = ({ developer, onReportBug, onRequestFeature }: DeveloperCardProps) => {
  const data = developerData[developer];
  const { status, data: lanyard } = useDiscordStatus(data.discordId);

  return (
    <WoWPanel className="flex flex-col h-full">
      {/* Developer Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 pb-4 border-b border-border">
        <div className="relative">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 avatar-animated-frame ${developer === 'astro' ? 'universe-border' : developer === 'bungee' ? 'fire-border' : 'border-4 border-accent shadow-lg animate-glow-pulse'}`}>
            <div className="avatar-inner-mask">
              <img
                src={data.avatar}
                alt={data.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className={`absolute -bottom-1 -right-1 z-20 w-6 h-6 rounded-full border-4 border-[#1a1a1b] ${statusColors[status]}`} />
        </div>

        <div className="flex-1">
          <div className="flex flex-col">
            <h2 className="font-display text-xl sm:text-2xl wow-gold-text leading-tight">{data.name}</h2>
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[10px] text-primary/60 uppercase font-bold tracking-[0.15em]">Discord Status</span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${status === 'online' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10'}`}>
                  {statusLabels[status]}
                </span>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-xs mt-2 border-t border-border/30 pt-2">
            {lanyard?.activities?.[0] ? (
              <span className="text-primary/70 italic line-clamp-1">
                {lanyard.activities[0].type === 0 ? "🎮 Playing " : ""}
                {lanyard.activities[0].name}
              </span>
            ) : "Class Developer"}
          </p>
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

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={onReportBug}
          className="wow-button w-full py-2 sm:py-3"
        >
          Report Bug
        </button>
        <button
          onClick={onRequestFeature}
          className="wow-button-primary w-full py-2 sm:py-3"
        >
          Request Feature
        </button>
      </div>
    </WoWPanel>
  );
};
