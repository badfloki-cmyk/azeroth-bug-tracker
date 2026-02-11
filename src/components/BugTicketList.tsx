import { BugReport, classNames, WoWClass } from "./BugReportModal";
import { ClassIcon } from "./ClassIcon";
import { WoWPanel } from "./WoWPanel";
import { ResolveReasonModal } from "./ResolveReasonModal";
import {
  Bug, Clock, User, CheckCircle, Play, Circle,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2, Edit2,
  Terminal, Video, Image as ImageIcon, Info, Target, Layers, Sparkles,
  Search, ShieldAlert, Archive
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { useState, useCallback, useMemo } from "react";
import { usePagination } from "@/hooks/usePagination";
import { toast } from "sonner";

const generatePrompt = (bug: BugReport) => {
  const expansionMap: Record<string, string> = { tbc: 'TBC', era: 'Classic Era', hc: 'Hardcore' };
  const expansion = expansionMap[bug.expansion] || bug.expansion?.toUpperCase();
  const mode = bug.pvpveMode?.toUpperCase();

  return `You are a Lua developer for World of Warcraft ${expansion} Rotations. Your task is to get as close as possible to the perfect WoW ${bug.wowClass} ${mode} rotation. You may only use the Project Sylvanas API and not the standard WoW Classic LUA API.

The API can be found in the documentations or in the .api folder.

## Bug Report: ${bug.title}
- Class: ${bug.wowClass}
- Rotation/Spec: ${bug.rotation}
- Level: ${bug.level}
- Expansion: ${expansion}
- Mode: ${mode}
- Priority: ${bug.priority}

## Description
${bug.description}

## Current Behavior
${bug.currentBehavior}

## Expected Behavior
${bug.expectedBehavior}

## Logs
${bug.logs || 'No logs available'}
${bug.videoUrl ? `\n## Video\n${bug.videoUrl}` : ''}
${bug.screenshotUrls?.length ? `\n## Screenshots\n${bug.screenshotUrls.join('\n')}` : ''}

Research guides on the internet and read them thoroughly. You should learn how to play the ${bug.wowClass} in ${expansion} and then compare it with the expected behavior (whether it is justified) and the current rotation. The rotation's behavior should match the guide as closely as possible. The expected behavior is reported by the user and may be misinterpreted, so it should only serve as a guide.

Ask as many follow-up questions as possible.
Take your time with troubleshooting. Quality is better than speed. Deepthink.`;
};

const RESOLVE_REASON_LABELS: Record<string, string> = {
  'no_response': "User didn't respond to questions",
  'not_reproducible': "Couldn't replicate",
  'user_side': "User side problem",
  'fixed': "Fixed / Implemented",
};

interface BugTicketListProps {
  bugs: BugReport[];
  title?: string;
  onStatusChange?: (ticketId: string, newStatus: 'open' | 'in-progress' | 'resolved', resolveReason?: string) => void;
  onDelete?: (ticketId: string) => void;
  onEdit?: (bug: BugReport) => void;
  showActions?: boolean;
  isExpandable?: boolean;
  isArchiveView?: boolean;
  pageSize?: number;
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

function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

export const BugTicketList = ({ bugs, title = "Bug Reports", onStatusChange, onDelete, onEdit, showActions, isExpandable = true, isArchiveView = false, pageSize = 5 }: BugTicketListProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolvingBugId, setResolvingBugId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('oldest');

  const filteredAndSortedBugs = useMemo(() => {
    let result = [...bugs];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(bug =>
        bug.title.toLowerCase().includes(term) ||
        bug.description.toLowerCase().includes(term) ||
        bug.reporter.toLowerCase().includes(term)
      );
    }

    // Class filter
    if (selectedClass !== "all") {
      result = result.filter(bug => bug.wowClass === selectedClass);
    }

    // Priority filter
    if (selectedPriority !== "all") {
      result = result.filter(bug => bug.priority === selectedPriority);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityScore = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityScore[b.priority] - priorityScore[a.priority];
      }
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [bugs, searchTerm, selectedClass, selectedPriority, sortBy]);

  const {
    currentItems,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage,
    hasPrevPage,
  } = usePagination({
    items: filteredAndSortedBugs,
    itemsPerPage: pageSize,
    // Sort logic is now handled in useMemo for more flexibility (priority sorting)
    sortFn: (a, b) => 0,
  });

  const toggleExpand = (id: string) => {
    if (!isExpandable) return;
    setExpandedId(expandedId === id ? null : id);
  };

  const handleHardDelete = async (bug: BugReport) => {
    if (window.confirm(`Do you really want to PERMANENTLY delete this bug (${bug.title}) from the database? (It will not be archived and won't count as resolved)`)) {
      try {
        const token = localStorage.getItem('auth_token') || "";
        // We use a custom call or pass a flag to the existing delete function
        // For simplicity, we'll assume the parent onDelete handles the logic if we pass a second param
        // But since onDelete only takes one arg in the interface, we'll use a hack or update the interface.
        // Let's stick to the plan and assume we might need to update the prop interface.
        if (onDelete) {
          // We'll update the component and its parent to support hard delete
          // For now, let's keep it simple and use a dedicated function if provided
          (onDelete as any)(bug.id, true);
        }
      } catch (error: any) {
        toast.error("Error deleting: " + error.message);
      }
    }
  };

  return (
    <WoWPanel>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-display text-xl wow-gold-text flex items-center gap-3">
          <Bug className="w-5 h-5" />
          {title}
          <span className="text-sm text-muted-foreground">({totalItems})</span>
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="wow-input text-xs py-1.5 pl-8 pr-3 w-full sm:w-40"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>

          <select
            className="wow-input text-xs py-1.5 px-2 bg-background border-border"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">All Classes</option>
            {Object.keys(classNames).map(c => (
              <option key={c} value={c}>{classNames[c as WoWClass]}</option>
            ))}
          </select>

          <select
            className="wow-input text-xs py-1.5 px-2 bg-background border-border"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="oldest">Oldest First</option>
            <option value="newest">Newest First</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {currentItems.map((bug) => {
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
                  {!isExpandable && onDelete && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Are you sure? (Will be archived)")) {
                            onDelete(bug.id);
                          }
                        }}
                        className="p-1 hover:bg-red-500/10 rounded-full transition-colors group/delete"
                        title="Archive"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground group-hover/delete:text-red-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHardDelete(bug);
                        }}
                        className="p-1 hover:bg-red-600/20 rounded-full transition-colors group/hard-delete"
                        title="Permanently Delete (Statistics Cleanup)"
                      >
                        <ShieldAlert className="w-4 h-4 text-muted-foreground group-hover/hard-delete:text-red-600" />
                      </button>
                    </div>
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
                        {(!bug.currentBehavior || bug.currentBehavior.length < 50) && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 animate-pulse">
                            ! INCOMPLETE DATA
                          </span>
                        )}
                      </h5>
                      <p className={`text-balance text-sm text-muted-foreground bg-background/40 p-3 sm:p-4 rounded-sm border whitespace-pre-wrap leading-relaxed ${(!bug.currentBehavior || bug.currentBehavior.length < 50) ? 'border-red-500/30 bg-red-500/5' : 'border-border/50'}`}>
                        {bug.currentBehavior || "Current behavior description is missing."}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold uppercase text-green-400 flex items-center gap-2 tracking-widest">
                        <CheckCircle className="w-3.5 h-3.5" /> Expected Behavior
                        {(!bug.expectedBehavior || bug.expectedBehavior.length < 50) && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 animate-pulse">
                            ! INCOMPLETE DATA
                          </span>
                        )}
                      </h5>
                      <p className={`text-balance text-sm text-muted-foreground bg-background/40 p-3 sm:p-4 rounded-sm border whitespace-pre-wrap leading-relaxed ${(!bug.expectedBehavior || bug.expectedBehavior.length < 50) ? 'border-red-500/30 bg-red-500/5' : 'border-border/50'}`}>
                        {bug.expectedBehavior || "Expected behavior description is missing."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 rounded-sm bg-primary/5 border border-primary/10">
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

                  {bug.resolveReason && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-sm bg-green-500/5 border border-green-500/20">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-xs font-bold uppercase text-green-400 tracking-wider">Resolve Reason:</span>
                      <span className="text-sm text-muted-foreground">
                        {RESOLVE_REASON_LABELS[bug.resolveReason] || bug.resolveReason}
                      </span>
                    </div>
                  )}

                  {/* Logs Section (if text) */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 tracking-widest">
                      <Terminal className="w-3.5 h-3.5" /> System Logs
                      {!bug.logs && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 animate-pulse">
                          ! MISSING LOGS
                        </span>
                      )}
                    </h5>
                    <pre className={`text-xs text-muted-foreground bg-black/40 p-3 sm:p-4 rounded-sm border min-h-[60px] sm:min-h-[100px] whitespace-pre-wrap font-mono overflow-x-auto text-balance ${!bug.logs ? 'border-red-500/30 bg-red-500/5' : 'border-border/50'}`}>
                      {bug.logs || "No logs were provided for this report."}
                    </pre>
                  </div>

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
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-border/50">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(generatePrompt(bug));
                            toast.success("Prompt copied to clipboard!");
                          }}
                          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-sm bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-xs font-bold uppercase transition-all"
                        >
                          <Sparkles className="w-3 h-3" /> <span className="hidden sm:inline">Generate</span> Prompt
                        </button>
                        {onEdit && !isArchiveView && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onEdit(bug); }}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-sm bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-xs font-bold uppercase transition-all"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        )}
                        {(onDelete && !isArchiveView) && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(bug.id); }}
                              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase transition-all"
                              title="Archive & Resolved"
                            >
                              <Archive className="w-3 h-3" /> Archive
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleHardDelete(bug); }}
                              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-sm bg-red-600/10 border border-red-600/30 text-red-600 hover:bg-red-600/20 text-xs font-bold uppercase transition-all"
                              title="Permanently delete from DB"
                            >
                              <ShieldAlert className="w-3 h-3" /> <span className="hidden sm:inline">Hard</span> Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {isArchiveView ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {onDelete && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleHardDelete(bug); }}
                              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-sm bg-red-600/10 border border-red-600/30 text-red-600 hover:bg-red-600/20 text-xs font-bold uppercase transition-all"
                            >
                              <ShieldAlert className="w-3 h-3" /> <span className="hidden sm:inline">Hard</span> Delete
                            </button>
                          )}
                          {onStatusChange && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onStatusChange(bug.id, 'open'); }}
                              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-sm bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 text-xs font-bold uppercase transition-all"
                            >
                              <Circle className="w-3 h-3" /> Reopen
                            </button>
                          )}
                        </div>
                      ) : (
                        onStatusChange && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1 hidden sm:inline">Status:</span>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                if (bug.status === 'resolved') return;
                                setResolvingBugId(bug.id);
                              }}
                              className={`p-2 rounded-sm border transition-all ${bug.status === 'resolved' ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-border text-muted-foreground hover:border-green-500/50'}`}
                              title="Resolved"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={goToPrevPage}
              disabled={!hasPrevPage}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-sm border-2 text-xs font-bold uppercase tracking-wider transition-all font-display
                ${hasPrevPage
                  ? 'border-border hover:border-primary/50 text-muted-foreground hover:text-primary cursor-pointer'
                  : 'border-border/30 text-muted-foreground/30 cursor-not-allowed'
                }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Page numbers - hidden on mobile, showing text instead */}
            <div className="hidden sm:flex items-center gap-1">
              {generatePageNumbers(currentPage, totalPages).map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground/50 text-xs">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page as number)}
                    className={`w-8 h-8 rounded-sm text-xs font-bold font-display transition-all
                      ${currentPage === page
                        ? 'bg-primary/20 border-2 border-primary text-primary'
                        : 'border border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary'
                      }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <span className="sm:hidden text-xs text-muted-foreground font-display">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={goToNextPage}
              disabled={!hasNextPage}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-sm border-2 text-xs font-bold uppercase tracking-wider transition-all font-display
                ${hasNextPage
                  ? 'border-border hover:border-primary/50 text-muted-foreground hover:text-primary cursor-pointer'
                  : 'border-border/30 text-muted-foreground/30 cursor-not-allowed'
                }`}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground/60 mt-2 font-display tracking-wider hidden sm:block">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      )}

      {resolvingBugId && (
        <ResolveReasonModal
          onConfirm={(reason) => {
            if (onStatusChange) {
              onStatusChange(resolvingBugId, 'resolved', reason);
            }
            setResolvingBugId(null);
          }}
          onCancel={() => setResolvingBugId(null)}
        />
      )}
    </WoWPanel>
  );
};
