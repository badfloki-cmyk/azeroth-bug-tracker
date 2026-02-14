import { cn } from "@/lib/utils";

interface ClassIconProps {
  className?: string;
  wowClass: 'rogue' | 'hunter' | 'warrior' | 'warlock' | 'paladin' | 'priest' | 'mage' | 'shaman' | 'druid' | 'esp' | 'fishingbot';
  size?: 'sm' | 'md' | 'lg';
}

const classIcons: Record<string, string> = {
  rogue: "https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg",
  hunter: "https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg",
  warrior: "https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg",
  warlock: "https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg",
  paladin: "https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg",
  priest: "https://wow.zamimg.com/images/wow/icons/large/classicon_priest.jpg",
  mage: "https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg",
  shaman: "https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg",
  druid: "https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg",
  esp: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_eye_01.jpg", // Using a generic eye icon for ESP
  fishingbot: "https://wow.zamimg.com/images/wow/icons/large/trade_fishing.jpg",
};

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

export const ClassIcon = ({ className, wowClass, size = 'md' }: ClassIconProps) => {
  return (
    <div 
      className={cn(
        "rounded-sm overflow-hidden border-2 border-accent shadow-lg",
        sizeClasses[size],
        className
      )}
    >
      <img 
        src={classIcons[wowClass]} 
        alt={`${wowClass} icon`}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
