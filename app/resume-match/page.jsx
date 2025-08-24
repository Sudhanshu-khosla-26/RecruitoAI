"use client"

import { useState, useEffect } from "react"
import { Upload, FileText, Users, Loader2, Save } from "lucide-react"
import { Button } from "@/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card"
import { Textarea } from "@/components/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select"
import { Checkbox } from "@/components/checkbox"
import { Badge } from "@/components/badge"
import { Progress } from "@/components/progress"
import Sidebar from "@/components/sidebar"
import { db } from "@/lib/firebase"
import { collection, getDocs, updateDoc, doc } from "firebase/firestore"

export default function HRDashboard() {
    const [jobList, setJobList] = useState([])
    const [selectedJD, setSelectedJD] = useState("")
    const [jobDescription, setJobDescription] = useState("")
    const [companyName, setCompanyName] = useState("")

    const [selectedResumes, setSelectedResumes] = useState([])
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [analyzedResumes, setAnalyzedResumes] = useState([])
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

    // === Fetch jobs from Firestore ===
    useEffect(() => {
        const fetchJobs = async () => {
            const querySnapshot = await getDocs(collection(db, "job_descriptions"))
            const jobs = []
            querySnapshot.forEach((doc) => jobs.push({ id: doc.id, ...doc.data() }))
            setJobList(jobs)
        }
        fetchJobs()
    }, [])

    // Handle JD selection
    const handleJDChange = (id) => {
        setSelectedJD(id)
        const jd = jobList.find((j) => j.id === id)
        if (jd) {
            setJobDescription(jd.description || "")
            setCompanyName(jd.company_name || "")
        }
    }


    const handleUpdateJobDescription = async () => {
        if (!selectedJD || !jobDescription.trim()) return;

        setIsUpdating(true);
        try {
            // Get reference to the selected Job Description doc
            const docRef = doc(db, "job_descriptions", selectedJD);

            // Update description field
            await updateDoc(docRef, {
                description: jobDescription,
                updatedAt: new Date(), // optional timestamp
            });

            console.log("Job description updated successfully");
        } catch (error) {
            console.error("Error updating job description:", error);
        } finally {
            setIsUpdating(false);
        }
    };


    const handleFileUpload = async (event) => {
        const files = event.target.files ? Array.from(event.target.files) : []
        if (files.length === 0 || !selectedJD) return

        setUploadedFiles([...uploadedFiles, ...files])
        setIsAnalyzing(true)

        try {
            const analysisPromises = files.map((file) => analyzeResume(file, jobDescription))
            const analyses = await Promise.all(analysisPromises)
            setAnalyzedResumes((prev) => [...prev, ...analyses])
        } catch (error) {
            console.error("Error analyzing resumes:", error)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const analyzeResume = async (file, jobDesc) => {
        const formData = new FormData()
        formData.append("resume", file)
        formData.append("jobDescription", jobDesc)
        formData.append("jobId", selectedJD)
        formData.append("userId", "candidate123")

        const res = await fetch("/api/analyze-resume", {
            method: "POST",
            body: formData, // send file + metadata
        })

        const data = await res.json()

        console.log(data);

        return {
            id: Math.random().toString(36).substr(2, 9),
            fileName: file.name,
            matchPercentage: data.totalScore,
            breakdown: data.breakdown,
        }
    }

    const handleResumeSelection = (resumeId, checked) => {
        if (checked) {
            setSelectedResumes([...selectedResumes, resumeId])
        } else {
            setSelectedResumes(selectedResumes.filter((id) => id !== resumeId))
        }
    }

    const proceedCount = selectedResumes.length

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* Sidebar */}
            <Sidebar />


            <div className={`transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>
                <div className="p-3 lg:p-4 max-w-7xl mx-auto">
                    <div className="mb-4">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Management Dashboard
                        </h1>
                        <p className="text-slate-600 mt-1 text-sm">Select job descriptions, match resumes, and manage candidates</p>
                    </div>

                    <div className="flex items-center flex-col md:flex-row gap-3 mb-4">
                        <Card className="bg-white/80 flex-1/2 backdrop-blur-sm border-slate-200/50">
                            <CardHeader className="pb-1 pt-2 px-3  ">
                                <CardTitle className="text-slate-900 text-base">Select Job Description</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 px-3 pb-2">
                                <Select value={selectedJD} onValueChange={handleJDChange}>
                                    <SelectTrigger className="bg-white border-slate-300 max-w-xs h-9">
                                        <SelectValue placeholder="Choose a Job" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {jobList.map((job) => (
                                            <SelectItem key={job.id} value={job.id}>
                                                {job.title} ({job.company_name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/80 flex-1/2 backdrop-blur-sm border-slate-200/50">
                            <CardHeader className="pb-1 pt-2 px-3">
                                <CardTitle className="text-slate-900 text-base">Upload Resume</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 px-3 pb-2">
                                <div className="relative">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept=".pdf,.doc,.docx,.txt"
                                        disabled={!selectedJD || isAnalyzing}
                                    />
                                    <Button
                                        className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white w-full h-9"
                                        disabled={!selectedJD || isAnalyzing}
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload Resume
                                            </>
                                        )}
                                    </Button>
                                </div>
                                {!selectedJD && <p className="text-xs text-slate-500 mt-2">Please select a job first</p>}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                        {/* Job Description - Now takes 2 columns on xl screens for more width */}
                        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 xl:col-span-2">
                            <CardHeader className="pb-2">
                                <h3 className="text-base font-semibold text-slate-900">Job Description</h3>
                                <p className="text-slate-600 text-xs">Company: {companyName}</p>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-2">
                                <Textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Enter job description here..."
                                    className="min-h-[250px] max-h-[250px] bg-white text-sm border-slate-300 resize-none"
                                />
                                <Button
                                    onClick={handleUpdateJobDescription}
                                    disabled={!selectedJD || !jobDescription.trim() || isUpdating}
                                    className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
                                    size="sm"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-3 h-3 mr-2" />
                                            Update Description
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Resume Analysis - Now takes 3 columns on xl screens */}
                        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 xl:col-span-3">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-slate-900">Resume Analysis Results</h3>
                                    {/* <p className="text-slate-600 text-xs">AI-powered matching analysis</p> */}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-3">
                                    {analyzedResumes.map((resume) => (
                                        <div
                                            key={resume.id}
                                            className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <FileText className="w-3 h-3 text-slate-500" />
                                                        <span className="font-medium text-slate-900 text-sm">{resume.fileName}</span>
                                                        <Badge
                                                            variant="secondary"
                                                            className={`text-xs ${resume.matchPercentage >= 80
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : resume.matchPercentage >= 70
                                                                    ? "bg-yellow-100 text-yellow-800"
                                                                    : "bg-red-100 text-red-800"
                                                                }`}
                                                        >
                                                            {resume.matchPercentage}% Match
                                                        </Badge>
                                                    </div>
                                                    <Progress value={resume.matchPercentage} className="mb-1 h-2" />
                                                </div>
                                                <Checkbox
                                                    checked={selectedResumes.includes(resume.id)}
                                                    onCheckedChange={(checked) => handleResumeSelection(resume.id, checked)}
                                                    className="border-slate-400 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                                                />
                                            </div>

                                            <div className="grid grid-cols-4 gap-1 text-xs">
                                                <p>
                                                    <strong>Skills:</strong> {resume.breakdown?.skillAnalysis?.score || resume.breakdown.skillMatch}%
                                                </p>
                                                <p>
                                                    <strong>Experience:</strong> {resume.breakdown.experienceAnalysis.score || resume.breakdown.experienceMatch}%
                                                </p>
                                                <p>
                                                    <strong>Education:</strong> {resume.breakdown.educationAnalysis.score || resume.breakdown.educationMatch}%
                                                </p>
                                                <p>
                                                    <strong>Keywords:</strong> {resume.breakdown.semanticRelevance}%
                                                </p>
                                            </div>

                                            <div className="mt-1 text-xs">
                                                <strong>Status:</strong> {resume.matchPercentage >= 70 ? "✅ Shortlisted" : "❌ Rejected"}{" "}
                                                {resume.matchPercentage < 70 && (
                                                    <span>(Reason: {resume.breakdown.rejectionReason || "Low match"})</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {isAnalyzing && (
                                        <div className="flex items-center justify-center p-6 bg-slate-50 rounded-lg border border-slate-200">
                                            <Loader2 className="w-5 h-5 animate-spin mr-3" />
                                            <span className="text-slate-600 text-sm">Analyzing resumes...</span>
                                        </div>
                                    )}

                                    {analyzedResumes.length === 0 && !isAnalyzing && (
                                        <div className="text-center p-6 bg-slate-50 rounded-lg border border-slate-200">
                                            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                            <p className="text-slate-600 text-sm">No resumes uploaded yet</p>
                                            <p className="text-xs text-slate-500">Select a job and upload resumes to see analysis</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                                            {proceedCount}
                                        </div>
                                        <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                                            <span className="text-slate-900 font-medium text-sm">Selected Candidates</span>
                                        </div>
                                    </div>

                                    <Button
                                        className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white px-4 py-2 shadow-lg"
                                        disabled={proceedCount === 0}
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        Proceed for Interview
                                    </Button>
                                </div>

                                {uploadedFiles.length > 0 && (
                                    <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <h4 className="text-xs font-medium text-slate-900 mb-2">Uploaded Files ({uploadedFiles.length})</h4>
                                        <div className="space-y-1">
                                            {uploadedFiles.map((file, index) => (
                                                <div key={index} className="flex items-center gap-2 text-xs text-slate-700">
                                                    <FileText className="w-3 h-3 text-slate-500" />
                                                    <span>{file.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
