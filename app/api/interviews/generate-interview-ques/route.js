import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDB, adminAuth } from "@/lib/firebase-admin";

export const POST = async (request) => {
    const token = request.cookies.get("session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded;
    try {
        decoded = await adminAuth.verifySessionCookie(token, true);
    } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 403 });
    }

    let jobid, type;
    try {
        const body = await request.json();
        jobid = body.jobid;
        type = body.type || ["Behavioral", "Technical", "Experience", "Problem Solving", "Leadership"];
    } catch {
        return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    // ✅ Fetch job description
    const jobDoc = await adminDB.collection("job_descriptions").doc(jobid).get();
    if (!jobDoc.exists) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const jobData = jobDoc.data();

    // ✅ Ensure only recruiter can request
    const userDoc = await adminDB.collection("users").doc(decoded.uid).get();
    const userData = userDoc.data();
    const role = userData?.role || "jobseeker";
    if (role !== "recruiter") {
        return NextResponse.json({ error: "Only recruiters can generate interview questions" }, { status: 403 });
    }

    // ✅ Gemini Client
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // ✅ Prompt
    const prompt = `
You are an expert interviewer. Based on the following job description, generate EXACTLY 15 interview questions.

Job Title: ${jobData.title}
Company: ${jobData.companyName || jobData.company || "Unknown"}
Location: ${jobData.location || "Not specified"}
Industry: ${jobData.sidePanel?.industry_type || "General"}
Experience Required: ${jobData.sidePanel?.experience_required || "Not specified"}
Key Skills: ${jobData.sidePanel?.key_skills?.join(", ") || "General skills"}

Job Description:
${typeof jobData.description === "string" ? jobData.description : JSON.stringify(jobData.description, null, 2)}

Categories of questions to cover:
${type.join(", ")}

️️ Important rules for question generation:
1. Do NOT ask candidates to write or type code. 
2. All questions must be spoken-answerable (conceptual, reasoning, problem-solving, or experience-based).
3. Technical questions should focus on explaining concepts, system design, troubleshooting, comparisons, or decision-making — not coding exercises.
4. Generate exactly 15 questions total, spread across the categories.

⚠️ Output strictly in this JSON format, without any extra text or markdown fences:
{
  "questions": [
    { "category": "Behavioral", "question": "..." },
    { "category": "Technical", "question": "..." }
  ]
}
`;

    // ✅ Generate content
    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // ✅ Clean output (remove ```json fences, extra code blocks)
    text = text.replace(/```json|```/g, "").trim();

    let questions;
    try {
        const parsed = JSON.parse(text);
        questions = parsed.questions || [];
    } catch (err) {
        console.warn("⚠️ Gemini returned non-JSON, fallback triggered");
        questions = text
            .split("\n")
            .filter((line) => line.trim().length > 5) // ignore `{`, `}`, empty lines
            .map((q) => ({ category: "General", question: q.trim() }));
    }

    // ✅ Ensure max 15 questions only
    questions = questions.slice(0, 15);

    return NextResponse.json({ questions });
};
