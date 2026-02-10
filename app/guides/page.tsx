"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { guidesData, ClassGuide, GuideTab, GuideOption } from "@/data/guidesData";
import { GuideAIChat } from "@/components/GuideAIChat";
import { Search, BookOpen, Home, LayoutDashboard, Map, ChevronDown, ChevronRight, X } from "lucide-react";

// Type badge colors
const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Keybind: { bg: "rgba(255, 180, 0, 0.15)", text: "#ffb400", border: "rgba(255, 180, 0, 0.4)" },
    Checkbox: { bg: "rgba(0, 200, 120, 0.15)", text: "#00c878", border: "rgba(0, 200, 120, 0.4)" },
    Slider: { bg: "rgba(100, 160, 255, 0.15)", text: "#64a0ff", border: "rgba(100, 160, 255, 0.4)" },
    Dropdown: { bg: "rgba(180, 100, 255, 0.15)", text: "#b464ff", border: "rgba(180, 100, 255, 0.4)" },
    Button: { bg: "rgba(255, 80, 80, 0.15)", text: "#ff5050", border: "rgba(255, 80, 80, 0.4)" },
    Text: { bg: "rgba(200, 200, 200, 0.15)", text: "#c8c8c8", border: "rgba(200, 200, 200, 0.4)" },
};

function TypeBadge({ type }: { type: string }) {
    const c = TYPE_COLORS[type] || TYPE_COLORS.Text;
    return (
        <span
            style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
            className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider whitespace-nowrap"
        >
            {type}
        </span>
    );
}

function OptionRow({ option, highlight }: { option: GuideOption; highlight: string }) {
    const highlightText = (text: string) => {
        if (!highlight) return text;
        const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark style={{ background: "rgba(255, 180, 0, 0.35)", color: "inherit", borderRadius: "2px", padding: "0 2px" }}>
                    {text.slice(idx, idx + highlight.length)}
                </mark>
                {text.slice(idx + highlight.length)}
            </>
        );
    };

    return (
        <tr className="guide-row">
            <td className="guide-cell guide-cell-name">{highlightText(option.name)}</td>
            <td className="guide-cell guide-cell-type"><TypeBadge type={option.type} /></td>
            <td className="guide-cell guide-cell-default">{option.default || "—"}</td>
            <td className="guide-cell guide-cell-desc">{highlightText(option.description)}</td>
        </tr>
    );
}

export default function GuidesPage() {
    const [selectedClassIdx, setSelectedClassIdx] = useState(0);
    const [selectedTabIdx, setSelectedTabIdx] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const selectedClass = guidesData[selectedClassIdx];

    // Filter logic: when searching, show ALL matching options across ALL tabs
    const filteredTabs = useMemo(() => {
        if (!searchTerm.trim()) return selectedClass.tabs;
        const q = searchTerm.toLowerCase();
        return selectedClass.tabs
            .map((tab) => ({
                ...tab,
                options: tab.options.filter(
                    (o) =>
                        o.name.toLowerCase().includes(q) ||
                        o.description.toLowerCase().includes(q) ||
                        o.type.toLowerCase().includes(q) ||
                        (o.default && o.default.toLowerCase().includes(q))
                ),
            }))
            .filter((tab) => tab.options.length > 0);
    }, [selectedClass, searchTerm]);

    // Cross-class search results
    const crossClassResults = useMemo(() => {
        if (!searchTerm.trim()) return null;
        const q = searchTerm.toLowerCase();
        const results: { classGuide: ClassGuide; tab: GuideTab; options: GuideOption[] }[] = [];
        guidesData.forEach((cg, ci) => {
            if (ci === selectedClassIdx) return; // skip current
            cg.tabs.forEach((tab) => {
                const matched = tab.options.filter(
                    (o) =>
                        o.name.toLowerCase().includes(q) ||
                        o.description.toLowerCase().includes(q)
                );
                if (matched.length > 0) {
                    results.push({ classGuide: cg, tab, options: matched });
                }
            });
        });
        return results.length > 0 ? results : null;
    }, [searchTerm, selectedClassIdx]);

    const totalMatches = useMemo(() => {
        if (!searchTerm.trim()) return 0;
        return filteredTabs.reduce((sum, t) => sum + t.options.length, 0) +
            (crossClassResults?.reduce((sum, r) => sum + r.options.length, 0) || 0);
    }, [filteredTabs, crossClassResults, searchTerm]);

    const handleClassSelect = (idx: number) => {
        setSelectedClassIdx(idx);
        setSelectedTabIdx(0);
        setSidebarOpen(false);
    };

    const getClassColor = (cg: ClassGuide) => {
        const cssVar = cg.colorVar;
        const map: Record<string, string> = {
            "--class-warrior": "#c69b6d",
            "--class-rogue": "#fff468",
            "--class-hunter": "#aad372",
            "--class-warlock": "#9382c9",
            "--class-paladin": "#f48cba",
            "--class-priest": "#ffffff",
            "--class-mage": "#3fc7eb",
            "--class-shaman": "#0070dd",
            "--class-druid": "#ff7c0a",
        };
        return map[cssVar] || "#daa520";
    };

    return (
        <div className="min-h-screen" style={{ background: "hsl(25 15% 8%)" }}>
            {/* Header */}
            <header className="guide-header">
                <div className="guide-header-inner">
                    <div className="guide-header-left">
                        <BookOpen className="guide-header-icon" />
                        <div>
                            <h1 className="guide-header-title wow-gold-text">F1 Menu Guide</h1>
                            <p className="guide-header-sub">Every setting explained — All 9 Classes</p>
                        </div>
                    </div>
                    <nav className="guide-header-nav">
                        <Link href="/" className="guide-nav-link"><Home size={16} /> Home</Link>
                        <Link href="/dashboard" className="guide-nav-link"><LayoutDashboard size={16} /> Dashboard</Link>
                        <Link href="/roadmap" className="guide-nav-link"><Map size={16} /> Roadmap</Link>
                    </nav>
                    {/* Mobile hamburger */}
                    <button className="guide-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <X size={22} /> : <ChevronDown size={22} />}
                        <span>{selectedClass.icon} {selectedClass.className}</span>
                    </button>
                </div>
            </header>

            <div className="guide-layout">
                {/* Sidebar */}
                <aside className={`guide-sidebar ${sidebarOpen ? "guide-sidebar--open" : ""}`}>
                    {/* Search */}
                    <div className="guide-search-wrap">
                        <Search size={16} className="guide-search-icon" />
                        <input
                            type="text"
                            placeholder="Search any setting..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="guide-search-input"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="guide-search-clear">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    {searchTerm && (
                        <div className="guide-search-count">
                            {totalMatches} result{totalMatches !== 1 ? "s" : ""} found
                        </div>
                    )}

                    {/* Classes */}
                    <div className="guide-sidebar-section">
                        <h3 className="guide-sidebar-title">CLASSES</h3>
                        <div className="guide-class-list">
                            {guidesData.map((cg, i) => (
                                <button
                                    key={cg.className}
                                    onClick={() => handleClassSelect(i)}
                                    className={`guide-class-btn ${i === selectedClassIdx ? "guide-class-btn--active" : ""}`}
                                    style={{
                                        borderColor: i === selectedClassIdx ? getClassColor(cg) : "transparent",
                                        ...(i === selectedClassIdx ? { background: `${getClassColor(cg)}15` } : {}),
                                    }}
                                >
                                    <span className="guide-class-icon">{cg.icon}</span>
                                    <span style={{ color: i === selectedClassIdx ? getClassColor(cg) : undefined }}>{cg.className}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tabs for selected class */}
                    {!searchTerm && (
                        <div className="guide-sidebar-section">
                            <h3 className="guide-sidebar-title">TABS</h3>
                            <div className="guide-tab-list">
                                {selectedClass.tabs.map((tab, i) => (
                                    <button
                                        key={tab.name}
                                        onClick={() => { setSelectedTabIdx(i); setSidebarOpen(false); }}
                                        className={`guide-tab-btn ${i === selectedTabIdx ? "guide-tab-btn--active" : ""}`}
                                    >
                                        {i === selectedTabIdx ? <ChevronRight size={14} /> : <span style={{ width: 14 }} />}
                                        <span>{tab.name}</span>
                                        <span className="guide-tab-count">{tab.options.length}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Content */}
                <main className="guide-main">
                    {/* Class title bar */}
                    <div className="guide-class-header" style={{ borderColor: getClassColor(selectedClass) }}>
                        <span className="guide-class-header-icon">{selectedClass.icon}</span>
                        <h2 className="guide-class-header-name" style={{ color: getClassColor(selectedClass) }}>
                            {selectedClass.className}
                        </h2>
                        {!searchTerm && (
                            <span className="guide-class-header-tab">
                                / {selectedClass.tabs[selectedTabIdx]?.name}
                            </span>
                        )}
                        {searchTerm && (
                            <span className="guide-class-header-tab">
                                / Search: &quot;{searchTerm}&quot;
                            </span>
                        )}
                    </div>

                    {/* Render tables */}
                    {searchTerm ? (
                        // Search mode: show all matching tabs
                        <>
                            {filteredTabs.length === 0 && !crossClassResults && (
                                <div className="guide-empty">
                                    <Search size={40} style={{ opacity: 0.3 }} />
                                    <p>No settings found for &quot;{searchTerm}&quot;</p>
                                </div>
                            )}
                            {filteredTabs.map((tab) => (
                                <div key={tab.name} className="guide-table-section">
                                    <h3 className="guide-table-title" style={{ color: getClassColor(selectedClass) }}>
                                        {tab.name}
                                    </h3>
                                    <div className="guide-table-wrap">
                                        <table className="guide-table">
                                            <thead>
                                                <tr>
                                                    <th className="guide-th">Option</th>
                                                    <th className="guide-th">Type</th>
                                                    <th className="guide-th">Default</th>
                                                    <th className="guide-th">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tab.options.map((opt) => (
                                                    <OptionRow key={opt.name} option={opt} highlight={searchTerm} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                            {/* Cross-class results */}
                            {crossClassResults && (
                                <div className="guide-cross-class">
                                    <h3 className="guide-cross-class-title">Also found in other classes:</h3>
                                    {crossClassResults.map((r) => (
                                        <div key={`${r.classGuide.className}-${r.tab.name}`} className="guide-table-section">
                                            <h3 className="guide-table-title" style={{ color: getClassColor(r.classGuide) }}>
                                                {r.classGuide.icon} {r.classGuide.className} → {r.tab.name}
                                            </h3>
                                            <div className="guide-table-wrap">
                                                <table className="guide-table">
                                                    <thead>
                                                        <tr>
                                                            <th className="guide-th">Option</th>
                                                            <th className="guide-th">Type</th>
                                                            <th className="guide-th">Default</th>
                                                            <th className="guide-th">Description</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {r.options.map((opt) => (
                                                            <OptionRow key={opt.name} option={opt} highlight={searchTerm} />
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        // Normal mode: show selected tab
                        <div className="guide-table-section">
                            <div className="guide-table-wrap">
                                <table className="guide-table">
                                    <thead>
                                        <tr>
                                            <th className="guide-th">Option</th>
                                            <th className="guide-th">Type</th>
                                            <th className="guide-th">Default</th>
                                            <th className="guide-th">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedClass.tabs[selectedTabIdx]?.options.map((opt) => (
                                            <OptionRow key={opt.name} option={opt} highlight="" />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            <GuideAIChat
                className={selectedClass.className}
                tabName={selectedClass.tabs[selectedTabIdx]?.name || ""}
            />
        </div>
    );
}
