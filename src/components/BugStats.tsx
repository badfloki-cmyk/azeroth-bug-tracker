import { useMemo } from "react";
import { WoWPanel } from "./WoWPanel";
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import type { BugReport } from "./BugReportModal";

interface BugStatsProps {
    bugs: BugReport[];
}

// WoW-themed colors
const STATUS_COLORS = {
    open: "#ef4444",      // Red - needs attention
    "in-progress": "#f59e0b", // Amber - being worked on
    resolved: "#22c55e",   // Green - completed
};

const DEVELOPER_COLORS = {
    astro: "#3b82f6",   // Blue
    bungee: "#a855f7",  // Purple
};

const CLASS_COLORS: Record<string, string> = {
    warrior: "#c79c6e",
    paladin: "#f58cba",
    hunter: "#abd473",
    rogue: "#fff569",
    priest: "#ffffff",
    shaman: "#0070de",
    mage: "#69ccf0",
    warlock: "#9482c9",
    druid: "#ff7d0a",
    "death-knight": "#c41f3b",
};

export const BugStats = ({ bugs }: BugStatsProps) => {
    // Safety check - if bugs is undefined/null, use empty array
    const safeBugs = bugs || [];

    // Calculate status distribution
    const statusData = useMemo(() => {
        const counts = safeBugs.reduce(
            (acc, bug) => {
                acc[bug.status] = (acc[bug.status] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        return [
            { name: "Open", value: counts.open || 0, color: STATUS_COLORS.open },
            { name: "In Progress", value: counts["in-progress"] || 0, color: STATUS_COLORS["in-progress"] },
            { name: "Resolved", value: counts.resolved || 0, color: STATUS_COLORS.resolved },
        ];
    }, [safeBugs]);

    // Calculate developer distribution
    const developerData = useMemo(() => {
        const counts = safeBugs.reduce(
            (acc, bug) => {
                const dev = bug.developer?.toLowerCase() || "unknown";
                acc[dev] = (acc[dev] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        return [
            { name: "Astro", bugs: counts.astro || 0, fill: DEVELOPER_COLORS.astro },
            { name: "Bungee", bugs: counts.bungee || 0, fill: DEVELOPER_COLORS.bungee },
        ];
    }, [safeBugs]);

    // Calculate class distribution
    const classData = useMemo(() => {
        const counts = safeBugs.reduce(
            (acc, bug) => {
                const wowClass = bug.wowClass?.toLowerCase() || "unknown";
                acc[wowClass] = (acc[wowClass] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        return Object.entries(counts)
            .map(([name, bugs]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1).replace("-", " "),
                bugs,
                fill: CLASS_COLORS[name] || "#6b7280",
            }))
            .sort((a, b) => b.bugs - a.bugs);
    }, [safeBugs]);

    const totalBugs = safeBugs.length;
    const openBugs = statusData.find((s) => s.name === "Open")?.value || 0;
    const resolvedBugs = statusData.find((s) => s.name === "Resolved")?.value || 0;
    const resolutionRate = totalBugs > 0 ? Math.round((resolvedBugs / totalBugs) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <WoWPanel className="text-center p-3 sm:p-4">
                    <p className="text-2xl sm:text-3xl font-display wow-gold-text">{totalBugs}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Total Bugs</p>
                </WoWPanel>
                <WoWPanel className="text-center p-3 sm:p-4">
                    <p className="text-2xl sm:text-3xl font-display text-red-400">{openBugs}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Open</p>
                </WoWPanel>
                <WoWPanel className="text-center p-3 sm:p-4">
                    <p className="text-2xl sm:text-3xl font-display text-green-400">{resolvedBugs}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Resolved</p>
                </WoWPanel>
                <WoWPanel className="text-center p-3 sm:p-4">
                    <p className="text-2xl sm:text-3xl font-display text-primary">{resolutionRate}%</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Resolution Rate</p>
                </WoWPanel>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Status Pie Chart */}
                <WoWPanel className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChartIcon className="w-5 h-5 text-primary" />
                        <h3 className="font-display text-sm wow-gold-text">Bug Status</h3>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "rgba(0,0,0,0.9)",
                                        border: "1px solid #ffd100",
                                        borderRadius: "4px",
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </WoWPanel>

                {/* Developer Distribution */}
                <WoWPanel className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <h3 className="font-display text-sm wow-gold-text">By Developer</h3>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={developerData} layout="vertical">
                                <XAxis type="number" allowDecimals={false} stroke="#666" />
                                <YAxis type="category" dataKey="name" stroke="#666" width={60} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "rgba(0,0,0,0.9)",
                                        border: "1px solid #ffd100",
                                        borderRadius: "4px",
                                    }}
                                />
                                <Bar dataKey="bugs" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </WoWPanel>

                {/* Class Distribution */}
                <WoWPanel className="p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h3 className="font-display text-sm wow-gold-text">By Class</h3>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={classData.slice(0, 6)}>
                                <XAxis
                                    dataKey="name"
                                    stroke="#666"
                                    tick={{ fontSize: 10 }}
                                    interval={0}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis stroke="#666" allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "rgba(0,0,0,0.9)",
                                        border: "1px solid #ffd100",
                                        borderRadius: "4px",
                                    }}
                                />
                                <Bar dataKey="bugs" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </WoWPanel>
            </div>
        </div>
    );
};
