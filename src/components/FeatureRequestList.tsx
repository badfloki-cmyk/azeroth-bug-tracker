import { ClassIcon } from "./ClassIcon";
import { WoWPanel } from "./WoWPanel";
import { WoWClass } from "./FeatureRequestModal";
import {
    Lightbulb, Clock, User, CheckCircle, XCircle, Trash2, Lock,
    ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
    Target, Layers
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { useState, useMemo } from "react";
import { usePagination } from "@/hooks/usePagination";

interface FeatureRequest {
    _id: string;
    developer: 'astro' | 'bungee';
    category: 'class' | 'esp' | 'other';
    wow_class?: WoWClass;
    title: string;
    description: string;
    status: 'open' | 'accepted' | 'rejected';
    discord_username: string;
    sylvanas_username: string;
    is_private?: boolean;
    createdAt: string;
}

interface FeatureRequestListProps {
    features: FeatureRequest[];
    title?: string;
    onStatusChange?: (featureId: string, newStatus: 'open' | 'accepted' | 'rejected') => void;
    onDelete?: (featureId: string) => void;
    showActions?: boolean;
}

const statusColors = {
    'open': 'text-blue-400 bg-blue-500/10',
    'accepted': 'text-green-400 bg-green-500/10 border-green-500/30',
    'rejected': 'text-red-400 bg-red-500/10 border-red-500/30',
};

export const FeatureRequestList = ({ features, title = "Feature Requests", onStatusChange, onDelete, showActions }: FeatureRequestListProps) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

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
        items: features,
        itemsPerPage: 5,
        sortFn: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    });

    return (
        <WoWPanel>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="font-display text-lg sm:text-xl wow-gold-text flex items-center gap-2 sm:gap-3">
                    <Lightbulb className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{title}</span>
                    <span className="text-sm text-muted-foreground flex-shrink-0">({totalItems})</span>
                </h2>
            </div>

            <div className="space-y-3">
                {currentItems.map((feature) => {
                    const isExpanded = expandedId === feature._id;

                    return (
                        <div
                            key={feature._id}
                            className="rounded-sm bg-background/50 border border-border hover:border-primary/30 transition-all overflow-hidden"
                        >
                            <div
                                className="p-3 sm:p-4 flex items-start gap-2 sm:gap-4 cursor-pointer hover:bg-white/5"
                                onClick={() => setExpandedId(isExpanded ? null : feature._id)}
                            >
                                {feature.wow_class ? (
                                    <ClassIcon wowClass={feature.wow_class} size="md" />
                                ) : (
                                    <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <Lightbulb className="w-5 h-5 text-primary" />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                                        <h4 className="font-display text-base text-foreground truncate">{feature.title}</h4>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${statusColors[feature.status]}`}>
                                            {feature.status}
                                        </span>
                                        {feature.is_private && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 flex items-center gap-1">
                                                <Lock className="w-2.5 h-2.5" /> Private
                                            </span>
                                        )}
                                    </div>

                                    <p className={`text-sm text-muted-foreground mb-2 ${isExpanded ? '' : 'line-clamp-1'}`}>
                                        {feature.description}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground/70 flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {feature.sylvanas_username || feature.discord_username}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(feature.createdAt), { addSuffix: true, locale: enUS })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Layers className="w-3 h-3" />
                                            {feature.category.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                    {showActions && onDelete && !isExpanded && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm("Are you sure you want to delete this feature request?")) {
                                                    onDelete(feature._id);
                                                }
                                            }}
                                            className="p-1 hover:bg-red-500/10 rounded-full transition-colors text-muted-foreground hover:text-red-400"
                                            title="Delete Request"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-3 pb-4 pt-2 sm:px-5 sm:pb-6 sm:pt-3 border-t border-border bg-black/40 space-y-4">
                                    <div className="space-y-2">
                                        <h5 className="text-[10px] font-bold uppercase text-primary tracking-widest">Description</h5>
                                        <p className="text-sm text-muted-foreground bg-background/40 p-3 rounded-sm border border-border/50 whitespace-pre-wrap">
                                            {feature.description}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="text-xs">
                                            <span className="text-muted-foreground/60 font-bold uppercase block mb-1 text-[10px]">Contact</span>
                                            <span className="text-foreground font-medium flex items-center gap-2 bg-black/20 p-2 rounded-sm border border-border/30 break-all">
                                                @{feature.discord_username} (Sylvanas: {feature.sylvanas_username})
                                            </span>
                                        </div>
                                        {feature.wow_class && (
                                            <div className="text-xs">
                                                <span className="text-muted-foreground/60 font-bold uppercase block mb-1 text-[10px]">Class</span>
                                                <span className="text-foreground font-medium flex items-center gap-2 bg-black/20 p-2 rounded-sm border border-border/30">
                                                    <Target className="w-3.5 h-3.5 text-primary" /> {feature.wow_class.toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {showActions && (
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-border/50">
                                            <div className="flex gap-2">
                                                {onDelete && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm("Are you sure you want to delete this feature request?")) {
                                                                onDelete(feature._id);
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 rounded-sm border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase transition-all flex items-center gap-1.5"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </button>
                                                )}
                                            </div>

                                            {onStatusChange && (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground hidden sm:inline">Status:</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onStatusChange(feature._id, 'accepted'); }}
                                                        className={`px-3 py-1.5 rounded-sm border text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${feature.status === 'accepted' ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-border text-muted-foreground hover:border-green-500/50 hover:text-green-400'}`}
                                                        disabled={feature.status === 'accepted'}
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" /> Accept
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onStatusChange(feature._id, 'rejected'); }}
                                                        className={`px-3 py-1.5 rounded-sm border text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${feature.status === 'rejected' ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-border text-muted-foreground hover:border-red-500/50 hover:text-red-400'}`}
                                                        disabled={feature.status === 'rejected'}
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Reject
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

            {totalPages > 1 && (
                <div className="mt-4 pt-4 border-t border-border/50 flex justify-center gap-2">
                    <button onClick={goToPrevPage} disabled={!hasPrevPage} className="wow-button py-1 px-3 text-xs disabled:opacity-50">Prev</button>
                    <span className="flex items-center text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
                    <button onClick={goToNextPage} disabled={!hasNextPage} className="wow-button py-1 px-3 text-xs disabled:opacity-50">Next</button>
                </div>
            )}
        </WoWPanel>
    );
};
