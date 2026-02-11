"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { WoWPanel } from "@/components/WoWPanel";
import { ClassIcon } from "@/components/ClassIcon";
import {
    Lightbulb, Clock, User, CheckCircle, XCircle,
    ChevronLeft, Target, Layers, Lock, ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

const statusColors = {
    'open': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    'accepted': 'text-green-400 bg-green-500/10 border-green-500/30',
    'rejected': 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function FeatureDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [feature, setFeature] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFeature = async () => {
            try {
                const response = await fetch(`/api/features/${id}`);
                if (!response.ok) {
                    throw new Error("Feature not found or failed to load");
                }
                const data = await response.json();
                setFeature(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchFeature();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="wow-gold-text font-display text-xl animate-pulse">Loading Feature Status...</div>
            </div>
        );
    }

    if (error || !feature) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <WoWPanel className="max-w-md w-full p-8 text-center">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="font-display text-2xl wow-gold-text mb-4">Not Found</h1>
                    <p className="text-muted-foreground mb-6">The feature request you are looking for does not exist or has been removed.</p>
                    <Link href="/" className="wow-button-primary block w-full">Return Home</Link>
                </WoWPanel>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0b] bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 group w-fit">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-display text-sm tracking-widest uppercase">Back to Dashboard</span>
                </Link>

                <WoWPanel className="p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
                        {feature.wow_class ? (
                            <ClassIcon wowClass={feature.wow_class} size="lg" />
                        ) : (
                            <div className="w-16 h-16 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Lightbulb className="w-8 h-8 text-primary" />
                            </div>
                        )}

                        <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="font-display text-3xl wow-gold-text tracking-tight">{feature.title}</h1>
                                <span className={`px-3 py-1 text-xs font-bold uppercase rounded border ${statusColors[feature.status as keyof typeof statusColors]}`}>
                                    {feature.status}
                                </span>
                                {feature.is_private && (
                                    <span className="px-3 py-1 text-xs font-bold uppercase rounded border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 flex items-center gap-1.5">
                                        <Lock className="w-3 h-3" /> Private
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                                <span className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-sm border border-border/50">
                                    <User className="w-4 h-4 text-primary" />
                                    <span className="font-medium text-foreground">{feature.sylvanas_username}</span>
                                </span>
                                <span className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-sm border border-border/50">
                                    <Clock className="w-4 h-4 text-primary" />
                                    {formatDistanceToNow(new Date(feature.createdAt), { addSuffix: true, locale: enUS })}
                                </span>
                                <span className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-sm border border-border/50">
                                    <Layers className="w-4 h-4 text-primary" />
                                    {feature.category.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h3 className="font-display text-sm text-primary tracking-widest uppercase">Feature Description</h3>
                            <div className="bg-black/40 p-6 rounded-sm border border-border/50 text-foreground leading-relaxed whitespace-pre-wrap">
                                {feature.description}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-primary/5 p-4 rounded-sm border border-primary/10">
                                <span className="block text-[10px] uppercase font-bold text-primary mb-2 tracking-widest">Developer Assigned</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-display text-primary text-xs border border-primary/30">
                                        {feature.developer.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-display text-sm uppercase tracking-wider">{feature.developer}</span>
                                </div>
                            </div>

                            {feature.wow_class && (
                                <div className="bg-primary/5 p-4 rounded-sm border border-primary/10">
                                    <span className="block text-[10px] uppercase font-bold text-primary mb-2 tracking-widest">Wow Class</span>
                                    <div className="flex items-center gap-3">
                                        <Target className="w-4 h-4 text-primary" />
                                        <span className="font-display text-sm uppercase tracking-wider">{feature.wow_class}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </WoWPanel>

                <div className="text-center pt-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-bold">
                        Bungee × Astro Feature Tracker • Private Status View
                    </p>
                </div>
            </div>
        </div>
    );
}
