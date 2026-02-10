"use client";

import { useBugs } from "@/hooks/useBugs";
import { WoWPanel } from "@/components/WoWPanel";
import { BugTicketList } from "@/components/BugTicketList";
import { BugStats } from "@/components/BugStats";
import { Shield, Swords, Home, Archive, Trophy, Construction, History } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function RoadmapPage() {
    const { bugs, isLoading } = useBugs();

    const inProgressBugs = useMemo(() =>
        bugs.filter(b => b.status === "in-progress" && !b.isArchived),
        [bugs]);

    const resolvedBugs = useMemo(() =>
        bugs.filter(b => b.status === "resolved").sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        [bugs]);

    const hallOfFame = useMemo(() => {
        const reporters: Record<string, number> = {};
        bugs.forEach(bug => {
            reporters[bug.reporter] = (reporters[bug.reporter] || 0) + 1;
        });
        return Object.entries(reporters)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [bugs]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <WoWPanel className="max-w-xs w-full text-center p-8">
                    <Construction className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                    <h2 className="font-display text-xl wow-gold-text">Loading Roadmap...</h2>
                </WoWPanel>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative bg-background/95">
            {/* Background */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none"
                style={{ backgroundImage: `url(/wow-background.jpg)` }}
            />

            {/* Header */}
            <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Construction className="w-6 h-6 text-primary" />
                        <h1 className="font-display text-lg wow-gold-text">Public Roadmap & Changelog</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/" className="wow-button flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            <span className="hidden sm:inline">Home</span>
                        </Link>
                        <Link href="/dashboard" className="wow-button flex items-center gap-2">
                            <Swords className="w-4 h-4" />
                            <span className="hidden sm:inline">Dashboard</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 relative z-10 space-y-12">
                {/* Stats Summary */}
                <BugStats bugs={bugs} />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Roadmap & Changelog Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <BugTicketList
                            bugs={inProgressBugs}
                            title="Aktuell in Arbeit (Roadmap)"
                            isExpandable={true}
                            pageSize={3}
                        />

                        <BugTicketList
                            bugs={resolvedBugs}
                            title="Letzte Fehlerbehebungen (Changelog)"
                            isExpandable={true}
                            isArchiveView={true}
                            pageSize={10}
                        />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Hall of Fame */}
                        <WoWPanel className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Trophy className="w-6 h-6 text-yellow-500" />
                                <h3 className="font-display text-lg wow-gold-text uppercase tracking-widest text-[#ffd100]">Hall of Fame</h3>
                            </div>
                            <div className="space-y-4">
                                {hallOfFame.length > 0 ? (
                                    hallOfFame.map((reporter, idx) => (
                                        <div key={reporter.name} className="flex items-center justify-between p-3 rounded bg-black/40 border border-border/50 group hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className={`font-display text-lg ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-muted-foreground'}`}>
                                                    #{idx + 1}
                                                </span>
                                                <span className="font-medium text-sm">{reporter.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-primary font-bold">{reporter.count} Bugs</span>
                                                <p className="text-[10px] text-muted-foreground uppercase">Top Reporter</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground py-4 italic">Noch keine Helden gesichtet...</p>
                                )}
                            </div>
                        </WoWPanel>

                        {/* project info */}
                        <WoWPanel className="p-6 bg-primary/5">
                            <h3 className="font-display text-sm text-primary mb-3 uppercase tracking-tighter">Projekt Info</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Hier kannst du den Fortschritt unseres World of Warcraft Classic & TBC Projekts live mitverfolgen.
                                Jeder Report hilft uns dabei, die perfekte Rotation für alle Klassen zu entwickeln.
                            </p>
                            <div className="mt-4 pt-4 border-t border-primary/10 flex items-center justify-between text-[10px] uppercase font-bold text-primary">
                                <span>Astro × Bungee</span>
                                <span>2026</span>
                            </div>
                        </WoWPanel>
                    </div>
                </div>
            </main>
        </div>
    );
}
