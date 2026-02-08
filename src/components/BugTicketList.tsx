import { BugReport } from "./BugReportModal";
import { ClassIcon } from "./ClassIcon";
import { WoWPanel } from "./WoWPanel";
import {
  Bug, Clock, User, CheckCircle, Play, Circle,
  ChevronDown, ChevronUp, Trash2, Edit2,
  Terminal, Video, Image as ImageIcon, Info, Target, Layers, Sparkles
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

const generatePrompt = (bug: BugReport) => {
  const expansionMap: Record<string, string> = { tbc: 'TBC', era: 'Classic Era', hc: 'Hardcore' };
  const expansion = expansionMap[bug.expansion] || bug.expansion?.toUpperCase();
  const mode = bug.pvpveMode?.toUpperCase();

  return `Du bist Lua-Entwickler für World of Warcraft ${expansion} Rotations. Deine Aufgabe ist es so nah wie möglich an die perfekte WoW ${bug.wowClass} ${mode} Rotation zu kommen. Du darfst nur Project Sylvanas API verwenden und nicht die standardmäßige WoW Classic LUA API.

Die API findest du im documentations oder im .api folder.

## Bug Report: ${bug.title}
- Klasse: ${bug.wowClass}
- Rotation/Spec: ${bug.rotation}
- Level: ${bug.level}
- Expansion: ${expansion}
- Modus: ${mode}
- Priorität: ${bug.priority}

## Beschreibung
${bug.description}

## Aktuelles Verhalten
${bug.currentBehavior}

## Erwartetes Verhalten
${bug.expectedBehavior}

## Logs
${bug.logs || 'Keine Logs vorhanden'}
${bug.videoUrl ? `\n## Video\n${bug.videoUrl}` : ''}
${bug.screenshotUrls?.length ? `\n## Screenshots\n${bug.screenshotUrls.join('\n')}` : ''}

Recherchiere im Internet nach Guides und lies dir diese ausreichend durch. Du sollst verstehen lernen wie man den ${bug.wowClass} in ${expansion} spielt und das dann mit dem erwarteten Verhalten vergleichen (ob dieses auch gerechtfertig ist) und mit der aktuellen Rotation vergleichen. Das Verhalten der Rotation soll möglichst dem im Guide entsprehen. Das erwartete Verhalten wird vom benutzer reported und kann fehlinterpretiert sein und soll nur als Anhaltspunkt dienen.

Stelle so viele Rückfragen wie möglich.
Lasse dir bei der Fehlersuche ruhig Zeit dabei. Qualität ist besser als Schnelligkeit. Deepthink.`;
};

interface BugTicketListProps {
  bugs: BugReport[];
  title?: string;
  onStatusChange?: (ticketId: string, newStatus: 'open' | 'in-progress' | 'resolved') => void;
  onDelete?: (ticketId: string) => void;
  onEdit?: (bug: BugReport) => void;
  showActions?: boolean;
  isExpandable?: boolean;
}

const priorityColors = {
  low: 'text-green-400 bg-green-500/10 border-green-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const statusColors = {
  'open': 'text-red-400 bg-red-500/10',
  'in-progress': 'text-yellow-400 bg-yellow-500/10',
  'resolved': 'text-green-400 bg-green-500/10',
};

const statusIcons = {
  'open': Circle,
  'in-progress': Play,
  'resolved': CheckCircle,
};

export const BugTicketList = ({ bugs, title = "Bug Reports", onStatusChange, onDelete, onEdit, showActions, isExpandable = true }: BugTicketListProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    if (!isExpandable) return;
    setExpandedId(expandedId === id ? null : id);
  };

  if (bugs.length === 0) {
    return (
      <WoWPanel className="text-center py-12">
        <Bug className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="font-display text-base sm:text-lg text-muted-foreground">No Bug Reports</h3>
        <p className="text-sm text-muted-foreground/60 mt-2">
          All systems working! Report a bug if you find one.
        </p>
      </WoWPanel>
    );
  }

  return (
    <WoWPanel>
      <h2 className="font-display text-xl wow-gold-text mb-6 flex items-center gap-3">
        <Bug className="w-5 h-5" />
        {title}
        <span className="text-sm text-muted-foreground">({bugs.length})</span>
      </h2>

      <div className="space-y-3">
        {bugs.map((bug) => {
          const StatusIcon = statusIcons[bug.status];
          const isExpanded = expandedId === bug.id;

          return (
            <div
              key={bug.id}
              className="rounded-sm bg-background/50 border border-border hover:border-primary/30 transition-all overflow-hidden"
            >
              {/* Summary View */}
              <div
                className={`p-3 sm:p-4 flex items-start gap-2 sm:gap-4 transition-colors ${isExpandable ? 'cursor-pointer hover:bg-white/5' : ''}`}
                onClick={() => toggleExpand(bug.id)}
              >
                <ClassIcon wowClass={bug.wowClass} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h4 className="font-display text-sm sm:text-base text-foreground truncate">{bug.title}</h4>
                    <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${priorityColors[bug.priority]}`}>
                      {bug.priority}
                    </span>
                  </div>

                  <p className={`text-sm text-muted-foreground mb-2 ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {bug.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground/70 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {bug.reporter}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(bug.createdAt, { addSuffix: true, locale: enUS })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {bug.expansion?.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`px-2 py-1 text-xs font-bold uppercase rounded flex items-center gap-1 ${statusColors[bug.status]}`}>
                    <StatusIcon className="w-3 h-3" />
                    {bug.status === 'open' ? 'Open' : bug.status === 'in-progress' ? 'In Progress' : 'Resolved'}
                  </span>
                  {isExpandable && (
                    isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Detailed View */}
              {isExpanded && (
                <div className="px-3 pb-4 pt-2 sm:px-5 sm:pb-6 sm:pt-3 border-t border-border bg-black/40 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold uppercase text-primary flex items-center gap-2 tracking-widest">
                        <Info className="w-3.5 h-3.5" /> Current Behavior
                      </h5>
                      <p className="text-sm text-balance text-muted-foreground bg-background/40 p-3 sm:p-4 rounded-sm border border-border/50 min-h-[80px] sm:min-h-[120px] whitespace-pre-wrap leading-relaxed">
                        {bug.currentBehavior}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold uppercase text-green-400 flex items-center gap-2 tracking-widest">
                        <CheckCircle className="w-3.5 h-3.5" /> Expected Behavior
                      </h5>
                      <p className="text-sm text-balance text-muted-foreground bg-background/40 p-3 sm:p-4 rounded-sm border border-border/50 min-h-[80px] sm:min-h-[120px] whitespace-pre-wrap leading-relaxed">
                        {bug.expectedBehavior}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-sm bg-primary/5 border border-primary/10">
                    <div className="text-xs">
                      <span className="text-muted-foreground/60 font-bold uppercase block mb-2 text-[10px]">Rotation / Specs</span>
                      <span className="text-foreground font-medium flex items-center gap-2 text-sm bg-black/20 p-2 rounded-sm border border-border/30">
                        <Target className="w-3.5 h-3.5 text-primary" /> {bug.rotation}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground/60 font-bold uppercase block mb-2 text-[10px]">Character Level / Mode</span>
                      <span className="text-foreground font-medium uppercase text-sm bg-black/20 p-2 rounded-sm border border-border/30 block">
                        Level {bug.level} / {bug.pvpveMode}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground/60 font-bold uppercase block mb-2 text-[10px]">Discord Contact</span>
                      <span className="text-foreground font-medium text-sm bg-black/20 p-2 rounded-sm border border-border/30 block">
                        @{bug.discordUsername}
                      </span>
                    </div>
                  </div>

                  {/* Logs Section (if text) */}
                  {bug.logs && !bug.logs.startsWith('http') && (
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 tracking-widest">
                        <Terminal className="w-3.5 h-3.5" /> System Logs
                      </h5>
                      <pre className="text-xs text-muted-foreground bg-black/40 p-3 sm:p-4 rounded-sm border border-border/50 min-h-[60px] sm:min-h-[100px] whitespace-pre-wrap font-mono overflow-x-auto">
                        {bug.logs}
                      </pre>
                    </div>
                  )}

                  {(bug.videoUrl || (bug.screenshotUrls && bug.screenshotUrls.length > 0) || (bug.logs && bug.logs.startsWith('http'))) && (
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" /> Media & External Links
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {bug.logs && bug.logs.startsWith('http') && (
                          <a href={bug.logs} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-background/50 border border-border hover:border-primary text-xs transition-colors">
                            <Terminal className="w-3 h-3 text-primary" /> View External Logs
                          </a>
                        )}
                        {bug.videoUrl && (
                          <a href={bug.videoUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-background/50 border border-border hover:border-primary text-xs transition-colors">
                            <Video className="w-3 h-3 text-red-500" /> Watch Video
                          </a>
                        )}
                        {bug.screenshotUrls?.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-background/50 border border-border hover:border-primary text-xs transition-colors">
                            <ImageIcon className="w-3 h-3 text-blue-500" /> Screenshot {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {showActions && (
                    <div className="flex justify-between items-center pt-4 border-t border-border/50">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(generatePrompt(bug));
                            toast.success("Prompt in Zwischenablage kopiert!");
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-sm bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-xs font-bold uppercase transition-all"
                        >
                          <Sparkles className="w-3 h-3" /> Generate Prompt
                        </button>
                        {onEdit && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onEdit(bug); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-sm bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-xs font-bold uppercase transition-all"
                          >
                            <Edit2 className="w-3 h-3" /> Edit Ticket
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(bug.id); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase transition-all"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        )}
                      </div>

                      {onStatusChange && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Update Status:</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); onStatusChange(bug.id, 'open'); }}
                            className={`p-2 rounded-sm border transition-all ${bug.status === 'open' ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-border text-muted-foreground hover:border-red-500/50'}`}
                            title="Open"
                          >
                            <Circle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onStatusChange(bug.id, 'in-progress'); }}
                            className={`p-2 rounded-sm border transition-all ${bug.status === 'in-progress' ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400' : 'border-border text-muted-foreground hover:border-yellow-500/50'}`}
                            title="In Progress"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onStatusChange(bug.id, 'resolved'); }}
                            className={`p-2 rounded-sm border transition-all ${bug.status === 'resolved' ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-border text-muted-foreground hover:border-green-500/50'}`}
                            title="Resolved"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </WoWPanel>
  );
};
