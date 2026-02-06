import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface WoWPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export const WoWPanel = ({ children, className, title }: WoWPanelProps) => {
  return (
    <div className={cn("wow-panel p-6 relative", className)}>
      {title && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1 bg-card border-2 border-accent">
          <h3 className="wow-gold-text text-sm tracking-widest">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};
