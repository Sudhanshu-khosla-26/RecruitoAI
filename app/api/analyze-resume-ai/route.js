// app/api/analyze-resume/route.js
import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import * as mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// === Helper function to parse the resume file to text ===
async function parseResumeToText(file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    let resumeText = "";

    if (file.name.endsWith(".pdf")) {
        try {
            // Dynamically import pdf-parse
            const pdf = (await import("pdf-parse/lib/pdf-parse.js")).default;
            const parsed = await pdf(buffer);
            resumeText = parsed.text;
        } catch (err) {
            console.error("PDF parsing error:", err.message);
            throw new Error("Could not parse the PDF file.");
        }
    } else if (file.name.endsWith(".docx")) {
        const { value } = await mammoth.extractRawText({ buffer });
        resumeText = value;
    } else {
        resumeText = buffer.toString("utf-8");
    }
    // Simple cleanup for better processing
    return resumeText.replace(/\s\s+/g, ' ').trim();
}

// === The Main API Endpoint ===
export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("resume");
        const jobDescription = formData.get("jobDescription");
        const jobId = formData.get("jobId");
        const userId = formData.get("userId");

        if (!file || !jobDescription || !jobId || !userId) {
            throw new Error("Missing required form data.");
        }

        // 1. Parse the resume file into clean text.
        const resumeText = await parseResumeToText(file);

        // 2. Initialize the Gemini AI Client
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
        // Using Gemini 1.5 Flash for speed, cost, and JSON output capability
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json", // Critical for reliable JSON output
            },
        });

        // 3. Create a detailed prompt for Gemini
        const prompt = `
You are an expert HR recruitment analyst. Your task is to analyze the provided resume against the given job description and return ONLY a valid JSON object as output. 
Do not include explanations, markdown, or extra text outside the JSON.

### Instructions:
1. **Skills Match**: Extract skills explicitly mentioned in the job description and check if they appear in the resume. Identify matched and missing skills. 
   - Score should be proportional to % of required skills matched.
2. **Experience Match**: Identify required years of experience from the job description (if not specified, mark as "Not specified"). 
   - Estimate candidate’s years of experience from resume (using dates or keywords like "X years").
   - Score should reflect closeness between required and resume experience.
3. **Education Match**: Identify minimum required education level from job description (e.g., "Bachelor’s in CS") and compare with resume. 
   - Score should reflect how well candidate’s education matches requirement.
4. **Overall Fit**: Write a short unbiased summary explaining why candidate is a strong, weak, or partial fit.
5. **Status**: Decide "shortlisted", "rejected", or "consider" based on total score:
   - Shortlisted: score ≥ 75
   - Consider: 50–74
   - Rejected: < 50

### Job Description:
---
${jobDescription}
---

### Resume:
---
${resumeText}
---

### Expected Output:
Return ONLY a valid JSON object in the exact structure below:

{
  "totalScore": number,
  "summary": "string",
  "status": "shortlisted" | "rejected" | "consider",
  "breakdown": {
    "skillAnalysis": {
      "score": number,
      "requiredSkills": ["string"],
      "matchedSkills": ["string"],
      "missingSkills": ["string"]
    },
    "experienceAnalysis": {
      "score": number,
      "requiredYears": number | "Not specified",
      "resumeYears": number,
      "summary": "string"
    },
    "educationAnalysis": {
      "score": number,
      "requiredEducation": "string",
      "foundEducation": "string",
      "summary": "string"
    }
  }
}
`;


        // 4. Call the Gemini API and get the structured analysis
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysisResult = JSON.parse(response.text());

        // 5. Save the detailed analysis to Firebase
        // await adminDB.collection("matches").add({
        //     userId,
        //     jobId,
        //     totalScore: analysisResult.totalScore,
        //     summary: analysisResult.summary,
        //     breakdown: analysisResult.breakdown, // Save the entire detailed breakdown
        //     status: analysisResult.status,
        //     createdAt: new Date(),
        // });

        // 6. Return the analysis to the client
        return NextResponse.json(analysisResult);

    } catch (err) {
        console.error("Error in matching:", err);
        return NextResponse.json(
            { error: "Resume matching failed", details: err.message },
            { status: 500 }
        );
    }
}