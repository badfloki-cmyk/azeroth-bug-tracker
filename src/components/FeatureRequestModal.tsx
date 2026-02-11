import React, { useState } from "react";
import { X } from "lucide-react";
import { WoWPanel } from "./WoWPanel";
import { ClassIcon } from "./ClassIcon";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

export type WoWClass = 'rogue' | 'hunter' | 'warrior' | 'warlock' | 'paladin' | 'priest' | 'mage' | 'shaman' | 'druid' | 'esp';

interface FeatureRequestModalProps {
    developer: 'astro' | 'bungee';
    onClose: () => void;
    onSubmit: (feature: FeatureRequest) => void;
}

export interface FeatureRequest {
    developer: 'astro' | 'bungee';
    category: 'class' | 'esp' | 'other';
    wowClass?: WoWClass;
    title: string;
    description: string;
    discordUsername: string;
    sylvanasUsername: string;
}

const developerClasses: Record<'astro' | 'bungee', WoWClass[]> = {
    astro: ['rogue', 'hunter', 'warrior', 'warlock', 'paladin'],
    bungee: ['priest', 'mage', 'shaman', 'druid', 'esp'],
};

const classNames: Record<WoWClass, string> = {
    rogue: "Rogue",
    hunter: "Hunter",
    warrior: "Warrior",
    warlock: "Warlock",
    paladin: "Paladin",
    priest: "Priest",
    mage: "Mage",
    shaman: "Shaman",
    druid: "Druid",
    esp: "ESP System",
};

const FieldError = ({ error }: { error?: string }) => {
    if (!error) return null;
    return <p className="text-xs text-red-400 mt-1">{error}</p>;
};

export const FeatureRequestModal = ({ developer, onClose, onSubmit }: FeatureRequestModalProps) => {
    const [category, setCategory] = useState<'class' | 'esp' | 'other'>('class');
    const [selectedClass, setSelectedClass] = useState<WoWClass | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [discordUsername, setDiscordUsername] = useState("");
    const [sylvanasUsername, setSylvanasUsername] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const clearError = (field: string) => {
        setErrors(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const errClass = (field: string) => errors[field] ? 'border-red-500/40' : '';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (category === 'class' && !selectedClass) newErrors.selectedClass = "Please select a class.";
        if (!title.trim()) newErrors.title = "Title is required.";
        if (!description.trim()) newErrors.description = "Description is required.";
        if (!discordUsername.trim()) newErrors.discordUsername = "Discord username is required.";
        if (!sylvanasUsername.trim()) newErrors.sylvanasUsername = "Sylvanas username is required.";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        onSubmit({
            developer,
            category,
            wowClass: selectedClass || undefined,
            title,
            description,
            discordUsername,
            sylvanasUsername,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <WoWPanel className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-auto p-6">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors">
                    <X className="w-6 h-6" />
                </button>

                <h2 className="font-display text-2xl wow-gold-text mb-6">
                    Request Feature - {developer === 'astro' ? 'Astro' : 'Bungee'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category */}
                    <div>
                        <label className="block font-display text-sm text-primary mb-2 tracking-wider">Category</label>
                        <Select value={category} onValueChange={(v: any) => { setCategory(v); if (v !== 'class') setSelectedClass(null); }}>
                            <SelectTrigger className="wow-input">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class">Class Feature</SelectItem>
                                <SelectItem value="esp">ESP System</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Class Selection */}
                    {category === 'class' && (
                        <div id="field-selectedClass">
                            <label className="block font-display text-sm text-primary mb-3 tracking-wider">Target Class</label>
                            <div className="flex flex-wrap gap-2">
                                {developerClasses[developer].filter(c => c !== 'esp').map((wowClass) => (
                                    <button
                                        key={wowClass}
                                        type="button"
                                        onClick={() => { setSelectedClass(wowClass); clearError('selectedClass'); }}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border-2 transition-all text-sm ${selectedClass === wowClass ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                                    >
                                        <ClassIcon wowClass={wowClass} size="sm" />
                                        <span className={`class-${wowClass}`}>{classNames[wowClass]}</span>
                                    </button>
                                ))}
                            </div>
                            <FieldError error={errors.selectedClass} />
                        </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-display text-sm text-primary mb-2 tracking-wider">Discord Username</label>
                            <input
                                type="text"
                                value={discordUsername}
                                onChange={(e) => { setDiscordUsername(e.target.value); clearError('discordUsername'); }}
                                className={`wow-input ${errClass('discordUsername')}`}
                                placeholder="Name#0000"
                            />
                            <FieldError error={errors.discordUsername} />
                        </div>
                        <div>
                            <label className="block font-display text-sm text-primary mb-2 tracking-wider">Sylvanas Username</label>
                            <input
                                type="text"
                                value={sylvanasUsername}
                                onChange={(e) => { setSylvanasUsername(e.target.value); clearError('sylvanasUsername'); }}
                                className={`wow-input ${errClass('sylvanasUsername')}`}
                                placeholder="Username"
                            />
                            <FieldError error={errors.sylvanasUsername} />
                        </div>
                    </div>

                    <div>
                        <label className="block font-display text-sm text-primary mb-2 tracking-wider">Feature Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); clearError('title'); }}
                            className={`wow-input ${errClass('title')}`}
                            placeholder="Short title for your request"
                        />
                        <FieldError error={errors.title} />
                    </div>

                    <div>
                        <label className="block font-display text-sm text-primary mb-2 tracking-wider">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => { setDescription(e.target.value); clearError('description'); }}
                            className={`wow-input min-h-[120px] ${errClass('description')}`}
                            placeholder="What would you like to see added?"
                        />
                        <FieldError error={errors.description} />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="wow-button flex-1">Cancel</button>
                        <button type="submit" className="wow-button-primary flex-1">Submit Request</button>
                    </div>
                </form>
            </WoWPanel>
        </div>
    );
};
