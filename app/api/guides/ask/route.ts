import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { guidesData } from "@/data/guidesData";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const { question, className, tabName } = await req.json();

        if (!question || typeof question !== "string" || question.trim().length === 0) {
            return NextResponse.json({ error: "Question is required" }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
        }

        // Build context from guide data
        let context = "";

        if (className) {
            const classGuide = guidesData.find(
                (cg) => cg.className.toLowerCase() === className.toLowerCase()
            );
            if (classGuide) {
                if (tabName) {
                    // Specific tab context
                    const tab = classGuide.tabs.find(
                        (t) => t.name.toLowerCase() === tabName.toLowerCase()
                    );
                    if (tab) {
                        context = `Class: ${classGuide.className}\nTab: ${tab.name}\nSettings:\n`;
                        tab.options.forEach((opt) => {
                            context += `- ${opt.name} (${opt.type}${opt.default ? `, default: ${opt.default}` : ""}): ${opt.description}\n`;
                        });
                    }
                }

                if (!context) {
                    // Full class context
                    context = `Class: ${classGuide.className}\n\n`;
                    classGuide.tabs.forEach((tab) => {
                        context += `## ${tab.name}\n`;
                        tab.options.forEach((opt) => {
                            context += `- ${opt.name} (${opt.type}${opt.default ? `, default: ${opt.default}` : ""}): ${opt.description}\n`;
                        });
                        context += "\n";
                    });
                }
            }
        }

        // If no specific class, provide a summary of all classes
        if (!context) {
            context = "Available classes and their tabs:\n\n";
            guidesData.forEach((cg) => {
                context += `${cg.icon} ${cg.className}: Tabs - ${cg.tabs.map((t) => t.name).join(", ")}\n`;
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const systemPrompt = `You are a helpful assistant for the Azeroth Bug Tracker's F1 Menu Guide. This guide documents all the settings available in the F1 custom menu for a World of Warcraft TBC bot.

Your job is to answer questions about the bot's settings, explain what options do, and help users configure their class correctly.

RULES:
- Only answer questions related to the guide data provided below.
- If the answer isn't in the data, say so honestly.
- Keep answers concise but thorough (2-4 sentences is ideal).
- Use the setting names exactly as they appear in the data.
- When mentioning settings, format them in bold.
- You may reference other classes/tabs if relevant to the question.

GUIDE DATA:
${context}`;

        const result = await model.generateContent({
            contents: [
                { role: "user", parts: [{ text: systemPrompt + "\n\nUser question: " + question.trim() }] },
            ],
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.3,
            },
        });

        const response = result.response;
        const text = response.text();

        return NextResponse.json({ answer: text });
    } catch (error: unknown) {
        console.error("Guide AI error:", error);
        const message = error instanceof Error ? error.message : "Failed to generate answer";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
