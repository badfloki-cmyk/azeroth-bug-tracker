import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { WoWPanel } from "./WoWPanel";
import { ClassIcon } from "./ClassIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

type WoWClass = 'rogue' | 'hunter' | 'warrior' | 'warlock' | 'paladin' | 'priest' | 'mage' | 'shaman' | 'druid' | 'esp';

interface BugReportModalProps {
  developer: 'astro' | 'bungee';
  onClose: () => void;
  onSubmit: (bug: BugReport) => void;
  initialBug?: BugReport | null;
}

export interface BugReport {
  id: string;
  developer: 'astro' | 'bungee';
  wowClass: WoWClass;
  rotation: string;
  pvpveMode: 'pve' | 'pvp';
  level: number;
  expansion: 'tbc' | 'era' | 'hc';
  title: string;
  description: string;
  currentBehavior: string;
  expectedBehavior: string;
  logs?: string;
  videoUrl?: string;
  screenshotUrls: string[];
  discordUsername: string;
  sylvanasUsername: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: Date;
  reporter: string;
}

const developerClasses: Record<'astro' | 'bungee', WoWClass[]> = {
  astro: ['rogue', 'hunter', 'warrior', 'warlock', 'paladin'],
  bungee: ['priest', 'mage', 'shaman', 'druid', 'esp'],
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
};

export const BugReportModal = ({ developer, onClose, onSubmit, initialBug }: BugReportModalProps) => {
  const [selectedClass, setSelectedClass] = useState<WoWClass | null>(initialBug?.wowClass || null);
  const [rotation, setRotation] = useState<string>(initialBug?.rotation || '');
  const [pvpveMode, setPvpveMode] = useState<'pve' | 'pvp' | ''>(initialBug?.pvpveMode || '');
  const [level, setLevel] = useState<string>(initialBug?.level?.toString() || '80');
  const [expansion, setExpansion] = useState<'tbc' | 'era' | 'hc' | ''>(initialBug?.expansion || '');
  const [title, setTitle] = useState(initialBug?.title || "");
  const [description, setDescription] = useState(initialBug?.description || "");
  const [currentBehavior, setCurrentBehavior] = useState(initialBug?.currentBehavior || "");
  const [expectedBehavior, setExpectedBehavior] = useState(initialBug?.expectedBehavior || "");
  const [logs, setLogs] = useState(initialBug?.logs || "");
  const [videoUrl, setVideoUrl] = useState(initialBug?.videoUrl || "");
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>(
    initialBug?.screenshotUrls && initialBug.screenshotUrls.length > 0
      ? initialBug.screenshotUrls
      : ['']
  );
  const [discordUsername, setDiscordUsername] = useState(initialBug?.discordUsername || "");
  const [sylvanasUsername, setSylvanasUsername] = useState(initialBug?.sylvanasUsername || "");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>(initialBug?.priority || 'medium');

  const addScreenshotUrl = () => {
    setScreenshotUrls([...screenshotUrls, '']);
  };

  const removeScreenshotUrl = (index: number) => {
    setScreenshotUrls(screenshotUrls.filter((_, i) => i !== index));
  };

  const updateScreenshotUrl = (index: number, value: string) => {
    const newUrls = [...screenshotUrls];
    newUrls[index] = value;
    setScreenshotUrls(newUrls);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClass || !rotation || !pvpveMode || !level || !expansion || !title ||
      !currentBehavior || !expectedBehavior || !discordUsername || !sylvanasUsername) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (currentBehavior.length < 50) {
      toast.error("Current behavior must be at least 50 characters long.");
      return;
    }

    if (expectedBehavior.length < 50) {
      toast.error("Expected behavior must be at least 50 characters long.");
      return;
    }

    const bug: BugReport = {
      id: initialBug?.id || Math.random().toString(36).substr(2, 9),
      developer,
      wowClass: selectedClass,
      rotation,
      pvpveMode: pvpveMode as 'pve' | 'pvp',
      level: parseInt(level),
      expansion: expansion as 'tbc' | 'era' | 'hc',
      title,
      description,
      currentBehavior,
      expectedBehavior,
      logs,
      videoUrl,
      screenshotUrls: screenshotUrls.filter(url => url.trim() !== ""),
      discordUsername,
      sylvanasUsername,
      priority,
      status: initialBug?.status || 'open',
      createdAt: initialBug?.createdAt || new Date(),
      reporter: initialBug?.reporter || sylvanasUsername,
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
      <WoWPanel className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-auto">
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
              Rotation / Class
            </label>
            <div className="flex flex-wrap gap-3">
              {developerClasses[developer].map((wowClass) => (
                <button
                  key={wowClass}
                  type="button"
                  onClick={() => setSelectedClass(wowClass)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-sm border-2 transition-all ${selectedClass === wowClass
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

          {/* Rotation Name */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Specific Rotation
            </label>
            <input
              type="text"
              value={rotation}
              onChange={(e) => setRotation(e.target.value)}
              placeholder="e.g. Fire Mage, Frost Mage, Destruction Warlock..."
              className="wow-input"
              required
            />
          </div>

          {/* PvE / PvP */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              PvE / PvP
            </label>
            <Select value={pvpveMode} onValueChange={(value) => setPvpveMode(value as 'pve' | 'pvp')}>
              <SelectTrigger className="wow-input">
                <SelectValue placeholder="Select PvE or PvP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pve">PvE</SelectItem>
                <SelectItem value="pvp">PvP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Current Level */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Current Level
            </label>
            <input
              type="number"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="e.g. 80"
              min="1"
              max="80"
              className="wow-input"
              required
            />
          </div>

          {/* Used Expansion */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Used Expansion
            </label>
            <Select value={expansion} onValueChange={(value) => setExpansion(value as 'tbc' | 'era' | 'hc')}>
              <SelectTrigger className="wow-input">
                <SelectValue placeholder="Select Expansion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tbc">TBC</SelectItem>
                <SelectItem value="era">ERA</SelectItem>
                <SelectItem value="hc">HC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project Sylvanas Username */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Project Sylvanas Username
            </label>
            <input
              type="text"
              value={sylvanasUsername}
              onChange={(e) => setSylvanasUsername(e.target.value)}
              placeholder="Your Project Sylvanas Username..."
              className="wow-input"
              required
            />
          </div>

          {/* Discord Username */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Discord Username
            </label>
            <input
              type="text"
              value={discordUsername}
              onChange={(e) => setDiscordUsername(e.target.value)}
              placeholder="Your Discord Username..."
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
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed steps to reproduce..."
              className="wow-input min-h-[120px] resize-y"
            />
          </div>

          {/* Current Behavior */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Current Behavior (minimum 50 characters)
            </label>
            <Textarea
              value={currentBehavior}
              onChange={(e) => setCurrentBehavior(e.target.value)}
              placeholder="Describe the current behavior in detail..."
              className="wow-input min-h-[150px] resize-y"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {currentBehavior.length} / 50 characters (Minimum)
            </p>
          </div>

          {/* Expected Behavior */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Expected Behavior (minimum 50 characters)
            </label>
            <Textarea
              value={expectedBehavior}
              onChange={(e) => setExpectedBehavior(e.target.value)}
              placeholder="Describe the expected behavior in detail..."
              className="wow-input min-h-[150px] resize-y"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {expectedBehavior.length} / 50 characters (Minimum)
            </p>
          </div>

          {/* Logs */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Logs (Optional)
            </label>
            <Textarea
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              placeholder="Add relevant logs here..."
              className="wow-input min-h-[100px] resize-y"
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Video Clip URL (Optional - e.g. Streamable)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://streamable.com/..."
              className="wow-input"
            />
          </div>

          {/* Screenshot URLs */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Screenshot URLs (Optional - e.g. Imgur)
            </label>
            {screenshotUrls.map((url, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateScreenshotUrl(index, e.target.value)}
                  placeholder={`https://imgur.com/... (Screenshot ${index + 1})`}
                  className="wow-input flex-1"
                />
                {screenshotUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeScreenshotUrl(index)}
                    className="px-3 py-2 rounded-sm border-2 border-border hover:border-destructive text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addScreenshotUrl}
              className="flex items-center gap-2 px-4 py-2 rounded-sm border-2 border-border hover:border-primary/50 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Screenshot URL
            </button>
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
                  className={`px-4 py-2 rounded-sm border-2 font-display text-sm uppercase transition-all ${priority === p
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
