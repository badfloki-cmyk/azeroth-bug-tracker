import { ClassIcon } from "./ClassIcon";
import { Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type WoWClass = 'rogue' | 'hunter' | 'warrior' | 'warlock' | 'paladin' | 'priest' | 'mage' | 'shaman' | 'druid' | 'esp' | 'fishingbot';
type Status = 'optimized' | 'alpha' | 'beta';

interface ClassStatusCardProps {
  wowClass: WoWClass;
  status: Status;
  description: string;
}

const classColorClasses: Record<WoWClass, string> = {
  rogue: "class-rogue",
  hunter: "class-hunter",
  warrior: "class-warrior",
  warlock: "class-warlock",
  paladin: "class-paladin",
  priest: "class-priest",
  mage: "class-mage",
  shaman: "class-shaman",
  druid: "class-druid",
  esp: "class-esp",
  fishingbot: "class-fishingbot",
};

const statusConfig = {
  optimized: {
    icon: Check,
    label: "Fully Optimized",
    className: "status-optimized",
  },
  alpha: {
    icon: AlertTriangle,
    label: "Alpha State",
    className: "status-alpha",
  },
  beta: {
    icon: AlertTriangle,
    label: "Beta State",
    className: "status-beta",
  },
};

const classNames: Record<WoWClass, string> = {
  rogue: "Rogue",
  hunter: "Hunter",
  warrior: "Warrior",
  warlock: "Warlock",
  paladin: "Paladin",
  priest: "Priest",
  mage: "Mage",
  shaman: "Shaman",
  druid: "Druid",
  esp: "ESP System",
  fishingbot: "Fishing Bot",
};

export const ClassStatusCard = ({ wowClass, status, description }: ClassStatusCardProps) => {
  const StatusIcon = statusConfig[status].icon;
  
  return (
    <div className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-sm bg-background/50 border border-border hover:border-primary/50 transition-all group">
      <ClassIcon wowClass={wowClass} size="md" />

      <div className="flex-1 min-w-0">
        <h4 className={cn("font-display text-base sm:text-lg tracking-wide", classColorClasses[wowClass])}>
          {classNames[wowClass]}
        </h4>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">{description}</p>
      </div>

      <div className={cn(statusConfig[status].className, "whitespace-nowrap text-[10px] sm:text-xs")}>
        <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span className="hidden sm:inline">{statusConfig[status].label}</span>
        <span className="sm:hidden">{status === 'optimized' ? 'OK' : status === 'alpha' ? 'Alpha' : 'Beta'}</span>
      </div>
    </div>
  );
};
