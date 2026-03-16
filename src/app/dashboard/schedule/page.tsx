"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import { formatDateShort } from "@/lib/utils";
import { getClassesByTeacherId, requestClassCompletion, ClassSchedule, getAllClassesSchedules, addBatchClassSchedules } from "@/services/scheduleService";
import { useAuth } from "@/contexts/AuthContext";
import { getClassRoutines, addClassRoutine, ClassRoutine } from "@/services/routinesService";
import Button from "@/components/ui/Button";

export default function SchedulePage() {
    const [scheduleData, setScheduleData] = useState<ClassSchedule[]>([]);
    const [routines, setRoutines] = useState<ClassRoutine[]>([]);
    // Batch Stats State
    const [batchStats, setBatchStats] = useState<Record<string, { subjectName: string; classCount: number }[]>>({});
    const [batchStatsLoading, setBatchStatsLoading] = useState(true);

    const [loading, setLoading] = useState(true);
    const [routinesLoading, setRoutinesLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [expandedPending, setExpandedPending] = useState<string | null>(null);
    const { userProfile, loading: authLoading } = useAuth();
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Add Routine Modal State
    const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
    const [newRoutineName, setNewRoutineName] = useState("");
    const [newRoutineDate, setNewRoutineDate] = useState("");
    const [newRoutineLink, setNewRoutineLink] = useState("");
    const [isAddingRoutine, setIsAddingRoutine] = useState(false);

    // Add Schedule Modal State
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isAddingSchedule, setIsAddingSchedule] = useState(false);
    const [gridRenderKey, setGridRenderKey] = useState(0); // Used only to force re-render on clear

    // View All Schedules State
    const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
    const [allSchedules, setAllSchedules] = useState<ClassSchedule[]>([]);
    const [allSchedulesLoading, setAllSchedulesLoading] = useState(false);

    const MAX_ROWS = 1000;
    const COLUMNS = ["date", "day", "batch", "subject", "time", "status", "teacherId", "teacherName", "extra1", "extra2"];

    // Store grid data in a ref — avoids triggering re-render on every cell edit
    const rowDataRef = useRef<Record<string, string>[]>([]);
    const gridRef = useRef<HTMLTableElement>(null);

    const initializeEmptyRows = () => {
        return Array.from({ length: MAX_ROWS }).map(() =>
            Object.fromEntries(COLUMNS.map(c => [c, ""]))
        );
    };

    // We can rely on service logic for "Today" so no need to calculate date strictly here 
    const today = new Date().toISOString().split('T')[0];

    // Fetch Class Schedule (Google Sheet & Firestore)
    const fetchScheduleData = async () => {
        if (authLoading || !userProfile) return;

        setLoading(true);
        try {
            if (userProfile.role === "admin") {
                const data = await getAllClassesSchedules();
                setScheduleData(data);
            } else if (userProfile.teacherId) {
                const data = await getClassesByTeacherId(userProfile.teacherId);
                setScheduleData(data);
            }
        } catch (error) {
            console.error("Error fetching schedule:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScheduleData();
    }, [userProfile, authLoading]);

    // Fetch Class Routines (Firestore)
    useEffect(() => {
        const fetchRoutines = async () => {
            setRoutinesLoading(true);
            const data = await getClassRoutines();
            setRoutines(data);
            setRoutinesLoading(false);
        };
        fetchRoutines();
    }, []);

    // Fetch Batch Stats (Google Sheet Backend)
    // Mock Batch Stats (Free Plan)
    useEffect(() => {
        const fetchBatchStats = async () => {
            setBatchStatsLoading(true);
            try {
                // Mock Data for faster loading/Free tier
                const mockData = {
                    "Batch_06": [
                        { subjectName: "Sales", classCount: 12 },
                        { subjectName: "Branding", classCount: 8 }
                    ],
                    "Batch_07": [
                        { subjectName: "Digital Marketing", classCount: 5 },
                        { subjectName: "Canva", classCount: 15 }
                    ]
                };

                // Simulate slight network delay for realism if needed, or just set it:
                setBatchStats(mockData);
            } catch (error) {
                console.error("Failed to fetch batch stats", error);
            } finally {
                setBatchStatsLoading(false);
            }
        };
        fetchBatchStats();
    }, []);

    // Filter out completed classes (past dates that are completed)
    // AND filter for current week
    const getWeekBoundaries = () => {
        const curr = new Date();
        const first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
        const last = first + 6; // last day is the first day + 6

        const firstday = new Date(curr.setDate(first));
        const lastday = new Date(curr.setDate(last));
        
        return {
            start: firstday.toISOString().split('T')[0],
            end: lastday.toISOString().split('T')[0]
        };
    };

    const weekBounds = getWeekBoundaries();

    const visibleSchedule = scheduleData.filter(schedule => {
        // Filter out completed past
        if (schedule.status === "Completed" && schedule.date < today) {
            return false;
        }

        // Normalize date format if needed to standard YYYY-MM-DD
        let compareDate = schedule.date;
        const dmyMatch = schedule.date.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (dmyMatch) {
             const [, d, m, y] = dmyMatch;
             compareDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }

        // Keep only within current week
        if (compareDate < weekBounds.start || compareDate > weekBounds.end) {
            return false;
        }

        return true;
    });

    const displayedSchedule = showAll ? visibleSchedule : visibleSchedule.slice(0, 5);

    const handleDoneClick = async (index: number) => {
        // Optimistic Update
        const targetSchedule = displayedSchedule[index];
        if (!targetSchedule) return;

        // Visual feedback immediately
        const updatedSchedule = [...scheduleData];
        // Find the correct item in full list (displayedSchedule is a slice)
        const realIndex = scheduleData.findIndex(s =>
            s.date === targetSchedule.date &&
            s.time === targetSchedule.time &&
            s.batch === targetSchedule.batch &&
            s.subject === targetSchedule.subject
        );

        if (realIndex === -1) return;

        // Optimistically set to completed
        const previousStatus = updatedSchedule[realIndex].status;
        updatedSchedule[realIndex] = { ...updatedSchedule[realIndex], status: "Completed" };
        setScheduleData(updatedSchedule);

        try {
            const res = await fetch('/api/schedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId: userProfile?.teacherId,
                    date: targetSchedule.date,
                    time: targetSchedule.time,
                    status: "Completed"
                })
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                // Revert if failed
                console.error("Failed to mark done:", json.error);
                alert("Failed to update status. Please try again.");
                updatedSchedule[realIndex] = { ...updatedSchedule[realIndex], status: previousStatus };
                setScheduleData([...updatedSchedule]);
            }
        } catch (error) {
            console.error("Network error marking done:", error);
            alert("Network error. Please check your connection.");
            updatedSchedule[realIndex] = { ...updatedSchedule[realIndex], status: previousStatus };
            setScheduleData([...updatedSchedule]);
        }
    };

    const handleRequestToComplete = async (schedule: ClassSchedule) => {
        setExpandedPending(null);
        if (!userProfile?.teacherId) return;

        const uniqueKey = `${schedule.date}-${schedule.time}-${schedule.batch}`;
        setProcessingId(uniqueKey);

        try {
            await requestClassCompletion(
                userProfile.teacherId,
                userProfile.displayName || "Teacher",
                schedule
            );

            // Optimistic update
            setScheduleData(prev => prev.map(s => {
                if (s.date === schedule.date && s.time === schedule.time && s.batch === schedule.batch) {
                    return { ...s, status: "Requested" as any };
                }
                return s;
            }));
        } catch (error) {
            console.error(error);
            alert("Failed to send request.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleAddRoutine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoutineName.trim() || !newRoutineDate.trim() || !newRoutineLink.trim()) return;
        if (!userProfile?.uid) {
            alert("No user ID found.");
            return;
        }

        setIsAddingRoutine(true);
        try {
            await addClassRoutine({
                title: newRoutineName,
                date: newRoutineDate,
                fileUrl: newRoutineLink,
                uploadedByUid: userProfile.uid,
                uploadedByName: userProfile.displayName || "Admin",
            });

            // Refresh routines
            setRoutinesLoading(true);
            const data = await getClassRoutines();
            setRoutines(data);
            setRoutinesLoading(false);

            resetRoutineForm();
        } catch (error) {
            console.error("Error adding routine:", error);
            alert("Failed to add routine. Please try again.");
        } finally {
            setIsAddingRoutine(false);
        }
    };

    const resetRoutineForm = () => {
        setIsRoutineModalOpen(false);
        setNewRoutineName("");
        setNewRoutineDate("");
        setNewRoutineLink("");
    };

    // Add Schedule Handlers
    // onBlur handler — updates ref without re-rendering
    const handleCellBlur = useCallback((rowIndex: number, field: string, value: string) => {
        if (rowDataRef.current[rowIndex]) {
            rowDataRef.current[rowIndex] = { ...rowDataRef.current[rowIndex], [field]: value };
        }
    }, []);

    const handleClearScheduleRows = () => {
        if (confirm("Are you sure you want to clear all data in the table?")) {
            rowDataRef.current = initializeEmptyRows();
            // Clear all DOM inputs directly for instant feedback
            if (gridRef.current) {
                gridRef.current.querySelectorAll('input[data-row]').forEach((el) => {
                    (el as HTMLInputElement).value = "";
                });
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRowIndex: number, startColKey: string) => {
        e.preventDefault();
        
        const clipboardData = e.clipboardData.getData('Text');
        if (!clipboardData) return;

        // Excel/Sheets copies as Tab-Separated Values (TSV)
        const pastedLines = clipboardData.split(/\r?\n/).filter(line => line.length > 0);
        
        const startColIndex = COLUMNS.indexOf(startColKey);
        if (startColIndex === -1) return;

        pastedLines.forEach((line, lineIndex) => {
            const cells = line.split('\t');
            const targetRowIndex = startRowIndex + lineIndex;
            
            if (targetRowIndex >= MAX_ROWS) return;

            cells.forEach((cellValue, cellIndex) => {
                const targetColIndex = startColIndex + cellIndex;
                if (targetColIndex < COLUMNS.length) {
                    const fieldKey = COLUMNS[targetColIndex];
                    
                    // 1. Update ref (source of truth for Save)
                    if (rowDataRef.current[targetRowIndex]) {
                        rowDataRef.current[targetRowIndex] = {
                            ...rowDataRef.current[targetRowIndex],
                            [fieldKey]: cellValue
                        };
                    }

                    // 2. Update DOM directly (instant visual feedback, no re-render)
                    const input = gridRef.current?.querySelector<HTMLInputElement>(
                        `input[data-row="${targetRowIndex}"][data-col="${fieldKey}"]`
                    );
                    if (input) input.value = cellValue;
                }
            });
        });
    };

    const handleSaveSchedule = async () => {
        setIsAddingSchedule(true);
        try {
            // Read from ref (contains all current data regardless of re-renders)
            await addBatchClassSchedules(rowDataRef.current as any[]);
            
            // Refresh schedule list
            await fetchScheduleData();
            setIsScheduleModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Failed to save schedules. Please try again.");
        } finally {
            setIsAddingSchedule(false);
        }
    };

    const getStatusBadge = (schedule: ClassSchedule, index: number) => {
        if (schedule.status === "Today") {
            return (
                <button
                    onClick={() => handleDoneClick(index)}
                    className="px-4 py-1.5 bg-[#059669] text-white text-sm font-medium rounded-full hover:bg-[#10b981] transition-colors"
                >
                    Done
                </button>
            );
        }

        if (schedule.status === "Pending") {
            const uniqueKey = `${schedule.date}-${schedule.time}-${schedule.batch}`; // Better uniqueness using batch
            const isProcessing = processingId === uniqueKey;

            return (
                <div className="inline-block relative">
                    {/* Show Request Button Above when expanded */}
                    {expandedPending === uniqueKey && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 animate-fadeIn z-10">
                            <button
                                onClick={() => handleRequestToComplete(schedule)}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-[#059669] text-white text-sm font-semibold rounded-lg hover:bg-[#10b981] transition-colors whitespace-nowrap shadow-md"
                            >
                                {isProcessing ? "Sending..." : "Request to Complete"}
                            </button>
                        </div>
                    )}

                    {/* Pending Pill with Arrow */}
                    <button
                        onClick={() => setExpandedPending(expandedPending === uniqueKey ? null : uniqueKey)}
                        className="px-4 py-1.5 bg-[#f59e0b] text-white text-sm font-medium rounded-full hover:bg-[#fb923c] transition-colors inline-flex items-center gap-2"
                    >
                        Pending
                        <svg
                            className={`w-3 h-3 transition-transform ${expandedPending === uniqueKey ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            );
        }

        // New 'Requested' State
        if ((schedule.status as any) === "Requested") {
            return (
                <span className="px-4 py-1.5 bg-[#fcd34d] text-yellow-800 text-sm font-medium rounded-full cursor-not-allowed opacity-80">
                    Requested
                </span>
            );
        }

        if (schedule.status === "Completed") {
            return (
                <span className="px-4 py-1.5 bg-[#10b981] text-white text-sm font-medium rounded-full">
                    Completed
                </span>
            );
        }

        // Upcoming
        return (
            <span className="px-4 py-1.5 bg-[#6b7280] text-white text-sm font-medium rounded-full">
                Upcoming
            </span>
        );
    };

    if (authLoading) {
        return <div className="p-8 text-center text-[#6b7280]">Loading profile...</div>;
    }

    if (!userProfile?.teacherId && userProfile?.role !== "admin") {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-[#6b7280] bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="p-3 bg-yellow-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-[#1f2937] mb-2">Teacher ID Missing</h2>
                <p className="max-w-md mx-auto">Your account is not linked to any Teacher ID. Please ask the administrator to update your profile with your ID.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Green Accent */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">
                            Class Schedule
                        </h1>
                        <p className="text-[#6b7280] mt-1">
                            {userProfile.role === "admin" 
                                ? "Viewing schedule for all teachers (Current Week)" 
                                : `Viewing schedule for Teacher ID: ${userProfile.teacherId} (Current Week)`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {userProfile?.role === "admin" && (
                        <button 
                            onClick={() => {
                                rowDataRef.current = initializeEmptyRows();
                                setIsScheduleModalOpen(true);
                                setGridRenderKey(k => k + 1); // Ensure fresh render
                            }}
                            className="px-4 py-2.5 bg-[#059669] text-white text-sm font-semibold rounded-lg hover:bg-[#10b981] transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Class Schedule
                        </button>
                    )}
                    {/* Admin-only: Add Routine */}
                    {userProfile?.role === "admin" && (
                        <button 
                            onClick={() => setIsRoutineModalOpen(true)}
                            className="px-4 py-2.5 bg-white text-[#059669] border border-[#059669] text-sm font-semibold rounded-lg hover:bg-[#f0fdf4] transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Class Routine
                        </button>
                    )}
                </div>
            </div>

            {/* Schedule Table */}
            <Card>
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[#1e3a5f]">
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278]">
                                        Date
                                    </th>
                                    <th className="hidden md:table-cell px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278]">
                                        Day
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278]">
                                        Batch
                                    </th>
                                    <th className="hidden md:table-cell px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278]">
                                        Subject
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278]">
                                        Time
                                    </th>
                                    <th className="hidden md:table-cell px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278]">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-[#6b7280]">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669] mb-2"></div>
                                            <p>Loading schedule from Sheet...</p>
                                        </td>
                                    </tr>
                                ) : displayedSchedule.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-[#6b7280]">
                                            <p className="text-lg font-medium text-gray-900">No classes found</p>
                                            <p className="text-sm mt-1">No scheduled classes found for the current week.</p>
                                        </td>
                                    </tr>
                                ) : displayedSchedule.map((schedule, index) => (
                                    <tr
                                        key={index}
                                        className={schedule.status === "Today" ? "bg-[#d1fae5]/30" : index % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}
                                    >
                                        <td className="px-6 py-4 text-sm text-[#1f2937] font-medium border border-[#e5e7eb] text-center">
                                            {formatDateShort(schedule.date)}
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 text-sm text-[#1f2937] border border-[#e5e7eb] text-center">
                                            {schedule.day}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#1f2937] font-medium border border-[#e5e7eb] text-center">
                                            {schedule.batch}
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 text-sm text-[#1f2937] border border-[#e5e7eb] text-center">
                                            {schedule.subject}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#374151] border border-[#e5e7eb] text-center">
                                            {schedule.time}
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 border border-[#e5e7eb] text-center">
                                            {getStatusBadge(schedule, index)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            {/* See More / See Less Button */}
            {!loading && visibleSchedule.length > 5 && (
                <div className="flex justify-center">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="px-8 py-3 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors text-base shadow-sm"
                    >
                        {showAll ? "See Less ↑" : `See More (${visibleSchedule.length - 5} more classes) →`}
                    </button>
                </div>
            )}

            {/* View All Schedules Button */}
            {!loading && (
                <div className="flex justify-center mt-2">
                    <button
                        onClick={async () => {
                            setIsViewAllModalOpen(true);
                            setAllSchedulesLoading(true);
                            try {
                                // Fetch all schedules for this teacher (admin sees all)
                                let data: ClassSchedule[] = [];
                                if (userProfile?.role === 'admin') {
                                    data = await getAllClassesSchedules();
                                } else if (userProfile?.teacherId) {
                                    data = await getClassesByTeacherId(userProfile.teacherId);
                                }
                                // No week filter — show all
                                setAllSchedules(data.sort((a, b) => a.date > b.date ? -1 : 1));
                            } catch (e) {
                                console.error(e);
                            } finally {
                                setAllSchedulesLoading(false);
                            }
                        }}
                        className="px-6 py-2.5 bg-white text-[#1e3a5f] border border-[#1e3a5f] text-sm font-semibold rounded-lg hover:bg-[#f0f4ff] transition-colors shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        View All Your Class Schedules
                    </button>
                </div>
            )}

            {/* Class Routine Section */}
            <div className="mt-12">
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h2 className="text-3xl font-bold text-[#1f2937]">
                            Class Routine
                        </h2>
                        <p className="text-[#6b7280] mt-1">
                            View full class routine
                        </p>
                    </div>
                </div>

                {/* Routine Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routinesLoading ? (
                        // Skeleton / Loading State
                        [1, 2, 3].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardBody className="p-6">
                                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                                </CardBody>
                            </Card>
                        ))
                    ) : routines.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-[#6b7280] bg-white rounded-lg border border-gray-100 italic">
                            No class routines uploaded yet.
                        </div>
                    ) : (
                        routines.map((routine) => (
                            <Card key={routine.id} className="hover:shadow-lg transition-shadow border border-gray-100">
                                <CardBody className="p-6">
                                    {/* Title */}
                                    <h3 className="text-lg font-bold text-[#1f2937] mb-6">
                                        {routine.title}
                                    </h3>

                                    {/* Meta Information */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                            <span className="truncate">Uploaded by: {routine.uploadedByName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                            </svg>
                                            <span>Date: {routine.date !== "N/A" ? routine.date : formatDateShort(routine.createdAt.toISOString())}</span>
                                        </div>
                                    </div>

                                    {/* View Button */}
                                    <a
                                        href={routine.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full"
                                    >
                                        <button className="w-full py-3 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors">
                                            View / Download
                                        </button>
                                    </a>
                                </CardBody>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Batch-wise Class Count Section */}
            <div className="mt-12">
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h2 className="text-3xl font-bold text-[#1f2937]">
                            Batch-wise Class Count
                        </h2>
                        <p className="text-[#6b7280] mt-1">
                            Track classes taken per subject for each batch
                        </p>
                    </div>
                </div>

                {/* Dynamic Batch Tables */}
                {Object.keys(batchStats).length === 0 && !loading && !batchStatsLoading ? (
                    <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-100 italic">
                        No batch data found. Please ensure tabs are named &apos;Batch_06&apos;, etc.
                    </div>
                ) : (
                    Object.keys(batchStats).sort().map(batchName => {
                        const subjects = batchStats[batchName];

                        return (
                            <div key={batchName} className="mb-8">
                                <h3 className="text-xl font-semibold text-[#1f2937] mb-3">{batchName}</h3>
                                <Card>
                                    <CardBody className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-[#1e3a5f]">
                                                        <th className="px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278] w-20">
                                                            #
                                                        </th>
                                                        <th className="px-6 py-4 text-start text-sm font-semibold text-white border border-[#2d5278]">
                                                            Subject Name
                                                        </th>
                                                        <th className="px-6 py-4 text-center text-sm font-semibold text-white border border-[#2d5278] w-48">
                                                            Classes Taken
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {batchStatsLoading ? (
                                                        [1, 2, 3].map(i => (
                                                            <tr key={i} className="animate-pulse bg-white">
                                                                <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                                                                <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                                                <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div></td>
                                                            </tr>
                                                        ))
                                                    ) : subjects.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="px-6 py-8 text-center text-gray-500 italic">
                                                                No classes found for this batch.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        subjects.map((subject, idx) => (
                                                            <tr
                                                                key={subject.subjectName}
                                                                className={idx % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}
                                                            >
                                                                <td className="px-6 py-3 text-sm text-[#1f2937] font-medium border border-[#e5e7eb] text-center">
                                                                    {idx + 1}
                                                                </td>
                                                                <td className="px-6 py-3 text-sm text-[#1f2937] border border-[#e5e7eb]">
                                                                    {subject.subjectName}
                                                                </td>
                                                                <td className="px-6 py-3 text-sm text-[#1f2937] font-semibold border border-[#e5e7eb] text-center">
                                                                    {subject.classCount}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        );
                    })
                )}
            </div>

            {/* View All Schedules Modal */}
            {isViewAllModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsViewAllModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0 bg-[#1e3a5f] rounded-t-xl">
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {userProfile?.role === 'admin' ? 'All Class Schedules' : 'Your Full Class Schedule'}
                                </h3>
                                <p className="text-blue-200 text-sm mt-0.5">
                                    {userProfile?.role === 'admin' ? 'Read-only view of all schedules' : `All classes for Teacher ID: ${userProfile?.teacherId}`}
                                </p>
                            </div>
                            <button onClick={() => setIsViewAllModalOpen(false)} className="text-blue-200 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto">
                            {allSchedulesLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center text-gray-500">
                                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#059669] mb-3"></div>
                                        <p className="font-medium">Loading all schedules...</p>
                                    </div>
                                </div>
                            ) : allSchedules.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <div className="text-center">
                                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <p className="font-medium text-gray-700">No schedules found</p>
                                        <p className="text-sm mt-1">No class schedules have been added yet.</p>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full border-collapse">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-[#1e3a5f]">
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278]">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[90px]">Day</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Batch</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[130px]">Subject</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Time</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Status</th>
                                            {userProfile?.role === 'admin' && (
                                                <>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Teacher ID</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[130px]">Teacher Name</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allSchedules.map((sch, idx) => (
                                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-4 py-2.5 text-xs text-gray-400 border border-gray-200 select-none">{idx + 1}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-800 border border-gray-200 font-medium">{formatDateShort(sch.date)}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-700 border border-gray-200">{sch.day}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-800 border border-gray-200 font-medium">{sch.batch}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-700 border border-gray-200">{sch.subject}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-700 border border-gray-200">{sch.time}</td>
                                                <td className="px-4 py-2.5 border border-gray-200">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        sch.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                        sch.status === 'Today' ? 'bg-blue-100 text-blue-800' :
                                                        sch.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {sch.status}
                                                    </span>
                                                </td>
                                                {userProfile?.role === 'admin' && (
                                                    <>
                                                        <td className="px-4 py-2.5 text-sm text-[#059669] border border-gray-200 font-mono">{sch.teacherId}</td>
                                                        <td className="px-4 py-2.5 text-sm text-gray-700 border border-gray-200">{sch.teacherName}</td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-between items-center shrink-0 bg-gray-50 rounded-b-xl">
                            <span className="text-sm text-gray-500">{allSchedules.length} total schedule entries</span>
                            <Button variant="outline" onClick={() => setIsViewAllModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Routine Modal */}
            {isRoutineModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={resetRoutineForm}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">
                                Add Class Routine
                            </h3>
                            <button
                                onClick={resetRoutineForm}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddRoutine} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newRoutineName}
                                    onChange={(e) => setNewRoutineName(e.target.value)}
                                    placeholder="e.g. Batch - 06 Routine"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#059669] focus:border-[#059669] outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={newRoutineDate}
                                    onChange={(e) => setNewRoutineDate(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#059669] focus:border-[#059669] outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Uploaded by</label>
                                <input
                                    type="text"
                                    value={userProfile?.displayName || "Admin"}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">Default name of the logged-in admin</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Link (Drive Link)</label>
                                <input
                                    type="url"
                                    value={newRoutineLink}
                                    onChange={(e) => setNewRoutineLink(e.target.value)}
                                    placeholder="https://drive.google.com/..."
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#059669] focus:border-[#059669] outline-none transition-all"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={resetRoutineForm}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isAddingRoutine}
                                    className="w-full bg-[#059669] hover:bg-[#047857] text-white"
                                >
                                    {isAddingRoutine ? "Saving..." : "Add Routine"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Schedule Modal */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={() => setIsScheduleModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col my-8" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 rounded-t-xl shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Add Class Schedule</h3>
                                <p className="text-sm text-gray-500 mt-1">Paste directly from Excel anywhere in the grid. Empty rows will be ignored. Grid holds up to {MAX_ROWS} rows.</p>
                            </div>
                            <div className="flex gap-4 items-center">
                                <button onClick={handleClearScheduleRows} className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1.5 border border-red-200 rounded">
                                    Clear Grid
                                </button>
                                <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-4 bg-gray-50">
                            <table ref={gridRef} className="w-full border-collapse bg-white shadow-sm">
                                <thead className="sticky top-0 z-20 shadow-sm">
                                    <tr className="bg-[#1e3a5f]">
                                        <th className="w-12 px-2 py-2 text-center text-xs font-semibold text-white border border-[#2d5278]">#</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[110px]">Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Day</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[110px]">Batch</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[130px]">Subject</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Time</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Status</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Teacher ID</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[130px]">Teacher Name</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Extra 1</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Extra 2</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: MAX_ROWS }).map((_, idx) => (
                                        <tr key={idx} className="bg-white hover:bg-gray-50 transition-colors group">
                                            <td className="p-1 border border-gray-200 text-center text-xs text-gray-400 bg-gray-50 select-none">
                                                {idx + 1}
                                            </td>
                                            {COLUMNS.map(col => (
                                                <td key={col} className={`p-0 border border-gray-200 ${col === 'extra1' || col === 'extra2' ? 'bg-gray-50/50' : ''}`}>
                                                    <input
                                                        type="text"
                                                        defaultValue={rowDataRef.current[idx]?.[col] ?? ""}
                                                        data-row={idx}
                                                        data-col={col}
                                                        placeholder={col === 'status' ? 'Scheduled' : ''}
                                                        onBlur={e => handleCellBlur(idx, col, e.target.value)}
                                                        onPaste={(e) => handlePaste(e, idx, col)}
                                                        className={`w-full p-2 bg-transparent text-sm focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 outline-none placeholder:text-gray-300 ${col === 'teacherId' ? 'font-mono text-[#059669]' : ''} ${col === 'extra1' || col === 'extra2' ? 'text-gray-500' : ''}`}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 rounded-b-xl bg-white sticky bottom-0 z-10 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveSchedule} disabled={isAddingSchedule} className="bg-[#059669] hover:bg-[#047857] text-white px-8">
                                {isAddingSchedule ? "Saving Data..." : "Save Schedules"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Animation Styles */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </div>
    );
}
