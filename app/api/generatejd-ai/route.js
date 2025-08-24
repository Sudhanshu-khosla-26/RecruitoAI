import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
    try {
        // ✅ Extract fields from request body
        const { jobRole, keySkills, industry, location, yearsOfExperience, ctcRange, company_name } = await request.json();

        // ✅ Build prompt with strict JSON schema
        const prompt = `
Generate a professional job description in JSON format.
Follow this exact schema:

{
  "title": "<Job Title>",
  "companyName": "<Company>",
  "location": "<Location>",
  "description": {
    "about": "<Short about role>",
    "key_responsibilities": ["...", "..."],
    "qualifications": ["...", "..."],
    "what_we_offer": ["...", "..."]
  },
  "sidePanel": {
    "industry_type": "<Industry>",
    "experience_required": "<Years of experience>",
    "ctc_range": "<CTC Range>",
    "key_skills": ["...", "..."]
  }
}

Job Title: ${jobRole}
Company: ${company_name || "Our Innovative Company"}
Location: ${location || "Not specified"}
Industry: ${industry || "General"}
Years of Experience: ${yearsOfExperience || "0+"}
CTC Range: ${ctcRange || "As per industry standards"}
Key Skills: ${Array.isArray(keySkills) ? keySkills.join(", ") : keySkills || "General development skills"}

⚠️ IMPORTANT: Return ONLY valid JSON. Do not include extra text, markdown, or explanation.
`;

        // ✅ Initialize Gemini client
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // ✅ Call Gemini API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jdText = await response.text();

        if (!jdText) {
            return NextResponse.json({ error: "The AI model returned an empty response." }, { status: 500 });
        }

        // ✅ Parse JSON safely
        let jdJson;
        try {
            jdJson = JSON.parse(jdText);
        } catch (err) {
            console.warn("⚠️ AI response was not pure JSON, wrapping raw text instead.");
            jdJson = { raw_text: jdText };
        }

        // ✅ Return structured JD
        return NextResponse.json({ job_description: jdJson });

    } catch (error) {
        console.error("❌ Error in /api/generatejd-ai:", error);
        return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
    }
}
