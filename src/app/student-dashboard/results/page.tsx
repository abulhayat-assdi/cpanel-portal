"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentResult, ExamResult } from "@/services/resultService";

const FIXED_SUBJECTS: { key: string; label: string }[] = [
    { key: "sales", label: "Sales" },
    { key: "service", label: "Service" },
    { key: "careerPlanning", label: "Career Planning & Branding" },
    { key: "ai", label: "AI" },
    { key: "metaMarketing", label: "Meta Marketing" },
    { key: "msOffice", label: "MS Office" },
    { key: "landingPage", label: "Landing Page & Content" },
];

const DocumentTextIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

const UserCircleIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

export default function StudentResultsPage() {
    const { userProfile, loading } = useAuth();
    const [result, setResult] = useState<ExamResult | null>(null);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchMyResult = async () => {
             if (userProfile?.studentBatchName && userProfile?.studentRoll) {
                try {
                    const data = await getStudentResult(userProfile.studentBatchName, userProfile.studentRoll);
                    setResult(data);
                } catch (err) {
                    console.error("Failed to fetch student result", err);
                } finally {
                    setFetching(false);
                }
             } else {
                 setFetching(false);
             }
        };

        if (!loading) {
            fetchMyResult();
        }
    }, [loading, userProfile]);

    if (loading || fetching) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]"></div>
            </div>
        );
    }

    const hasGridData = result?.examRecords && result.examRecords.length > 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">Academic Result</h1>
                        <p className="text-[#6b7280] mt-1">
                            Your performance evaluation across all modules and exams.
                        </p>
                    </div>
                </div>
            </div>

            {!hasGridData ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
                     <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 relative z-10">
                        <DocumentTextIcon className="w-10 h-10 text-emerald-500" />
                     </div>
                     <h2 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Results Unavailable</h2>
                     <p className="text-gray-500 max-w-md mx-auto relative z-10">
                         Your exam results for Batch {userProfile?.studentBatchName} have not been published yet. Please check back later or contact your administration.
                     </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Profile Header Card */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-emerald-100 relative overflow-hidden flex items-center gap-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full opacity-50 -translate-y-1/2 translate-x-1/3"></div>
                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm relative z-10">
                            <UserCircleIcon className="w-16 h-16 text-[#059669]" />
                        </div>
                        <div className="relative z-10 flex-grow">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">{result.name}</h2>
                            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-3">
                                <div>
                                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Roll Number</p>
                                    <p className="text-xl font-bold text-gray-700">#{result.roll}</p>
                                </div>
                                <div className="hidden sm:block w-px h-8 bg-gray-200 mt-1"></div>
                                <div>
                                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Batch Name</p>
                                    <p className="text-xl font-bold text-gray-700">{result.batchName}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* The Grid */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto w-full">
                            <table className="w-full text-center border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-[#8cc63f] text-black">
                                        <th className="px-4 py-4 border border-[#7db037] font-bold text-left whitespace-nowrap text-[15px] shadow-sm tracking-wide">Exam Name</th>
                                        {FIXED_SUBJECTS.map(s => (
                                            <th key={s.key} className="px-3 py-4 border border-[#7db037] font-semibold text-[14px] leading-snug">
                                                {s.label.includes("&") ? (
                                                    <>{s.label.split("&")[0].trim()}<br />{"& " + s.label.split("&")[1].trim()}</>
                                                ) : s.label}
                                            </th>
                                        ))}
                                        {(result.customColumns || []).map(col => (
                                            <th key={col.id} className="px-3 py-4 border border-[#7db037] font-semibold text-[14px]">{col.label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.examRecords!.map((record, index) => (
                                        <tr key={record.id} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-emerald-50/50 transition-colors`}>
                                            <td className="px-4 py-3.5 border border-gray-200 font-bold text-gray-800 text-left whitespace-nowrap">
                                                {record.examName}
                                            </td>
                                            {FIXED_SUBJECTS.map(s => (
                                                <td key={s.key} className="px-3 py-3.5 border border-gray-200 text-gray-700 font-medium text-[15px]">
                                                    {record.subjects[s.key] || "-"}
                                                </td>
                                            ))}
                                            {(result.customColumns || []).map(col => (
                                                <td key={col.id} className="px-3 py-3.5 border border-gray-200 text-gray-700 font-medium text-[15px]">
                                                    {record.subjects[col.id] || "-"}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden flex flex-col divide-y-4 divide-gray-100 bg-gray-50">
                            {result.examRecords!.map((record) => {
                                const allSubjects = [
                                    ...FIXED_SUBJECTS.map(s => ({ label: s.label, value: record.subjects[s.key] })),
                                    ...(result.customColumns || []).map(col => ({ label: col.label, value: record.subjects[col.id] })),
                                ];
                                return (
                                    <div key={record.id} className="bg-white">
                                        <div className="bg-[#8cc63f] text-black font-bold px-4 py-3 text-lg border-b border-[#7db037] shadow-sm flex items-center justify-between">
                                            <span>{record.examName}</span>
                                            <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col">
                                            {allSubjects.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-emerald-50/30 transition-colors">
                                                    <span className="font-semibold text-gray-600 text-[14px]">{item.label}</span>
                                                    <span className="font-bold text-gray-900 border border-gray-200 px-3 py-1 bg-gray-50 rounded-md min-w-[3rem] text-center text-[15px]">{item.value || "-"}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
