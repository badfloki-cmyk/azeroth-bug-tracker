import { BugReport } from "./BugReportModal";
import { ClassIcon } from "./ClassIcon";
import { WoWPanel } from "./WoWPanel";
import { Bug, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BugTicketListProps {
  bugs: BugReport[];
  title?: string;
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

export const BugTicketList = ({ bugs, title = "Bug Reports" }: BugTicketListProps) => {
  if (bugs.length === 0) {
    return (
      <WoWPanel className="text-center py-12">
        <Bug className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="font-display text-lg text-muted-foreground">No Bug Reports</h3>
        <p className="text-sm text-muted-foreground/60 mt-2">
          All systems operational! Report a bug if you find one.
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
        {bugs.map((bug) => (
          <div 
            key={bug.id}
            className="p-4 rounded-sm bg-background/50 border border-border hover:border-primary/30 transition-all"
          >
            <div className="flex items-start gap-4">
              <ClassIcon wowClass={bug.wowClass} size="md" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-display text-foreground truncate">{bug.title}</h4>
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${priorityColors[bug.priority]}`}>
                    {bug.priority}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${statusColors[bug.status]}`}>
                    {bug.status}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {bug.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {bug.reporter}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(bug.createdAt, { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </WoWPanel>
  );
};
