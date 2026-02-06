import { useState } from "react";
import { X } from "lucide-react";
import { WoWPanel } from "./WoWPanel";
import { ClassIcon } from "./ClassIcon";

type WoWClass = 'rogue' | 'hunter' | 'warrior' | 'warlock' | 'paladin' | 'priest' | 'mage' | 'shaman' | 'druid';

interface BugReportModalProps {
  developer: 'astro' | 'bungee';
  onClose: () => void;
  onSubmit: (bug: BugReport) => void;
}

export interface BugReport {
  id: string;
  developer: 'astro' | 'bungee';
  wowClass: WoWClass;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: Date;
  reporter: string;
}

const developerClasses: Record<'astro' | 'bungee', WoWClass[]> = {
  astro: ['rogue', 'hunter', 'warrior', 'warlock', 'paladin'],
  bungee: ['priest', 'mage', 'shaman', 'druid'],
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
};

export const BugReportModal = ({ developer, onClose, onSubmit }: BugReportModalProps) => {
  const [selectedClass, setSelectedClass] = useState<WoWClass | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [reporter, setReporter] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !title || !description || !reporter) return;

    const bug: BugReport = {
      id: Date.now().toString(),
      developer,
      wowClass: selectedClass,
      title,
      description,
      priority,
      status: 'open',
      createdAt: new Date(),
      reporter,
    };

    onSubmit(bug);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <WoWPanel className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="font-display text-2xl wow-gold-text mb-6">
          Report Bug - {developer === 'astro' ? 'Astro' : 'Bungee'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Class Selection */}
          <div>
            <label className="block font-display text-sm text-primary mb-3 tracking-wider">
              Select Class
            </label>
            <div className="flex flex-wrap gap-3">
              {developerClasses[developer].map((wowClass) => (
                <button
                  key={wowClass}
                  type="button"
                  onClick={() => setSelectedClass(wowClass)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-sm border-2 transition-all ${
                    selectedClass === wowClass
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <ClassIcon wowClass={wowClass} size="sm" />
                  <span className={`class-${wowClass}`}>{classNames[wowClass]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reporter Name */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Your Name
            </label>
            <input
              type="text"
              value={reporter}
              onChange={(e) => setReporter(e.target.value)}
              placeholder="Enter your name..."
              className="wow-input"
              required
            />
          </div>

          {/* Title */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Bug Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the bug..."
              className="wow-input"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed steps to reproduce, expected vs actual behavior..."
              className="wow-input min-h-[120px] resize-y"
              required
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block font-display text-sm text-primary mb-3 tracking-wider">
              Priority
            </label>
            <div className="flex gap-3">
              {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-4 py-2 rounded-sm border-2 font-display text-sm uppercase transition-all ${
                    priority === p
                      ? p === 'critical'
                        ? 'border-red-500 bg-red-500/20 text-red-400'
                        : p === 'high'
                        ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                        : p === 'medium'
                        ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                        : 'border-green-500 bg-green-500/20 text-green-400'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="wow-button flex-1">
              Cancel
            </button>
            <button type="submit" className="wow-button-primary flex-1">
              Submit Bug Report
            </button>
          </div>
        </form>
      </WoWPanel>
    </div>
  );
};
