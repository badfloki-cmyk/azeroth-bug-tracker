import React, { useState } from "react";
import { X, CheckCircle, Copy, ExternalLink, Lightbulb } from "lucide-react";
import { WoWPanel } from "./WoWPanel";
import { ClassIcon } from "./ClassIcon";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

export type WoWClass = 'rogue' | 'hunter' | 'warrior' | 'warlock' | 'paladin' | 'priest' | 'mage' | 'shaman' | 'druid' | 'esp' | 'fishingbot';

interface FeatureRequestModalProps {
    developer: 'astro' | 'bungee';
    onClose: () => void;
    onSubmit: (feature: FeatureRequest) => Promise<string | void>;
}

export interface FeatureRequest {
    developer: 'astro' | 'bungee';
    category: 'class' | 'esp' | 'fishingbot' | 'other';
    wowClass?: WoWClass;
    title: string;
    description: string;
    discordUsername: string;
    sylvanasUsername: string;
    isPrivate: boolean;
}

const developerClasses: Record<'astro' | 'bungee', WoWClass[]> = {
    astro: ['rogue', 'hunter', 'warrior', 'warlock', 'paladin', 'fishingbot'],
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
    fishingbot: "Fishing Bot",
};

const FieldError = ({ error }: { error?: string }) => {
    if (!error) return null;
    return <p className="text-xs text-red-400 mt-1">{error}</p>;
};

export const FeatureRequestModal = ({ developer, onClose, onSubmit }: FeatureRequestModalProps) => {
    const [category, setCategory] = useState<'class' | 'esp' | 'fishingbot' | 'other'>('class');
    const [selectedClass, setSelectedClass] = useState<WoWClass | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [discordUsername, setDiscordUsername] = useState("");
    const [sylvanasUsername, setSylvanasUsername] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [submittedId, setSubmittedId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const clearError = (field: string) => {
        setErrors(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const errClass = (field: string) => errors[field] ? 'border-red-500/40' : '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (category === 'class' && !selectedClass) newErrors.selectedClass = "Please select a class.";
        if (!title.trim()) newErrors.title = "Title is required.";
        if (!description.trim()) newErrors.description = "Description is required.";
        if (!discordUsername.trim()) newErrors.discordUsername = "Discord username is required.";
        if (!sylvanasUsername.trim()) newErrors.sylvanasUsername = "Sylvanas username is required.";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsSubmitting(true);
        try {
            const resultId = await onSubmit({
                developer,
                category,
                wowClass: selectedClass || undefined,
                title,
                description,
                discordUsername,
                sylvanasUsername,
                isPrivate,
            });
            if (resultId && typeof resultId === 'string') {
                setSubmittedId(resultId);
            } else {
                onClose();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const shareUrl = submittedId ? `${window.location.origin}/features/${submittedId}` : "";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <WoWPanel className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-auto p-4 sm:p-6">
                <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 text-muted-foreground hover:text-primary transition-colors">
                    <X className="w-6 h-6" />
                </button>

                {submittedId ? (
                    <div className="py-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/20">
                            <CheckCircle className="w-10 h-10 text-green-400" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="font-display text-3xl wow-gold-text">Success!</h2>
                            <p className="text-muted-foreground">Your feature request has been submitted.</p>
                        </div>

                        <div className="bg-black/40 p-6 rounded-sm border border-border/50 max-w-md mx-auto space-y-4">
                            <div className="space-y-2 text-left">
                                <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Your Private Status Link</span>
                                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                    Since this is a private request, it won't appear on the public list.
                                    Save this unique link to check its status:
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1 bg-black/60 border border-border p-2.5 rounded-sm text-xs font-mono truncate text-muted-foreground select-all">
                                    {shareUrl}
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2.5 bg-primary/10 border border-primary/20 rounded-sm hover:bg-primary/20 transition-all text-primary"
                                    title="Copy Link"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>

                            <a
                                href={shareUrl}
                                target="_blank"
                                className="wow-button-primary w-full flex items-center justify-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" /> View Status
                            </a>
                        </div>

                        <div className="pt-4">
                            <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase font-bold tracking-widest">
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="font-display text-xl sm:text-2xl wow-gold-text mb-4 sm:mb-6">
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
                                        <SelectItem value="fishingbot">Fishing Bot</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Class Selection */}
                            {category === 'class' && (
                                <div id="field-selectedClass">
                                    <label className="block font-display text-sm text-primary mb-3 tracking-wider">Target Class</label>
                                    <div className="flex flex-wrap gap-2">
                                        {developerClasses[developer].filter(c => c !== 'esp' && c !== 'fishingbot').map((wowClass) => (
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

                            <div className="flex items-center gap-3 p-3 rounded-sm border border-primary/20 bg-primary/5">
                                <label className="relative flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPrivate}
                                        onChange={(e) => setIsPrivate(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                                <div className="flex-1">
                                    <span className="block text-sm font-display text-primary tracking-wide">Private Request</span>
                                    <span className="block text-[10px] text-muted-foreground uppercase font-bold">Will not be shown on the public homepage</span>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4">
                                <button type="button" onClick={onClose} className="wow-button flex-1" disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="wow-button-primary flex-1" disabled={isSubmitting}>
                                    {isSubmitting ? "Submitting..." : "Submit Request"}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </WoWPanel>
        </div>
    );
};
