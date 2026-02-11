"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DeveloperCard } from "@/components/DeveloperCard";
import { BugReportModal, BugReport } from "@/components/BugReportModal";
import { FeatureRequestModal, FeatureRequest } from "@/components/FeatureRequestModal";
import { BugTicketList } from "@/components/BugTicketList";
import { FeatureRequestList } from "@/components/FeatureRequestList";
import { Shield, Swords, LogIn, ExternalLink, Archive, Construction, BookOpen, X, CheckCircle, Copy, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { useBugs } from "@/hooks/useBugs";

export default function IndexPage() {
    const [showBugModal, setShowBugModal] = useState<'astro' | 'bungee' | null>(null);
    const [showFeatureModal, setShowFeatureModal] = useState<'astro' | 'bungee' | null>(null);
    const [features, setFeatures] = useState<any[]>([]);
    const [featuresLoading, setFeaturesLoading] = useState(true);
    const { bugs, isLoading: loading, createBug, deleteBug } = useBugs();

    useEffect(() => {
        const fetchFeatures = async () => {
            try {
                const response = await fetch('/api/features');
                if (response.ok) {
                    const data = await response.json();
                    setFeatures(data);
                }
            } catch (err) {
                console.error("Failed to fetch features:", err);
            } finally {
                setFeaturesLoading(false);
            }
        };
        fetchFeatures();
    }, []);

    const handleBugSubmit = async (bug: BugReport) => {
        try {
            await createBug.mutateAsync({
                bug: {
                    ...bug,
                    developer: bug.developer,
                    wow_class: bug.wowClass,
                    pvpve_mode: bug.pvpveMode,
                    current_behavior: bug.currentBehavior,
                    expected_behavior: bug.expectedBehavior,
                    discord_username: bug.discordUsername,
                    sylvanas_username: bug.sylvanasUsername,
                    reporter_name: bug.reporter,
                    video_url: bug.videoUrl,
                    screenshot_urls: bug.screenshotUrls,
                } as any,
                token: "",
            });
            toast.success("Bug report created successfully!");
        } catch (error: any) {
            toast.error(error.message || "Error creating bug report.");
            console.error(error);
        }
    };

    const handleFeatureSubmit = async (feature: FeatureRequest) => {
        try {
            const response = await fetch('/api/features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    developer: feature.developer,
                    category: feature.category,
                    wow_class: feature.wowClass,
                    title: feature.title,
                    description: feature.description,
                    discord_username: feature.discordUsername,
                    sylvanas_username: feature.sylvanasUsername,
                    is_private: feature.isPrivate,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit feature request');
            }
            toast.success("Feature request submitted successfully!");
            // Refresh features list
            const updated = await fetch('/api/features').then(res => res.json());
            setFeatures(updated);

            return data.feature?._id;
        } catch (error: any) {
            toast.error(error.message || "Error submitting feature request.");
            console.error(error);
        }
    };

    const handleBugDelete = async (ticketId: string) => {
        try {
            const token = localStorage.getItem('auth_token') || "";
            if (!token) {
                toast.error("You must be logged in to delete reports.");
                return;
            }
            await deleteBug.mutateAsync({ ticketId, token });
            toast.success("Bug report archived successfully!");
        } catch (error: any) {
            toast.error(error.message || "Error deleting bug report.");
            console.error(error);
        }
    };

    const visibleBugs = bugs.filter(b => !b.isArchived);
    const astroBugs = visibleBugs.filter(b => b.developer === 'astro');
    const bungeeBugs = visibleBugs.filter(b => b.developer === 'bungee');

    return (
        <div className="min-h-screen relative">
            {/* Background */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(/wow-background.jpg)` }}
            />
            <div className="fixed inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/95" />

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-border bg-card/80 backdrop-blur-sm">
                    <div className="container mx-auto px-4 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                                <div className="text-center md:text-left">
                                    <h1 className="font-display text-2xl md:text-4xl wow-gold-text tracking-wider">
                                        Bungee × Astro
                                    </h1>
                                    <p className="text-muted-foreground text-xs md:text-sm tracking-widest uppercase mt-1">
                                        Bug Reporter & Class Tracker
                                    </p>
                                </div>
                                <Swords className="w-10 h-10 text-primary hidden md:block" />
                            </div>

                            <div className="flex items-center gap-3">
                                <Link
                                    href="/guides"
                                    className="wow-button flex items-center gap-2"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    <span className="hidden md:inline">Guides</span>
                                </Link>
                                <Link
                                    href="/roadmap"
                                    className="wow-button flex items-center gap-2"
                                >
                                    <Construction className="w-4 h-4" />
                                    <span className="hidden md:inline">Public Roadmap</span>
                                </Link>
                                <Link
                                    href="/archive"
                                    className="wow-button flex items-center gap-2"
                                >
                                    <Archive className="w-4 h-4" />
                                    <span className="hidden md:inline">Archive</span>
                                </Link>
                                <Link
                                    href="/auth"
                                    className="wow-button flex items-center gap-2"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span className="hidden md:inline">Developer Login</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8">
                    {/* Donation Section - Prominent at Top */}
                    <div className="mb-8 text-center">
                        <a
                            href="https://revolut.me/mauromp4"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all group text-center"
                        >
                            <span className="font-display tracking-wide text-xs sm:text-sm md:text-base">If you want to support Bungee x Astro, tips are appreciated</span>
                            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                    </div>

                    {/* Developer Cards */}
                    <div className="grid lg:grid-cols-2 gap-8 mb-12 items-start">
                        <DeveloperCard
                            developer="astro"
                            onReportBug={() => setShowBugModal('astro')}
                            onRequestFeature={() => setShowFeatureModal('astro')}
                        />
                        <DeveloperCard
                            developer="bungee"
                            onReportBug={() => setShowBugModal('bungee')}
                            onRequestFeature={() => setShowFeatureModal('bungee')}
                        />
                    </div>

                    {/* Bug Reports Section */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="wow-gold-text font-display text-xl animate-pulse">
                                Loading Bug Reports...
                            </div>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-2 gap-8 items-start">
                            <BugTicketList
                                bugs={astroBugs}
                                title="Astro's Bug Reports"
                                isExpandable={false}
                                onDelete={handleBugDelete}
                            />
                            <BugTicketList
                                bugs={bungeeBugs}
                                title="Bungee's Bug Reports"
                                isExpandable={false}
                                onDelete={handleBugDelete}
                            />
                        </div>
                    )}

                    {/* Feature Requests Section */}
                    <div className="mt-16">
                        {featuresLoading ? (
                            <div className="text-center py-12">
                                <div className="wow-gold-text font-display text-xl animate-pulse">
                                    Loading Feature Requests...
                                </div>
                            </div>
                        ) : (
                            <FeatureRequestList
                                features={features}
                                title="Recent Feature Requests"
                                showActions={false}
                            />
                        )}
                    </div>

                </main>

                {/* Footer */}
                <footer className="border-t border-border bg-card/60 backdrop-blur-sm mt-12">
                    <div className="container mx-auto px-4 py-6 text-center">
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            © 2026 Bungee × Astro • World of Warcraft Class Optimization Project
                        </p>
                    </div>
                </footer>
            </div>

            {/* Bug Report Modal */}
            {showBugModal && (
                <BugReportModal
                    developer={showBugModal}
                    onClose={() => setShowBugModal(null)}
                    onSubmit={handleBugSubmit}
                />
            )}
            {/* Feature Request Modal */}
            {showFeatureModal && (
                <FeatureRequestModal
                    developer={showFeatureModal}
                    onClose={() => setShowFeatureModal(null)}
                    onSubmit={handleFeatureSubmit}
                />
            )}
        </div>
    );
}
