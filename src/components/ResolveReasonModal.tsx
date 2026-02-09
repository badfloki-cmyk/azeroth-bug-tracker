"use client";

import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { WoWPanel } from "./WoWPanel";

const RESOLVE_REASONS = [
  { value: 'no_response', label: "User didn't respond to questions" },
  { value: 'not_reproducible', label: "Couldn't replicate" },
  { value: 'user_side', label: "User side problem" },
  { value: 'fixed', label: "Fixed / Implemented" },
] as const;

interface ResolveReasonModalProps {
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

export const ResolveReasonModal = ({ onConfirm, onCancel }: ResolveReasonModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <WoWPanel className="relative z-10 w-full max-w-sm p-5">
        <button onClick={onCancel} className="absolute top-3 right-3 text-muted-foreground hover:text-primary transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <h3 className="font-display text-lg wow-gold-text">Resolve Ticket</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Optionally select a reason for resolving this ticket:
        </p>

        <div className="space-y-2 mb-5">
          {RESOLVE_REASONS.map((reason) => (
            <button
              key={reason.value}
              onClick={() => setSelectedReason(
                selectedReason === reason.value ? null : reason.value
              )}
              className={`w-full text-left px-3 py-2 rounded-sm border text-sm transition-all ${
                selectedReason === reason.value
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              {reason.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="wow-button flex-1 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedReason || undefined)}
            className="wow-button-primary flex-1 py-2 text-sm"
          >
            {selectedReason ? 'Resolve' : 'Resolve without Reason'}
          </button>
        </div>
      </WoWPanel>
    </div>
  );
};
