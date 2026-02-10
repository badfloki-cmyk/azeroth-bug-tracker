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

        // SMART FILTERING LOGIC
        const q = question.toLowerCase();
        const availableClasses = guidesData.map(cg => cg.className.toLowerCase());

        // 1. Identify which classes are relevant
        const targetedClasses = guidesData.filter(cg => {
            const name = cg.className.toLowerCase();
            // Include if class name mentioned in question
            if (q.includes(name)) return true;
            // Include the current class user is looking at
            if (className && className.toLowerCase() === name) return true;
            return false;
        });

        // 2. Fallback: If no class matched and no current class, include first 2 or just a summary
        let classesToInclude = targetedClasses;
        if (classesToInclude.length === 0) {
            // If it's a very general question, we'll try to include a broader but light context
            classesToInclude = className
                ? guidesData.filter(cg => cg.className.toLowerCase() === className.toLowerCase())
                : [guidesData[0]]; // Default to first class if totally lost
        }

        // 3. Build filtered context
        let context = "EXTRACTED GUIDE CONTEXT (Relevant Classes Only):\n\n";

        classesToInclude.forEach((cg) => {
            context += `[CLASS: ${cg.className}]\n`;
            cg.tabs.forEach((tab) => {
                context += `- Tab: ${tab.name}\n`;
                tab.options.forEach((opt) => {
                    // Only include name and description to save tokens
                    context += `  * ${opt.name}: ${opt.description}\n`;
                });
            });
            context += "\n";
        });

        // 4. Add a global summary if many classes were skipped
        if (classesToInclude.length < guidesData.length) {
            context += "OTHER AVAILABLE CLASSES (Summary only):\n";
            guidesData.forEach(cg => {
                if (!classesToInclude.find(c => c.className === cg.className)) {
                    context += `- ${cg.className}: Tools for ${cg.tabs.map(t => t.name).join(", ")}\n`;
                }
            });
        }

        const systemPrompt = `You are a helpful assistant for the Azeroth Bug Tracker's F1 Menu Guide. 

Your job is to answer questions about the bot's settings. You have been provided with a FILTERED section of the guide data below that is most relevant to the user's question.

RULES:
- Only answer based on the provided guide data.
- If the user asks about a class not in the "Relevant Classes" section, check the "Other Available Classes" summary and tell them you have data for it, but they should ask specifically about it.
- Keep answers concise (2-4 sentences).
- Use **bold** for setting names.

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
