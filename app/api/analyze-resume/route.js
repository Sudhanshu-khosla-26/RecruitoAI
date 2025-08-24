// app/api/analyze-resume/route.js
import { NextResponse } from "next/server"
import { adminDB } from "@/lib/firebase-admin"
import * as mammoth from "mammoth"
import natural from "natural"   // ✅ NLP lib for TF-IDF


const TECH_SKILLS = [
    "javascript", "typescript", "react", "nextjs", "angular", "vue",
    "node", "express", "mongodb", "postgresql", "mysql", "graphql",
    "docker", "kubernetes", "aws", "azure", "gcp", "java", "python", "django", "flask"
]

const extractSoftSkills = (jd) => {
    const softKeywords = ["team", "leader", "collaborate", "communication", "problem-solving", "analytical", "adaptability"]
    return softKeywords.filter((s) => jd.toLowerCase().includes(s))
}

const extractKeywords = (jd) => {
    const lower = jd.toLowerCase()
    const techMatches = TECH_SKILLS.filter((s) => lower.includes(s))

    const education = []
    if (/b\.tech|btech|bachelor/i.test(lower)) education.push("bachelor")
    if (/master|m\.tech/i.test(lower)) education.push("master")
    if (/phd/i.test(lower)) education.push("phd")

    const expMatch = lower.match(/(\d+)\+?\s+years?/)
    const yearsRequired = expMatch ? parseInt(expMatch[1]) : null

    return { techMatches, education, yearsRequired }
}

// === Helper: Cosine Similarity via TF-IDF ===
const computeSemanticSimilarity = (resume, jd) => {
    const tfidf = new natural.TfIdf()
    tfidf.addDocument(resume)
    tfidf.addDocument(jd)

    const v1 = []
    const v2 = []
    tfidf.listTerms(0).forEach(term => {
        v1.push(term.tfidf)
        const jdTerm = tfidf.tfidf(term.term, 1)
        v2.push(jdTerm)
    })

    // cosine similarity
    const dot = v1.reduce((acc, x, i) => acc + x * v2[i], 0)
    const mag1 = Math.sqrt(v1.reduce((acc, x) => acc + x * x, 0))
    const mag2 = Math.sqrt(v2.reduce((acc, x) => acc + x * x, 0))

    return (dot / (mag1 * mag2 || 1)) * 100
}

// === Helper: Recency ===
const computeRecency = (resumeText) => {
    const years = resumeText.match(/20\d{2}/g)
    if (!years) return 50

    const latestYear = Math.max(...years.map(y => parseInt(y)))
    const currentYear = new Date().getFullYear()
    const diff = currentYear - latestYear

    if (diff <= 1) return 90
    if (diff <= 3) return 70
    return 40
}

export async function POST(req) {
    try {
        const formData = await req.formData()
        const file = formData.get("resume")
        const jobDescription = formData.get("jobDescription")
        const jobId = formData.get("jobId")
        const userId = formData.get("userId")

        if (!file) throw new Error("No resume uploaded")

        const buffer = Buffer.from(await file.arrayBuffer())
        let resumeText = ""

        if (file.name.endsWith(".pdf")) {
            try {
                const pdf = (await import("pdf-parse/lib/pdf-parse.js")).default
                const parsed = await pdf(buffer)
                resumeText = parsed.text
            } catch (err) {
                console.error("PDF parsing error:", err.message)
                resumeText = buffer.toString("utf-8") // fallback
            }
        } else if (file.name.endsWith(".docx")) {
            const { value } = await mammoth.extractRawText({ buffer })
            resumeText = value
        } else {
            resumeText = buffer.toString("utf-8")
        }

        const resumeLower = resumeText.toLowerCase()

        const { techMatches, education, yearsRequired } = extractKeywords(jobDescription)
        const softSkillKeywords = extractSoftSkills(jobDescription)

        // === Skills
        const matchedSkills = techMatches.filter((s) => resumeLower.includes(s))
        const skillMatch = (matchedSkills.length / (techMatches.length || 1)) * 100

        // === Education & GPA
        let educationMatch = 50
        if (education.some((e) => resumeLower.includes(e))) educationMatch = 80
        const gpaMatch = resumeText.match(/(\d+(\.\d+)?)/)
        if (gpaMatch) {
            const gpa = parseFloat(gpaMatch[0])
            if (gpa >= 8) educationMatch = 95
        }

        // === Experience
        let experienceMatch = 30
        let resumeYears = 0
        if (yearsRequired) {
            const resumeYearsMatch = resumeLower.match(/(\d+)\s+years?/)
            if (resumeYearsMatch) {
                resumeYears = parseInt(resumeYearsMatch[1])
            } else if (/internship|intern/i.test(resumeLower)) {
                resumeYears = 0.25
            }
            const ratio = Math.min(resumeYears / yearsRequired, 1)
            experienceMatch = Math.round(ratio * 90)
        } else if (/intern|experience|project/i.test(resumeLower)) {
            experienceMatch = 70
        }

        // === Projects
        const projectRelevance = resumeLower.includes("project") ? 80 : 40

        // === Achievements
        const achievements = resumeLower.includes("%") || resumeLower.match(/award|lead|rank/i)
            ? 80 : 40

        // === Soft Skills

        let softSkillsMatch = 30
        let matchedSoftSkills = []

        if (softSkillKeywords.length > 0) {
            matchedSoftSkills = softSkillKeywords.filter((kw) => resumeLower.includes(kw))
            softSkillsMatch = Math.round((matchedSoftSkills.length / softSkillKeywords.length) * 100)
        }


        // === Semantic Similarity (TF-IDF cosine)
        const semanticRelevance = computeSemanticSimilarity(resumeText, jobDescription)

        // === Recency
        const recency = computeRecency(resumeText)

        // === Final Weighted Score
        const totalScore = Math.round(
            0.3 * skillMatch +
            0.2 * experienceMatch +
            0.15 * educationMatch +
            0.1 * projectRelevance +
            0.05 * achievements +
            0.1 * semanticRelevance +
            0.05 * softSkillsMatch +
            0.05 * recency
        )

        await adminDB.collection("matches").add({
            userId,
            jobId,
            totalScore,
            breakdown: {
                skillMatch,
                matchedSkills,
                experienceMatch,
                resumeYears,
                yearsRequired,
                educationMatch,
                projectRelevance,
                achievements,
                matchedSoftSkills,
                softSkillsMatch,
                semanticRelevance: semanticRelevance.toFixed(1),
                recency
            },
            status: totalScore >= 70 ? "shortlisted" : "rejected",
            createdAt: new Date(),
        })

        return NextResponse.json({
            totalScore,
            skillMatch,
            matchedSkills,
            experienceMatch,
            resumeYears,
            yearsRequired,
            educationMatch,
            projectRelevance,
            achievements,
            matchedSoftSkills,
            softSkillsMatch,
            semanticRelevance: semanticRelevance.toFixed(1),
            recency
        })
    } catch (err) {
        console.error("Error in matching:", err)
        return NextResponse.json(
            { error: "Resume matching failed", details: err.message },
            { status: 500 }
        )
    }
}
