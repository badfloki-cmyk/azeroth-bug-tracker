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

export type WoWClass = 'rogue' | 'hunter' | 'warrior' | 'warlock' | 'paladin' | 'priest' | 'mage' | 'shaman' | 'druid' | 'esp';

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
  isArchived?: boolean;
  resolveReason?: string | null;
}

const developerClasses: Record<'astro' | 'bungee', WoWClass[]> = {
  astro: ['rogue', 'hunter', 'warrior', 'warlock', 'paladin'],
  bungee: ['priest', 'mage', 'shaman', 'druid', 'esp'],
};

export const classNames: Record<WoWClass, string> = {
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

const getMaxLevel = (expansion: string): number => {
  return expansion === 'tbc' ? 70 : 60;
};

const validateTextQuality = (text: string): string | null => {
  // Repeated punctuation/special characters (more than 3 in a row)
  if (/([./\\,;:!?*#\-_=+~^°@€$%&(){}\[\]<>'"´`|])\1{3,}/.test(text)) {
    return "Satzzeichen dürfen nicht mehr als 3x hintereinander vorkommen.";
  }

  // Repeated letters or umlauts (more than 5 in a row, case-insensitive)
  if (/([a-zA-ZäöüÄÖÜß])\1{5,}/i.test(text)) {
    return "Buchstaben dürfen nicht mehr als 5x hintereinander vorkommen.";
  }

  // Repeated digits (more than 5 in a row)
  if (/(\d)\1{5,}/.test(text)) {
    return "Zahlen dürfen nicht mehr als 5x hintereinander vorkommen.";
  }

  // Excessive consecutive spaces (more than 3)
  if (/ {4,}/.test(text)) {
    return "Zu viele aufeinanderfolgende Leerzeichen.";
  }

  // Excessive consecutive newlines (more than 3)
  if (/\n{4,}/.test(text)) {
    return "Zu viele aufeinanderfolgende Zeilenumbrüche.";
  }

  // Minimum word count (at least 5 words)
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length < 5) {
    return "Der Text muss mindestens 5 Wörter enthalten.";
  }

  // Must contain at least 2 distinct words
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  if (uniqueWords.size < 2) {
    return "Der Text muss mindestens 2 verschiedene Wörter enthalten.";
  }

  // Repeated emoji (more than 3 in a row)
  if (/(\p{Emoji_Presentation})\1{3,}/u.test(text)) {
    return "Emojis dürfen nicht mehr als 3x hintereinander vorkommen.";
  }

  // Repeating short patterns (2-4 chars repeated 4+ times): "hahaha", "asdfasdf"
  if (/(.{2,4})\1{3,}/i.test(text)) {
    return "Sich wiederholende Textmuster sind nicht erlaubt.";
  }

  // All caps prevention (>70% uppercase of alphabetic content)
  const alphaChars = text.replace(/[^a-zA-ZäöüÄÖÜß]/g, '');
  if (alphaChars.length > 10) {
    const upperCount = (text.match(/[A-ZÄÖÜ]/g) || []).length;
    if (upperCount / alphaChars.length > 0.7) {
      return "Bitte nicht nur in Großbuchstaben schreiben.";
    }
  }

  // Keyboard walk detection
  const keyboardWalks = ['qwert', 'werty', 'asdfg', 'sdfgh', 'yxcvb', 'xcvbn', 'qwertz', 'asdfgh', 'yxcvbn'];
  const lower = text.toLowerCase();
  if (keyboardWalks.some(walk => lower.includes(walk))) {
    return "Der Text enthält sinnlose Tastatureingaben.";
  }

  // Minimum alphabetic ratio (at least 40% letters)
  const nonSpaceChars = text.replace(/\s/g, '');
  if (nonSpaceChars.length > 0) {
    const letterCount = (text.match(/[a-zA-ZäöüÄÖÜß]/g) || []).length;
    if (letterCount / nonSpaceChars.length < 0.4) {
      return "Der Text muss überwiegend aus Wörtern bestehen.";
    }
  }

  // Repeating word patterns ("foo bar foo bar foo bar")
  const wordList = text.trim().toLowerCase().split(/\s+/);
  for (let patLen = 2; patLen <= 3; patLen++) {
    for (let i = 0; i <= wordList.length - patLen * 3; i++) {
      const pattern = wordList.slice(i, i + patLen).join(' ');
      const next1 = wordList.slice(i + patLen, i + patLen * 2).join(' ');
      const next2 = wordList.slice(i + patLen * 2, i + patLen * 3).join(' ');
      if (pattern === next1 && pattern === next2) {
        return "Sich wiederholende Wortmuster sind nicht erlaubt.";
      }
    }
  }

  return null;
};

const classSpecs: Partial<Record<WoWClass, string[]>> = {
  warrior: ['Arms', 'Fury', 'Protection'],
  rogue: ['Assassination', 'Combat', 'Subtlety'],
  hunter: ['Beast Mastery', 'Marksmanship', 'Survival'],
  warlock: ['Affliction', 'Demonology', 'Destruction'],
  paladin: ['Holy', 'Protection', 'Retribution'],
  priest: ['Discipline', 'Holy', 'Shadow'],
  mage: ['Arcane', 'Fire', 'Frost'],
  shaman: ['Elemental', 'Enhancement', 'Restoration'],
  druid: ['Balance', 'Feral', 'Restoration'],
};

export const BugReportModal = ({ developer, onClose, onSubmit, initialBug }: BugReportModalProps) => {
  const [selectedClass, setSelectedClass] = useState<WoWClass | null>(initialBug?.wowClass || null);
  const [rotation, setRotation] = useState<string>(initialBug?.rotation || '');
  const [pvpveMode, setPvpveMode] = useState<'pve' | 'pvp' | ''>(initialBug?.pvpveMode || '');
  const [level, setLevel] = useState<string>(initialBug?.level?.toString() || '');
  const [expansion, setExpansion] = useState<'tbc' | 'era' | 'hc' | ''>(initialBug?.expansion || '');

  const maxLevel = expansion ? getMaxLevel(expansion) : 70;

  const handleExpansionChange = (value: 'tbc' | 'era' | 'hc') => {
    setExpansion(value);
    const newMax = getMaxLevel(value);
    if (level && parseInt(level) > newMax) {
      setLevel(newMax.toString());
    }
  };
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

    if (!discordUsername.trim()) {
      toast.error("Discord Username ist ein Pflichtfeld.");
      return;
    }

    if (!selectedClass || (selectedClass !== 'esp' && !rotation) || !pvpveMode || !level || !expansion || !title ||
      !currentBehavior || !expectedBehavior || !sylvanasUsername || !logs) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Level validation based on expansion
    const levelNum = parseInt(level);
    const levelMax = getMaxLevel(expansion);
    if (isNaN(levelNum) || levelNum < 1 || levelNum > levelMax) {
      toast.error(`Level muss zwischen 1 und ${levelMax} liegen (${expansion.toUpperCase()}).`);
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

    // Text quality validation
    const currentBehaviorError = validateTextQuality(currentBehavior);
    if (currentBehaviorError) {
      toast.error(`Current Behavior: ${currentBehaviorError}`);
      return;
    }

    const expectedBehaviorError = validateTextQuality(expectedBehavior);
    if (expectedBehaviorError) {
      toast.error(`Expected Behavior: ${expectedBehaviorError}`);
      return;
    }

    if (currentBehavior.trim().toLowerCase() === expectedBehavior.trim().toLowerCase()) {
      toast.error("Current Behavior und Expected Behavior dürfen nicht identisch sein.");
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
      <WoWPanel className="relative z-10 w-full max-w-lg sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-auto p-4 sm:p-6">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-muted-foreground hover:text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="font-display text-xl sm:text-2xl wow-gold-text mb-4 sm:mb-6">
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
                  onClick={() => { setSelectedClass(wowClass); setRotation(''); }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 rounded-sm border-2 transition-all text-xs sm:text-sm ${selectedClass === wowClass
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

          {/* Spec Selection */}
          {selectedClass && selectedClass !== 'esp' && classSpecs[selectedClass] && (
            <div>
              <label className="block font-display text-sm text-primary mb-2 tracking-wider">
                Specialization
              </label>
              <Select value={rotation} onValueChange={(value) => setRotation(value)}>
                <SelectTrigger className="wow-input">
                  <SelectValue placeholder="Select Specialization" />
                </SelectTrigger>
                <SelectContent>
                  {classSpecs[selectedClass]!.map((spec) => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
              placeholder={expansion ? `1 - ${maxLevel}` : "Wähle zuerst eine Expansion"}
              min="1"
              max={maxLevel}
              className="wow-input"
              required
            />
            {expansion && (
              <p className="text-xs text-muted-foreground mt-1">
                Level 1-{maxLevel} ({expansion.toUpperCase()})
              </p>
            )}
          </div>

          {/* Used Expansion */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Used Expansion
            </label>
            <Select value={expansion} onValueChange={(value) => handleExpansionChange(value as 'tbc' | 'era' | 'hc')}>
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
              Discord Username <span className="text-red-400">*</span>
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
              className="wow-input min-h-[80px] sm:min-h-[120px] resize-y"
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
              className="wow-input min-h-[100px] sm:min-h-[150px] resize-y"
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
              className="wow-input min-h-[100px] sm:min-h-[150px] resize-y"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {expectedBehavior.length} / 50 characters (Minimum)
            </p>
          </div>

          {/* Logs */}
          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Logs
            </label>
            <Textarea
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              placeholder="Add relevant logs here..."
              className="wow-input min-h-[60px] sm:min-h-[100px] resize-y"
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-sm border-2 font-display text-xs sm:text-sm uppercase transition-all ${priority === p
                    ? p === 'critical'
                      ? 'border-red-500 bg-red-500/20 text-red-400'
                      : p === 'high'
                        ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                        : p === 'medium'
                          ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                          : 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-border hover:border-primary/50 text-muted-foreground'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4">
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
