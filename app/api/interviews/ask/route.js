import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDB } from "@/lib/firebase-admin";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function POST(req) {
    const { interviewId, context = "" } = await req.json();

    // Pull last 6 QnA for context (short prompt)
    const qnaSnap = await adminDB
        .collection("interview_qna")
        .where("interviewId", "==", interviewId)
        .orderBy("createdAt", "desc")
        .limit(6)
        .get();

    const history = qnaSnap.docs.reverse().map(d => d.data());

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `
You are a concise, professional interviewer. Ask exactly ONE next question.
Keep it short (max 20 words). Avoid fluff.

Context:
${JSON.stringify({ context, history }, null, 2)}
`;
    const res = await model.generateContent(prompt);
    const question = res.response.text().trim();

    const qnaRef = await adminDB.collection("interview_qna").add({
        interviewId,
        question,
        answer: "",
        score: 0,
        feedback: "",
        createdAt: new Date(),
    });

    return NextResponse.json({ qnaId: qnaRef.id, question });
}
