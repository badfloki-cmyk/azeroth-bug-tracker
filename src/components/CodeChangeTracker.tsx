import { useState } from "react";
import { WoWPanel } from "./WoWPanel";
import { Code, GitBranch, Plus, Clock, FileCode } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import type { BugReport } from "./BugReportModal";

interface CodeChange {
  id: string;
  developer_id: string;
  file_path: string;
  change_description: string;
  change_type: 'create' | 'update' | 'delete' | 'fix' | 'feature';
  related_ticket_id: string | null;
  created_at: string;
}

interface CodeChangeTrackerProps {
  changes: CodeChange[];
  onAddChange: (filePath: string, description: string, type: CodeChange['change_type'], ticketId?: string) => void;
  bugs: BugReport[];
  currentDeveloperId?: string;
}

const changeTypeConfig = {
  create: { label: 'Erstellt', color: 'text-green-400 bg-green-500/10' },
  update: { label: 'Aktualisiert', color: 'text-blue-400 bg-blue-500/10' },
  delete: { label: 'Gelöscht', color: 'text-red-400 bg-red-500/10' },
  fix: { label: 'Fix', color: 'text-orange-400 bg-orange-500/10' },
  feature: { label: 'Feature', color: 'text-purple-400 bg-purple-500/10' },
};

export const CodeChangeTracker = ({ changes, onAddChange, bugs, currentDeveloperId }: CodeChangeTrackerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [filePath, setFilePath] = useState("");
  const [description, setDescription] = useState("");
  const [changeType, setChangeType] = useState<CodeChange['change_type']>('update');
  const [relatedTicket, setRelatedTicket] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath || !description) return;
    
    onAddChange(filePath, description, changeType, relatedTicket || undefined);
    setFilePath("");
    setDescription("");
    setChangeType('update');
    setRelatedTicket("");
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
          Neu
        </button>
      </div>

      {/* Add Change Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-sm bg-background/50 border border-border space-y-4">
          <div>
            <label className="block font-display text-xs text-primary mb-1 tracking-wider">
              Dateipfad
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
              Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was wurde geändert?"
              className="wow-input text-sm py-2 min-h-[60px] resize-y"
              required
            />
          </div>

          <div>
            <label className="block font-display text-xs text-primary mb-2 tracking-wider">
              Typ
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(changeTypeConfig) as CodeChange['change_type'][]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setChangeType(type)}
                  className={`px-3 py-1 rounded-sm text-xs font-bold uppercase transition-all ${
                    changeType === type
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
              Verknüpftes Ticket (optional)
            </label>
            <select
              value={relatedTicket}
              onChange={(e) => setRelatedTicket(e.target.value)}
              className="wow-input text-sm py-2"
            >
              <option value="">Kein Ticket</option>
              {bugs.map((bug) => (
                <option key={bug.id} value={bug.id}>
                  {bug.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="wow-button flex-1 text-sm py-2">
              Abbrechen
            </button>
            <button type="submit" className="wow-button-primary flex-1 text-sm py-2">
              Speichern
            </button>
          </div>
        </form>
      )}

      {/* Changes List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {changes.length === 0 ? (
          <div className="text-center py-8">
            <Code className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">Noch keine Änderungen protokolliert</p>
          </div>
        ) : (
          changes.map((change) => (
            <div 
              key={change.id}
              className="p-3 rounded-sm bg-background/50 border border-border"
            >
              <div className="flex items-start gap-3">
                <FileCode className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${changeTypeConfig[change.change_type].color}`}>
                      {changeTypeConfig[change.change_type].label}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {change.file_path}
                    </span>
                  </div>
                  
                  <p className="text-sm text-foreground line-clamp-2 mb-1">
                    {change.change_description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(change.created_at), { addSuffix: true, locale: de })}
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
