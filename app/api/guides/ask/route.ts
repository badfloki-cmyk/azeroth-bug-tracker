import { NextRequest, NextResponse } from "next/server";
import { guidesData } from "@/data/guidesData";

export async function POST(req: NextRequest) {
    try {
        const { question, className, tabName } = await req.json();

        if (!question || typeof question !== "string" || question.trim().length === 0) {
            return NextResponse.json({ error: "Question is required" }, { status: 400 });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Groq API key is not configured" }, { status: 500 });
        }

        // Build full context from all guide data to allow cross-class questions
        let context = "EXTENDED GUIDE DATA (All Classes):\n\n";

        guidesData.forEach((cg) => {
            context += `=== CLASS: ${cg.className} ${cg.icon} ===\n`;
            cg.tabs.forEach((tab) => {
                context += `Tab: ${tab.name}\n`;
                tab.options.forEach((opt) => {
                    context += `- ${opt.name} (${opt.type}${opt.default ? `, default: ${opt.default}` : ""}): ${opt.description}\n`;
                });
                context += "\n";
            });
            context += "\n";
        });

        const systemPrompt = `You are a helpful assistant for the Azeroth Bug Tracker's F1 Menu Guide. This guide documents all the settings available in the F1 custom menu for a World of Warcraft TBC bot.

Your job is to answer questions about the bot's settings, explain what options do, and help users configure their class correctly. 

You have access to the data for ALL classes. Users might be looking at one class guide but asking about another, or comparing them.

RULES:
- Only answer questions related to the guide data provided below.
- If the answer isn't in the data, say so honestly.
- Keep answers concise but thorough (2-4 sentences is ideal).
- Use the setting names exactly as they appear in the data.
- When mentioning settings, format them in bold.
- You may reference any class/tab from the provided data.
- The user is currently viewing the ${className || "General"} guide and the ${tabName || "Home"} tab, but you should answer based on the entire guide.

GUIDE DATA:
${context}`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: question.trim() },
                ],
                max_tokens: 500,
                temperature: 0.3,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const answer = data.choices[0]?.message?.content || "I couldn't generate an answer.";

        return NextResponse.json({ answer });
    } catch (error: unknown) {
        console.error("Guide AI error:", error);
        const message = error instanceof Error ? error.message : "Failed to generate answer";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
