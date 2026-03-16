"use client";

import { useState, useEffect } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import { formatDateShort } from "@/lib/utils";
import { 
    getAllPolicies, 
    getAllMeetingMinutes, 
    addPolicy, 
    addMeetingMinute, 
    updatePolicy,
    deletePolicy,
    updateMeetingMinute,
    deleteMeetingMinute,
    Policy, 
    MeetingMinute 
} from "@/services/policyService";
import { useAuth } from "@/contexts/AuthContext";

export default function PoliciesPage() {
    const { user, userProfile } = useAuth();
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [meetings, setMeetings] = useState<MeetingMinute[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Editing states
    const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
    const [editingMeeting, setEditingMeeting] = useState<MeetingMinute | null>(null);

    // Form states
    const [newMeeting, setNewMeeting] = useState({
        title: "",
        meetingNumber: "",
        fileUrl: "",
    });

    const [newPolicy, setNewPolicy] = useState({
        title: "",
        version: "",
        fileUrl: "",
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [policiesData, meetingsData] = await Promise.all([
                getAllPolicies(),
                getAllMeetingMinutes()
            ]);
            setPolicies(policiesData);
            setMeetings(meetingsData);
        } catch (error) {
            console.error("Failed to load policies data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle add/edit meeting minute
    const handleAddMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in.");
            return;
        }

        setIsSubmitting(true);
        try {
            const meetingData = {
                title: newMeeting.title,
                meetingNumber: newMeeting.meetingNumber,
                fileUrl: newMeeting.fileUrl,
            };

            if (editingMeeting) {
                await updateMeetingMinute(editingMeeting.id, meetingData);
            } else {
                await addMeetingMinute(meetingData);
            }

            await fetchData();
            handleCloseMeetingModal();
        } catch (error) {
            console.error("Failed to save meeting minute", error);
            alert("Failed to save meeting minute. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle add/edit policy
    const handleAddPolicy = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in.");
            return;
        }

        setIsSubmitting(true);
        try {
            const policyData = {
                title: newPolicy.title,
                version: newPolicy.version,
                fileUrl: newPolicy.fileUrl,
            };

            if (editingPolicy) {
                await updatePolicy(editingPolicy.id, policyData);
            } else {
                await addPolicy(policyData);
            }

            await fetchData();
            handleClosePolicyModal();
        } catch (error) {
            console.error("Failed to save policy", error);
            alert("Failed to save policy. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditPolicyClick = (policy: Policy) => {
        setEditingPolicy(policy);
        setNewPolicy({
            title: policy.title,
            version: policy.version,
            fileUrl: policy.fileUrl,
        });
        setIsPolicyModalOpen(true);
    };

    const handleDeletePolicyClick = async (id: string, title: string) => {
        if (confirm(`Are you sure you want to delete policy "${title}"?`)) {
            try {
                await deletePolicy(id);
                await fetchData();
            } catch (error) {
                console.error("Failed to delete policy", error);
                alert("Failed to delete policy. Please try again.");
            }
        }
    };

    const handleEditMeetingClick = (meeting: MeetingMinute) => {
        setEditingMeeting(meeting);
        setNewMeeting({
            title: meeting.title,
            meetingNumber: meeting.meetingNumber,
            fileUrl: meeting.fileUrl,
        });
        setIsMeetingModalOpen(true);
    };

    const handleDeleteMeetingClick = async (id: string, title: string) => {
        if (confirm(`Are you sure you want to delete meeting minutes "${title}"?`)) {
            try {
                await deleteMeetingMinute(id);
                await fetchData();
            } catch (error) {
                console.error("Failed to delete meeting minutes", error);
                alert("Failed to delete meeting minutes. Please try again.");
            }
        }
    };

    const handleCloseMeetingModal = () => {
        setIsMeetingModalOpen(false);
        setEditingMeeting(null);
        setNewMeeting({ title: "", meetingNumber: "", fileUrl: "" });
    };

    const handleClosePolicyModal = () => {
        setIsPolicyModalOpen(false);
        setEditingPolicy(null);
        setNewPolicy({ title: "", version: "", fileUrl: "" });
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">
                            Policies & Meeting Minutes
                        </h1>
                        <p className="text-[#6b7280] mt-1">
                            Access institutional policies and meeting records
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsMeetingModalOpen(true)}
                        className="px-4 py-2 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors inline-flex items-center gap-2"
                    >
                        <span className="text-lg">+</span>
                        Add Meeting Minutes
                    </button>
                    <button
                        onClick={() => setIsPolicyModalOpen(true)}
                        className="px-4 py-2 bg-[#3b82f6] text-white font-semibold rounded-lg hover:bg-[#2563eb] transition-colors inline-flex items-center gap-2"
                    >
                        <span className="text-lg">+</span>
                        Add Policy
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
                    <p className="mt-4 text-[#6b7280]">Loading documents...</p>
                </div>
            ) : (
                <>
                    {/* Meeting Minutes Section */}
                    {meetings.length > 0 && (
                        <div className="space-y-4">
                            {/* Section Heading */}
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-[#059669] rounded-full"></div>
                                <h2 className="text-2xl font-bold text-[#1f2937]">
                                    Meeting Minutes
                                </h2>
                            </div>

                            {/* Meeting Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {meetings.map((meeting) => (
                                    <Card key={meeting.id} className="hover:shadow-lg transition-shadow h-full relative group">
                                        <CardBody className="p-6 flex flex-col h-full">
                                            {/* Admin Controls (Top-Right) */}
                                            {userProfile?.role === "admin" && (
                                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleEditMeetingClick(meeting);
                                                        }}
                                                        className="p-1.5 bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleDeleteMeetingClick(meeting.id, meeting.title);
                                                        }}
                                                        className="p-1.5 bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                            {/* Meeting Icon */}
                                            <div className="mb-4">
                                                <div className="w-12 h-14 bg-[#f3f4f6] rounded-lg flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-[#059669]" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-lg font-semibold text-[#1f2937] mb-3">
                                                {meeting.title}
                                            </h3>

                                            {/* Meta Information */}
                                            <div className="space-y-2 mb-4 mt-auto">
                                                <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>Date: {formatDateShort(meeting.date)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                                    </svg>
                                                    <span className="px-2 py-1 bg-[#d1fae5] text-[#059669] rounded text-xs font-semibold">
                                                        {meeting.meetingNumber}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <a
                                                href={meeting.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full text-center px-4 py-3 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors"
                                            >
                                                View Minutes
                                            </a>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Policies Section */}
                    {policies.length > 0 && (
                        <div className="space-y-4">
                            {/* Section Heading */}
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-[#059669] rounded-full"></div>
                                <h2 className="text-2xl font-bold text-[#1f2937]">
                                    Policies
                                </h2>
                            </div>

                            {/* Policy Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {policies.map((policy) => (
                                    <Card key={policy.id} className="hover:shadow-lg transition-shadow h-full relative group">
                                        <CardBody className="p-6 flex flex-col h-full">
                                            {/* Admin Controls (Top-Right) */}
                                            {userProfile?.role === "admin" && (
                                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleEditPolicyClick(policy);
                                                        }}
                                                        className="p-1.5 bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleDeletePolicyClick(policy.id, policy.title);
                                                        }}
                                                        className="p-1.5 bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                            {/* Document Icon */}
                                            <div className="mb-4">
                                                <div className="w-12 h-14 bg-[#f3f4f6] rounded-lg flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-[#059669]" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-lg font-semibold text-[#1f2937] mb-3">
                                                {policy.title}
                                            </h3>

                                            {/* Meta Information */}
                                            <div className="space-y-2 mb-4 mt-auto">
                                                <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>Date: {formatDateShort(policy.date)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="px-2 py-1 bg-[#dbeafe] text-[#1e40af] rounded text-xs font-semibold">
                                                        {policy.version}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <a
                                                href={policy.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full text-center px-4 py-3 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors"
                                            >
                                                View Document
                                            </a>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {policies.length === 0 && meetings.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
                            <p className="mt-1 text-gray-500">Policies and meeting records will appear here.</p>
                        </div>
                    )}
                </>
            )}

            {/* Add Meeting Minutes Modal */}
            {isMeetingModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-[#1f2937]">
                                {editingMeeting ? "Edit Meeting Minutes" : "Add Meeting Minutes"}
                            </h2>
                            <button
                                onClick={handleCloseMeetingModal}
                                className="text-[#6b7280] hover:text-[#1f2937]"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddMeeting} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newMeeting.title}
                                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                                    placeholder="e.g., 1st Meeting Minutes"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                    Meeting Number *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newMeeting.meetingNumber}
                                    onChange={(e) => setNewMeeting({ ...newMeeting, meetingNumber: e.target.value })}
                                    placeholder="e.g., 1st Meeting"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                    Document URL (Google Drive Link) *
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={newMeeting.fileUrl}
                                    onChange={(e) => setNewMeeting({ ...newMeeting, fileUrl: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseMeetingModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? (editingMeeting ? "Updating..." : "Adding...") : (editingMeeting ? "Update Minutes" : "Add Meeting Minutes")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Policy Modal */}
            {isPolicyModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-[#1f2937]">
                                {editingPolicy ? "Edit Policy" : "Add Policy"}
                            </h2>
                            <button
                                onClick={handleClosePolicyModal}
                                className="text-[#6b7280] hover:text-[#1f2937]"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddPolicy} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                    Policy Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newPolicy.title}
                                    onChange={(e) => setNewPolicy({ ...newPolicy, title: e.target.value })}
                                    placeholder="e.g., HR Guidelines"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                    Version *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newPolicy.version}
                                    onChange={(e) => setNewPolicy({ ...newPolicy, version: e.target.value })}
                                    placeholder="e.g., v1.0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                    Document URL (Google Drive Link) *
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={newPolicy.fileUrl}
                                    onChange={(e) => setNewPolicy({ ...newPolicy, fileUrl: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClosePolicyModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-[#3b82f6] text-white font-semibold rounded-lg hover:bg-[#2563eb] transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? (editingPolicy ? "Updating..." : "Adding...") : (editingPolicy ? "Update Policy" : "Add Policy")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
