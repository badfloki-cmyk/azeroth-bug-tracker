"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, Trash2 } from "lucide-react";

interface ChatMessage {
    role: "user" | "ai";
    content: string;
}

interface GuideAIChatProps {
    className: string;
    tabName: string;
}

export function GuideAIChat({ className, tabName }: GuideAIChatProps) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const sendMessage = async () => {
        const q = input.trim();
        if (!q || loading) return;

        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: q }]);
        setLoading(true);

        try {
            const res = await fetch("/api/guides/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: q, className, tabName }),
            });

            const data = await res.json();

            if (res.ok && data.answer) {
                setMessages((prev) => [...prev, { role: "ai", content: data.answer }]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: "ai", content: data.error || "Sorry, I couldn't process that question." },
                ]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "ai", content: "Connection error. Please try again." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => setMessages([]);

    return (
        <>
            {/* Floating toggle button */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="ai-chat-fab"
                    title="Ask AI about settings"
                >
                    <Sparkles size={22} />
                </button>
            )}

            {/* Chat panel */}
            {open && (
                <div className="ai-chat-panel">
                    {/* Header */}
                    <div className="ai-chat-header">
                        <div className="ai-chat-header-left">
                            <Sparkles size={16} className="ai-chat-header-icon" />
                            <span className="ai-chat-header-title">Guide Assistant</span>
                        </div>
                        <div className="ai-chat-header-actions">
                            {messages.length > 0 && (
                                <button onClick={clearChat} className="ai-chat-clear" title="Clear chat">
                                    <Trash2 size={14} />
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="ai-chat-close">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Context indicator */}
                    <div className="ai-chat-context">
                        Answering about: <strong>Full Guide</strong> (All Classes)
                    </div>

                    {/* Messages */}
                    <div className="ai-chat-messages">
                        {messages.length === 0 && (
                            <div className="ai-chat-empty">
                                <Sparkles size={28} style={{ opacity: 0.3 }} />
                                <p>Ask me anything about the settings!</p>
                                <div className="ai-chat-suggestions">
                                    <button onClick={() => { setInput(`What does Enable Rotation do?`); }}>
                                        What does Enable Rotation do?
                                    </button>
                                    <button onClick={() => { setInput(`How should I configure AoE?`); }}>
                                        How to configure AoE?
                                    </button>
                                    <button onClick={() => { setInput(`Explain the survival settings`); }}>
                                        Explain survival settings
                                    </button>
                                </div>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`ai-chat-msg ai-chat-msg--${msg.role}`}>
                                <div className="ai-chat-msg-bubble">
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="ai-chat-msg ai-chat-msg--ai">
                                <div className="ai-chat-msg-bubble ai-chat-typing">
                                    <Loader2 size={14} className="ai-chat-spinner" />
                                    Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="ai-chat-input-wrap">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Ask about any setting..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="ai-chat-input"
                            disabled={loading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="ai-chat-send"
                        >
                            {loading ? <Loader2 size={16} className="ai-chat-spinner" /> : <Send size={16} />}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
