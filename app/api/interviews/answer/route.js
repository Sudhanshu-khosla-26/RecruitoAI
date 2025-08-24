import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDB } from "@/lib/firebase-admin";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

// simple number extractor fallback
function parseScore10(text) {
    const m = text.match(/(\b\d{1,2}\b)\s*\/\s*10/);
    if (m) return Math.max(0, Math.min(10, parseInt(m[1])));
    const n = text.match(/\bscore[:\s]+(\d{1,2})\b/i);
    if (n) return Math.max(0, Math.min(10, parseInt(n[1])));
    return 5;
}

export async function POST(req) {
    const { qnaId, question, answer, rubric = "" } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `
Evaluate the candidate's answer to a technical interview question.
Return JSON with fields: score10 (0-10), briefFeedback (under 25 words).

Rubric (optional): ${rubric}

Question: ${question}
Answer: ${answer}

JSON only:
`;
    const res = await model.generateContent(prompt);
    const txt = res.response.text();

    let score10 = parseScore10(txt);
    let briefFeedback = "Good attempt; could be more specific.";

    try {
        const json = JSON.parse(txt);
        if (typeof json.score10 === "number") score10 = json.score10;
        if (typeof json.briefFeedback === "string") briefFeedback = json.briefFeedback;
    } catch {
        // fall back to regex score
    }

    const score = Math.round((score10 / 10) * 100);

    await adminDB.collection("interview_qna").doc(qnaId).update({
        answer,
        score,
        feedback: briefFeedback,
    });

    return NextResponse.json({ score, feedback: briefFeedback });
}
