"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { BugTicketList } from "@/components/BugTicketList";
import { FeatureRequestList } from "@/components/FeatureRequestList";
import { Archive, Home, LogIn, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useBugs } from "@/hooks/useBugs";

export default function ArchivePage() {
    const { token } = useAuth();
    const { bugs, isLoading: loading, updateStatus, deleteBug } = useBugs();
    const [activeTab, setActiveTab] = useState<'bugs' | 'features'>('bugs');
    const [features, setFeatures] = useState<any[]>([]);
    const [featuresLoading, setFeaturesLoading] = useState(true);

    useEffect(() => {
        const fetchFeatures = async () => {
            try {
                const headers: Record<string, string> = { "Content-Type": "application/json" };
                if (token) headers.Authorization = `Bearer ${token}`;
                const response = await fetch("/api/features", { headers });
                if (response.ok) {
                    const data = await response.json();
                    setFeatures(data);
                }
            } catch (err) {
                console.error("Error fetching features:", err);
            } finally {
                setFeaturesLoading(false);
            }
        };
        fetchFeatures();
    }, [token]);

    const handleStatusChange = async (ticketId: string, newStatus: 'open' | 'in-progress' | 'resolved', resolveReason?: string) => {
        if (!token) {
            toast.error("You must be logged in to change ticket status.");
            return;
        }
        try {
            await updateStatus.mutateAsync({ ticketId, status: newStatus, token, resolveReason });
            toast.success(`Ticket moved to ${newStatus}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to update status");
        }
    };

    const handleDeleteBug = async (ticketId: string, hardDelete: boolean = false) => {
        if (!token) return;
        const confirmMsg = hardDelete
            ? "Do you really want to PERMANENTLY delete this bug from the database? It will be completely removed from statistics."
            : "Are you sure you want to delete this bug report? It will be archived and counted as resolved.";

        if (!window.confirm(confirmMsg)) return;

        try {
            await deleteBug.mutateAsync({ ticketId, token, hardDelete });
            toast.success(hardDelete ? "Bug report permanently removed." : "Bug report archived and resolved.");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete bug report");
        }
    };

    const handleFeatureStatusChange = async (featureId: string, newStatus: 'open' | 'accepted' | 'rejected') => {
        if (!token) {
            toast.error("You must be logged in to change feature status.");
            return;
        }
        try {
            const response = await fetch("/api/features", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id: featureId, status: newStatus }),
            });
            if (!response.ok) throw new Error("Failed to update feature status");
            setFeatures(prev => prev.map(f => f._id === featureId ? { ...f, status: newStatus } : f));
            toast.success(`Feature request ${newStatus}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to update feature status");
        }
    };

    const handleFeatureDelete = async (featureId: string) => {
        if (!token) return;
        try {
            const response = await fetch("/api/features", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id: featureId }),
            });
            if (!response.ok) throw new Error("Failed to delete feature request");
            setFeatures(prev => prev.filter(f => f._id !== featureId));
            toast.success("Feature request deleted.");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete feature request");
        }
    };

    const archivedBugs = bugs.filter(b => b.isArchived);
    const astroBugs = archivedBugs.filter(b => b.developer === 'astro');
    const bungeeBugs = archivedBugs.filter(b => b.developer === 'bungee');

    const closedFeatures = useMemo(() =>
        features.filter(f => f.status === 'accepted' || f.status === 'rejected'),
        [features]
    );
    const astroFeatures = closedFeatures.filter(f => f.developer === 'astro');
    const bungeeFeatures = closedFeatures.filter(f => f.developer === 'bungee');

    const isLoading = activeTab === 'bugs' ? loading : featuresLoading;

    return (
        <div className="min-h-screen relative">
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(/wow-background.jpg)` }}
            />
            <div className="fixed inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/95" />

            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-border bg-card/80 backdrop-blur-sm">
                    <div className="container mx-auto px-4 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <Archive className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                                <div className="text-center md:text-left">
                                    <h1 className="font-display text-2xl md:text-4xl wow-gold-text tracking-wider">
                                        Archived Reports
                                    </h1>
                                    <p className="text-muted-foreground text-xs md:text-sm tracking-widest uppercase mt-1">
                                        Resolved Bugs & Closed Feature Requests
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Link href="/" className="wow-button flex items-center gap-2">
                                    <Home className="w-4 h-4" />
                                    <span className="hidden md:inline">Main Page</span>
                                </Link>
                                <Link href="/auth" className="wow-button flex items-center gap-2">
                                    <LogIn className="w-4 h-4" />
                                    <span className="hidden md:inline">Developer Login</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8">
                    {/* Tab Switcher */}
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setActiveTab('bugs')}
                            className={`font-display px-6 py-2 rounded-sm border-2 transition-all ${activeTab === 'bugs' ? 'border-primary bg-primary/10 wow-gold-text' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                        >
                            Bug Reports
                        </button>
                        <button
                            onClick={() => setActiveTab('features')}
                            className={`font-display px-6 py-2 rounded-sm border-2 transition-all ${activeTab === 'features' ? 'border-primary bg-primary/10 wow-gold-text' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                        >
                            Feature Requests
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="wow-gold-text font-display text-xl animate-pulse">
                                {activeTab === 'bugs' ? 'Loading Archived Reports...' : 'Loading Feature Requests...'}
                            </div>
                        </div>
                    ) : activeTab === 'bugs' ? (
                        archivedBugs.length === 0 ? (
                            <div className="text-center py-12">
                                <Archive className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <h3 className="font-display text-lg text-muted-foreground">No Archived Reports</h3>
                                <p className="text-sm text-muted-foreground/60 mt-2">
                                    Resolved tickets will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid lg:grid-cols-2 gap-8">
                                <BugTicketList
                                    bugs={astroBugs}
                                    title="Astro's Archived Reports"
                                    isExpandable={true}
                                    showActions={!!token}
                                    onStatusChange={token ? handleStatusChange : undefined}
                                    onDelete={token ? handleDeleteBug : undefined}
                                    isArchiveView={true}
                                />
                                <BugTicketList
                                    bugs={bungeeBugs}
                                    title="Bungee's Archived Reports"
                                    isExpandable={true}
                                    showActions={!!token}
                                    onStatusChange={token ? handleStatusChange : undefined}
                                    onDelete={token ? handleDeleteBug : undefined}
                                    isArchiveView={true}
                                />
                            </div>
                        )
                    ) : (
                        closedFeatures.length === 0 ? (
                            <div className="text-center py-12">
                                <Lightbulb className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <h3 className="font-display text-lg text-muted-foreground">No Closed Feature Requests</h3>
                                <p className="text-sm text-muted-foreground/60 mt-2">
                                    Accepted and rejected feature requests will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid lg:grid-cols-2 gap-8">
                                <FeatureRequestList
                                    features={astroFeatures}
                                    title="Astro's Feature Requests"
                                    showActions={!!token}
                                    onStatusChange={token ? handleFeatureStatusChange : undefined}
                                    onDelete={token ? handleFeatureDelete : undefined}
                                />
                                <FeatureRequestList
                                    features={bungeeFeatures}
                                    title="Bungee's Feature Requests"
                                    showActions={!!token}
                                    onStatusChange={token ? handleFeatureStatusChange : undefined}
                                    onDelete={token ? handleFeatureDelete : undefined}
                                />
                            </div>
                        )
                    )}
                </main>

                {/* Footer */}
                <footer className="border-t border-border bg-card/60 backdrop-blur-sm mt-12">
                    <div className="container mx-auto px-4 py-6 text-center">
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            &copy; 2026 Bungee &times; Astro &bull; World of Warcraft Class Optimization Project
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
