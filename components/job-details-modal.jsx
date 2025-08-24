"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dialog"
import { Badge } from "@/components/badge"
import { Button } from "@/components/button"
import { Separator } from "@/components/separator"
import { Building, MapPin, DollarSign, Calendar, Users, Clock } from 'lucide-react'



export default function JobDetailsModal({ isOpen, onClose, job }) {
    if (!job) return null

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

    const formatSalary = (min, max) => {
        if (!min && !max) return "Salary not specified"
        if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
        if (min) return `From $${min.toLocaleString()}`
        if (max) return `Up to $${max.toLocaleString()}`
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-900">
                        {job.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Job Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            {job.company_name && (
                                <div className="flex items-center space-x-2">
                                    <Building className="w-4 h-4 text-slate-500" />
                                    <span className="text-slate-700">{job.company_name}</span>
                                </div>
                            )}

                            {job.location && (
                                <div className="flex items-center space-x-2">
                                    <MapPin className="w-4 h-4 text-slate-500" />
                                    <span className="text-slate-700">{job.location}</span>
                                </div>
                            )}

                            {(job.salary_min || job.salary_max) && (
                                <div className="flex items-center space-x-2">
                                    <DollarSign className="w-4 h-4 text-slate-500" />
                                    <span className="text-slate-700">{formatSalary(job.salary_min, job.salary_max)}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-700">Posted {formatDate(job.created_at)}</span>
                            </div>

                            {job.employment_type && (
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-slate-500" />
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                        {job.employment_type}
                                    </Badge>
                                </div>
                            )}

                            {job.experience_level && (
                                <div className="flex items-center space-x-2">
                                    <Users className="w-4 h-4 text-slate-500" />
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        {job.experience_level}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Job Description */}
                    {job.description && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">Job Description</h3>
                            <div className="prose prose-slate max-w-none">
                                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {job.description}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Requirements */}
                    {job.requirements && (
                        <>
                            <Separator />
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-3">Requirements</h3>
                                <div className="prose prose-slate max-w-none">
                                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                        {job.requirements}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Benefits */}
                    {job.benefits && (
                        <>
                            <Separator />
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-3">Benefits</h3>
                                <div className="prose prose-slate max-w-none">
                                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                        {job.benefits}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Skills */}
                    {job.skills && job.skills.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-3">Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills.map((skill, index) => (
                                        <Badge key={index} variant="outline" className="bg-slate-50">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700">
                        Edit Job
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
