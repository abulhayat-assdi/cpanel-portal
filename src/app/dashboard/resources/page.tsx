"use client";

import { useState, useEffect } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import { formatDateShort } from "@/lib/utils";
import { getAllResources, addResource, updateResource, deleteResource, Resource } from "@/services/resourceService";
import { useAuth } from "@/contexts/AuthContext";

// Categories definition
const categories: Resource["category"][] = [
    "Course Module",
    "Class Routine",
    "Notes",
    "Assignment",
    "Exam / Practice"
];

export default function ResourcesPage() {
    const { user, userProfile } = useAuth();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);

    // Form state
    const [newResource, setNewResource] = useState({
        title: "",
        category: "Course Module" as Resource["category"],
        description: "",
        fileUrl: "",
    });

    // Fetch resources on mount
    const fetchResources = async () => {
        try {
            const data = await getAllResources();
            setResources(data);
        } catch (error) {
            console.error("Failed to load resources", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    // Group resources by category
    const groupedResources = categories.map(category => ({
        category,
        resources: resources.filter(r => r.category === category)
    }));

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            alert("You must be logged in to manage resources.");
            return;
        }

        setIsSubmitting(true);
        try {
            const resourceData = {
                title: newResource.title,
                category: newResource.category,
                uploadedByUid: editingResource ? editingResource.uploadedByUid : user.uid,
                uploadedByName: editingResource ? editingResource.uploadedByName : (userProfile?.displayName || user.displayName || "Unknown Teacher"),
                description: newResource.description?.trim() || undefined,
                fileUrl: newResource.fileUrl,
            };

            if (editingResource) {
                await updateResource(editingResource.id, resourceData);
            } else {
                await addResource(resourceData);
            }

            // Refresh list
            await fetchResources();

            // Reset form
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save resource", error);
            alert("Failed to save resource. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (resource: Resource) => {
        setEditingResource(resource);
        setNewResource({
            title: resource.title,
            category: resource.category,
            description: resource.description || "",
            fileUrl: resource.fileUrl,
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (id: string, title: string) => {
        if (confirm(`Are you sure you want to delete "${title}"?`)) {
            try {
                await deleteResource(id);
                await fetchResources();
            } catch (error) {
                console.error("Failed to delete resource", error);
                alert("Failed to delete resource. Please try again.");
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingResource(null);
        setNewResource({
            title: "",
            category: "Course Module",
            description: "",
            fileUrl: "",
        });
    };

    // Helper to get direct image URL from Google Drive link (reusing logic if needed, but for files we usually just open them)
    // For file resources, we just open the link.

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">
                            Resource Library
                        </h1>
                        <p className="text-[#6b7280] mt-1">
                            Access teaching materials, documents, and resources
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors inline-flex items-center gap-2"
                >
                    <span className="text-lg">+</span>
                    Add Resource
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
                    <p className="mt-4 text-[#6b7280]">Loading resources...</p>
                </div>
            ) : resources.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900">No resources yet</h3>
                    <p className="mt-1 text-gray-500">Get started by adding a new resource.</p>
                </div>
            ) : (
                /* Category-wise Resource Sections */
                groupedResources.map(({ category, resources: categoryResources }) => (
                    categoryResources.length > 0 && (
                        <div key={category} className="space-y-4">
                            {/* Category Heading */}
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-[#059669] rounded-full"></div>
                                <h2 className="text-2xl font-bold text-[#1f2937]">
                                    {category}
                                </h2>
                            </div>

                            {/* Resource Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {categoryResources.map((resource) => (
                                    <Card key={resource.id} className="hover:shadow-lg transition-shadow h-full relative group">
                                        <CardBody className="p-6 flex flex-col h-full">
                                            {/* Admin Controls (Top-Right) */}
                                            {userProfile?.role === "admin" && (
                                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleEditClick(resource);
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
                                                            handleDeleteClick(resource.id, resource.title);
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
                                            {/* Title */}
                                            <h3 className="text-lg font-semibold text-[#1f2937] mb-3">
                                                {resource.title}
                                            </h3>

                                            {/* Description */}
                                            {resource.description && (
                                                <p className="text-sm text-[#6b7280] mb-4 line-clamp-2 flex-grow">
                                                    {resource.description}
                                                </p>
                                            )}

                                            {/* Meta Information */}
                                            <div className="space-y-2 mb-4 mt-auto">
                                                <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>Uploaded by: {resource.uploadedByName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>Date: {formatDateShort(resource.uploadDate)}</span>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <a
                                                href={resource.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full text-center px-4 py-3 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors"
                                            >
                                                View / Download
                                            </a>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )
                ))
            )}

            {/* Add Resource Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-[#1f2937]">
                                {editingResource ? "Edit Resource" : "Add Resource"}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-[#6b7280] hover:text-[#1f2937]"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddResource} className="space-y-4">
                            {/* Resource Title */}
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-2">
                                    Resource Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newResource.title}
                                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                    placeholder="Enter resource title"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-2">
                                    Category *
                                </label>
                                <select
                                    required
                                    value={newResource.category}
                                    onChange={(e) => setNewResource({ ...newResource, category: e.target.value as Resource["category"] })}
                                    className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                >
                                    <option value="Course Module">Course Module</option>
                                    <option value="Class Routine">Class Routine</option>
                                    <option value="Notes">Notes</option>
                                    <option value="Assignment">Assignment</option>
                                    <option value="Exam / Practice">Exam / Practice</option>
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={newResource.description}
                                    onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                    placeholder="Brief description of the resource"
                                    rows={3}
                                />
                            </div>

                            {/* File Upload or External Link */}
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-2">
                                    File URL / Drive Link *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newResource.fileUrl}
                                    onChange={(e) => setNewResource({ ...newResource, fileUrl: e.target.value })}
                                    className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                    placeholder="Enter Google Drive or external link"
                                />
                                <p className="text-xs text-[#6b7280] mt-1">
                                    Paste the sharing link from Google Drive here.
                                </p>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 border border-[#e5e7eb] text-[#6b7280] font-medium rounded-lg hover:bg-[#f9fafb] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? (editingResource ? "Updating..." : "Adding...") : (editingResource ? "Update Resource" : "Add Resource")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
