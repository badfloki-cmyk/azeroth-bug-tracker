import { useState } from "react";
import { WoWPanel } from "./WoWPanel";
import {
  Code, GitBranch, Plus, Clock, FileCode, User,
  Trash2, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import type { BugReport } from "./BugReportModal";

interface CodeChange {
  id: string;
  developer_id: string;
  file_path: string;
  change_description: string;
  change_type: 'create' | 'update' | 'delete' | 'fix' | 'feature';
  related_ticket_id: string | null;
  github_url?: string;
  created_at: string;
}

interface CodeChangeTrackerProps {
  changes: CodeChange[];
  onAddChange: (filePath: string, description: string, type: CodeChange['change_type'], ticketId?: string, githubUrl?: string) => void;
  onDelete?: (changeId: string) => void;
  bugs: BugReport[];
  currentDeveloperId?: string;
}

const changeTypeConfig = {
  create: { label: 'Created', color: 'text-green-400 bg-green-500/10' },
  update: { label: 'Updated', color: 'text-blue-400 bg-blue-500/10' },
  delete: { label: 'Deleted', color: 'text-red-400 bg-red-500/10' },
  fix: { label: 'Fix', color: 'text-orange-400 bg-orange-500/10' },
  feature: { label: 'Feature', color: 'text-purple-400 bg-purple-500/10' },
};

export const CodeChangeTracker = ({ changes, onAddChange, onDelete, bugs, currentDeveloperId }: CodeChangeTrackerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [filePath, setFilePath] = useState("");
  const [description, setDescription] = useState("");
  const [changeType, setChangeType] = useState<CodeChange['change_type']>('update');
  const [relatedTicket, setRelatedTicket] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath || !description) return;

    onAddChange(filePath, description, changeType, relatedTicket || undefined, githubUrl || undefined);
    setFilePath("");
    setDescription("");
    setChangeType('update');
    setRelatedTicket("");
    setGithubUrl("");
    setShowForm(false);
  };

  return (
    <WoWPanel>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl wow-gold-text flex items-center gap-3">
          <GitBranch className="w-5 h-5" />
          Code Tracker
        </h2>

        <button
          onClick={() => setShowForm(!showForm)}
          className="wow-button py-1 px-3 flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Add Change Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-sm bg-background/50 border border-border space-y-4 shadow-xl">
          <div>
            <label className="block font-display text-xs text-primary mb-1 tracking-wider">
              File Path
            </label>
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="src/components/..."
              className="wow-input text-sm py-2"
              required
            />
          </div>

          <div>
            <label className="block font-display text-xs text-primary mb-1 tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was changed?"
              className="wow-input text-sm py-2 min-h-[60px] resize-y"
              required
            />
          </div>

          <div>
            <label className="block font-display text-xs text-primary mb-2 tracking-wider">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(changeTypeConfig) as CodeChange['change_type'][]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setChangeType(type)}
                  className={`px-3 py-1 rounded-sm text-xs font-bold uppercase transition-all ${changeType === type
                    ? changeTypeConfig[type].color + ' border border-current'
                    : 'border border-border hover:border-primary/50'
                    }`}
                >
                  {changeTypeConfig[type].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-display text-xs text-primary mb-1 tracking-wider">
              Related Ticket (optional)
            </label>
            <select
              value={relatedTicket}
              onChange={(e) => setRelatedTicket(e.target.value)}
              className="wow-input text-sm py-2"
            >
              <option value="">No Ticket</option>
              {bugs.map((bug) => (
                <option key={bug.id} value={bug.id}>
                  [{bug.wowClass.toUpperCase()}] {bug.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-display text-xs text-primary mb-1 tracking-wider">
              GitHub URL (optional)
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="wow-input text-sm py-2"
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="wow-button flex-1 text-sm py-2">
              Cancel
            </button>
            <button type="submit" className="wow-button-primary flex-1 text-sm py-2">
              Save Change
            </button>
          </div>
        </form>
      )}

      {/* Changes List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
        {changes.length === 0 ? (
          <div className="text-center py-8">
            <Code className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No changes logged yet</p>
          </div>
        ) : (
          changes.map((change) => (
            <div
              key={change.id}
              className="p-3 rounded-sm bg-background/50 border border-border group hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <FileCode className="w-4 h-4 text-primary mt-1 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${changeTypeConfig[change.change_type].color}`}>
                        {changeTypeConfig[change.change_type].label}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate italic">
                        {change.file_path}
                      </span>
                      {change.github_url && (
                        <a
                          href={change.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 transition-colors ml-1"
                          title="View on GitHub"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {onDelete && (
                      <button
                        onClick={() => onDelete(change.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-all"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-foreground mb-1 leading-snug">
                    {change.change_description}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70">
                    <span className="flex items-center gap-1 text-primary/80">
                      <User className="w-3 h-3" />
                      {typeof change.developer_id === 'object' ? (change.developer_id as any).username : 'Developer'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {(() => {
                        try {
                          return format(new Date(change.created_at), "dd.MM.yyyy HH:mm");
                        } catch (e) {
                          return change.created_at;
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </WoWPanel>
  );
};
