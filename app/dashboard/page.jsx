"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import Sidebar from "@/components/sidebar";
import JobDetailsModal from "@/components/job-details-modal";
import JobCreationModal from "@/components/job-creation-modal";
import { Briefcase, Calendar, Building } from "lucide-react";

import { auth } from "@/lib/firebase"; // ✅ Firebase auth
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [jobDescriptions, setJobDescriptions] = useState([]);
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeJobs: 0,
        applications: 0,
        hired: 0,
    });

    const handleViewJob = (job) => {
        setSelectedJob(job);
        setIsJobDetailsOpen(true);
    };

    useEffect(() => {
        // ✅ Track user auth state
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);

            if (firebaseUser) {
                fetchJobDescriptions();
            } else {
                window.location.href = "/signin";
            }
        });

        return () => unsubscribe();
    }, []);

    const generateJd = (designation, location, paid, department, company_name) => {
        const job = {
            designation: designation,
            location: location,
            paid: paid,
            department: department,
            company_name: company_name
        };

        fetch("/api/generatejd-ai", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(job)
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                console.log("Generated Job Description:", data.job_description);
            })
            .catch(error => {
                console.error("Error generating job description:", error);
            });
    }


    const fetchJobDescriptions = async () => {
        try {
            const response = await fetch("/api/job-descriptions");
            if (response.ok) {
                const result = await response.json();
                setJobDescriptions(result.data || []);

                setStats({
                    totalJobs: result.data?.length || 0,
                    activeJobs: result.data?.length || 0, // treat all jobs as active
                    applications: Math.floor(Math.random() * 200) + 50, // mock data
                    hired: Math.floor(Math.random() * 20) + 1, // mock data
                });
            }
        } catch (error) {
            console.error("Error fetching job descriptions:", error);
        }
    };

    const handleJobCreated = () => {
        setIsModalOpen(false);
        fetchJobDescriptions(); // Refresh list
    };

    const handleSignOut = async () => {
        await signOut(auth);
        window.location.href = "/signin";
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        // Handle Firestore Timestamp object
        if (typeof dateValue === "object" && dateValue._seconds) {
            const date = new Date(dateValue._seconds * 1000);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        // Handles ISO 8601 and "17 August 2025 at 02:11:08 UTC+5:30" formats
        const parsed = Date.parse(dateValue);
        if (!isNaN(parsed)) {
            return new Date(parsed).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        // Try to extract date part if not ISO
        const str = String(dateValue);
        const match = str.match(/^(\d{1,2}) (\w+) (\d{4})/);
        if (match) {
            const [, day, month, year] = match;
            return new Date(`${month} ${day}, ${year}`).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        return String(dateValue);
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
                    <p className="mt-2 text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // already redirected
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <Sidebar onCreateJob={() => setIsModalOpen(true)} />

            {/* Main Content */}
            <div className="lg:ml-64 transition-all duration-300">
                <div className="p-6 lg:p-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Welcome back!
                        </h1>
                        <p className="text-slate-600 mt-2">Manage your job descriptions and recruitment process</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card className="h-32 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-cyan-100 text-sm">Total Jobs</p>
                                        <p className="text-2xl font-bold">{stats.totalJobs}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="h-32 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-emerald-100 text-sm">Active Jobs</p>
                                        <p className="text-2xl font-bold">{stats.activeJobs}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="h-32 bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-sm">Applications</p>
                                        <p className="text-2xl font-bold">0</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="h-32 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-orange-100 text-sm">Hired</p>
                                        <p className="text-2xl font-bold">0</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                        <Building className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Jobs */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-3">
                            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                                <CardHeader>
                                    <CardTitle>Recent Job Descriptions</CardTitle>
                                    <CardDescription>Your latest job postings and their status</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {jobDescriptions.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                            <p className="text-slate-600 mb-4">No job descriptions yet</p>
                                            <Button
                                                onClick={() => setIsModalOpen(true)}
                                                className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700"
                                            >
                                                Create Your First Job
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {jobDescriptions.slice(0, 5).map((job) => (
                                                <div
                                                    key={job.id}
                                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                                >
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-slate-900">{job.title}</h4>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            {job.company_name && (
                                                                <>
                                                                    <span className="text-sm text-slate-600">{job.company_name}</span>
                                                                    <span className="text-slate-400">•</span>
                                                                </>
                                                            )}
                                                            <span className="text-sm text-slate-600">
                                                                Posted {formatDate(job.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                                            Active
                                                        </Badge>
                                                        <Button variant="outline" size="sm" onClick={() => handleViewJob(job)}>
                                                            View
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            <JobCreationModal isOpen={isModalOpen} onClose={handleJobCreated} />
            <JobDetailsModal
                isOpen={isJobDetailsOpen}
                onClose={() => setIsJobDetailsOpen(false)}
                job={selectedJob}
            />
        </div>
    );
}
