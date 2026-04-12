"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllResources, Resource } from "@/services/resourceService";
import {
    getModuleResourcesByTitle,
    getModuleResourcesByFolder,
    getModuleResourcesByModuleRoot,
    ModuleResource,
} from "@/services/moduleResourceService";
import {
    getModuleFoldersByModule,
    ModuleFolder,
} from "@/services/moduleFolderService";
import { useAuth } from "@/contexts/AuthContext";

// ─── Icons ──────────────────────────────────────────────────────────────────
const FolderIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m19.5 0v5.25a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 19.5V6" />
    </svg>
);
const FolderOpenIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
    </svg>
);
const EyeIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);
const DownloadIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);
const ChevronLeftIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fileTypeIcon = (ft: string) => {
    if (ft === "pdf") return "📄";
    if (["pptx", "ppt"].includes(ft)) return "📊";
    if (["docx", "doc"].includes(ft)) return "📃";
    if (ft === "image") return "🖼️";
    return "📎";
};
const resourceTypeIcon: Record<string, string> = {
    Presentation: "📊", Notes: "📝", Assignment: "📋", Practice: "🎯", Other: "📎",
};

// ─── Types ───────────────────────────────────────────────────────────────────
type ViewState =
    | { level: "modules" }
    | { level: "folders"; module: Resource }
    | { level: "files"; module: Resource; folder: ModuleFolder };

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════
export default function StudentResourcePage() {
    const { userProfile } = useAuth();
    const studentBatch = userProfile?.studentBatchName || "";

    // ─── View State (3-level navigation) ─────────────────────────────────────
    const [view, setView] = useState<ViewState>({ level: "modules" });

    // ─── Data ─────────────────────────────────────────────────────────────────
    const [courseModules, setCourseModules] = useState<Resource[]>([]);
    const [modulesLoading, setModulesLoading] = useState(true);

    const [visibleFolders, setVisibleFolders] = useState<ModuleFolder[]>([]);
    const [rootFiles, setRootFiles] = useState<ModuleResource[]>([]);
    const [foldersLoading, setFoldersLoading] = useState(false);

    const [folderFiles, setFolderFiles] = useState<ModuleResource[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);

    // ─── Load Modules ─────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const data = await getAllResources();
                setCourseModules(data.filter(r => r.category === "Course Module"));
            } catch (e) {
                console.error(e);
            } finally {
                setModulesLoading(false);
            }
        };
        load();
    }, []);

    // ─── Helper: batch filter ─────────────────────────────────────────────────
    const isVisibleForBatch = (visibleForBatches: string[]) => {
        if (visibleForBatches.includes("all")) return true;
        if (studentBatch && visibleForBatches.includes(studentBatch)) return true;
        return false;
    };

    // ─── Open Module (show folders + root files) ──────────────────────────────
    const openModule = useCallback(async (module: Resource) => {
        setView({ level: "folders", module });
        setFoldersLoading(true);
        try {
            const [folders, allModuleFiles] = await Promise.all([
                getModuleFoldersByModule(module.id),
                getModuleResourcesByModuleRoot(module.title),
            ]);
            // Filter folders: not hidden AND visible for this batch
            const filteredFolders = folders.filter(f =>
                !f.isHidden && isVisibleForBatch(f.visibleForBatches)
            );
            // Filter root files: not hidden AND visible for this batch
            const filteredRootFiles = allModuleFiles.filter(r =>
                !r.isHidden && isVisibleForBatch(r.visibleForBatches)
            );
            setVisibleFolders(filteredFolders);
            setRootFiles(filteredRootFiles);
        } catch (e) {
            console.error(e);
            setVisibleFolders([]);
            setRootFiles([]);
        } finally {
            setFoldersLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentBatch]);

    // ─── Open Folder (show files inside) ─────────────────────────────────────
    const openFolder = useCallback(async (module: Resource, folder: ModuleFolder) => {
        setView({ level: "files", module, folder });
        setFilesLoading(true);
        try {
            const all = await getModuleResourcesByFolder(folder.id);
            const filtered = all.filter(r =>
                !r.isHidden && isVisibleForBatch(r.visibleForBatches)
            );
            setFolderFiles(filtered);
        } catch (e) {
            console.error(e);
            setFolderFiles([]);
        } finally {
            setFilesLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentBatch]);

    // ─── File Card ─────────────────────────────────────────────────────────────
    const renderFileCard = (resource: ModuleResource) => (
        <div key={resource.id} className="border border-gray-100 hover:border-[#059669]/30 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between bg-white group">
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{fileTypeIcon(resource.fileType)}</span>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 group-hover:text-[#059669] transition-colors leading-tight">
                            {resource.title}
                        </h4>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                            {resourceTypeIcon[resource.resourceType] || "📎"} {resource.resourceType}
                        </span>
                    </div>
                </div>
                {resource.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{resource.description}</p>
                )}
                <p className="text-xs text-gray-400">{resource.fileSize}</p>
            </div>
            <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                <span className="text-xs text-gray-400 font-medium">{resource.teacherName}</span>
                <div className="flex gap-2">
                    <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="p-2 text-[#059669] bg-emerald-50 hover:bg-[#059669] hover:text-white rounded-lg transition-colors" title="View">
                        <EyeIcon className="w-4 h-4" />
                    </a>
                    <a href={resource.fileUrl} download target="_blank" rel="noopener noreferrer"
                        className="px-3 py-2 text-sm font-semibold text-[#059669] bg-emerald-50 hover:bg-[#059669] hover:text-white rounded-lg transition-colors flex items-center gap-1.5">
                        <DownloadIcon className="w-4 h-4" /> Download
                    </a>
                </div>
            </div>
        </div>
    );

    // ─── Breadcrumb ───────────────────────────────────────────────────────────
    const renderBreadcrumb = () => {
        if (view.level === "modules") return null;
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                <button onClick={() => setView({ level: "modules" })} className="hover:text-[#059669] transition-colors font-medium">
                    Course Resources
                </button>
                {view.level === "folders" && (
                    <>
                        <span>/</span>
                        <span className="text-gray-900 font-semibold">{view.module.title}</span>
                    </>
                )}
                {view.level === "files" && (
                    <>
                        <span>/</span>
                        <button
                            onClick={() => openModule(view.module)}
                            className="hover:text-[#059669] transition-colors font-medium"
                        >
                            {view.module.title}
                        </button>
                        <span>/</span>
                        <span className="text-gray-900 font-semibold">{view.folder.title}</span>
                    </>
                )}
            </div>
        );
    };

    // ─── Back button ───────────────────────────────────────────────────────────
    const renderBackBar = () => {
        if (view.level === "modules") return null;
        const goBack = view.level === "files"
            ? () => openModule(view.module)
            : () => setView({ level: "modules" });
        const label = view.level === "files" ? `Back to ${view.module.title}` : "Back to Subjects";

        return (
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 flex items-center gap-2 font-medium text-sm">
                    <ChevronLeftIcon className="w-5 h-5" />
                    {label}
                </button>
                <div className="h-6 w-px bg-gray-200"></div>
                <h2 className="text-lg font-bold text-[#059669] flex items-center gap-2">
                    {view.level === "folders" && <><FolderOpenIcon className="w-5 h-5" />{view.module.title}</>}
                    {view.level === "files" && <><span>📁</span>{view.folder.title}</>}
                </h2>
                {view.level === "folders" && (
                    <span className="ml-auto text-xs text-gray-400 hidden sm:block">
                        👤 {view.module.teacherName || view.module.uploadedByName}
                    </span>
                )}
            </div>
        );
    };

    // ─── Loading spinner ──────────────────────────────────────────────────────
    const renderSpinner = (text: string) => (
        <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669] mx-auto"></div>
            <p className="text-gray-500 mt-3 text-sm">{text}</p>
        </div>
    );

    // ─── Empty state ───────────────────────────────────────────────────────────
    const renderEmpty = (icon: string, title: string, sub: string) => (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="text-5xl mb-4">{icon}</div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-gray-500 mt-1 text-sm">{sub}</p>
        </div>
    );

    if (modulesLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]"></div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    //  RENDER
    // ════════════════════════════════════════════════════════════════════════
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* PAGE HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">Course Resources</h1>
                        <p className="text-[#6b7280] mt-1 text-sm">Browse and download study materials categorized by subject.</p>
                    </div>
                </div>
                {view.level !== "modules" && (
                    <div>{renderBreadcrumb()}</div>
                )}
            </div>

            {/* BACK BAR (non-module views) */}
            {renderBackBar()}

            {/* ════════════════════════════
                LEVEL 1: Course Modules
            ════════════════════════════ */}
            {view.level === "modules" && (
                courseModules.length === 0
                    ? renderEmpty("📂", "No Course Modules yet", "Teacher portal-এ Course Module যোগ করলে এখানে দেখা যাবে।")
                    : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courseModules.map(module => (
                                <div
                                    key={module.id}
                                    onClick={() => openModule(module)}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#059669]/30 transition-all duration-300 cursor-pointer group flex items-start gap-4"
                                >
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                                        <FolderIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-[#059669] transition-colors">{module.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">👤 {module.teacherName || module.uploadedByName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
            )}

            {/* ════════════════════════════
                LEVEL 2: Folders + Root Files
            ════════════════════════════ */}
            {view.level === "folders" && (
                foldersLoading
                    ? renderSpinner("Loading folders...")
                    : (visibleFolders.length === 0 && rootFiles.length === 0)
                        ? renderEmpty("📁", "No materials available", "This module has no content for your batch yet. Check back later.")
                        : (
                            <div className="space-y-8">
                                {/* Sub-folders */}
                                {visibleFolders.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">Folders</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {visibleFolders.map(folder => (
                                                <div
                                                    key={folder.id}
                                                    onClick={() => openFolder(view.module, folder)}
                                                    className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#059669]/30 transition-all cursor-pointer group flex items-center gap-4"
                                                >
                                                    <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                                                        <FolderIcon className="w-7 h-7" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-gray-900 group-hover:text-[#059669] transition-colors truncate">{folder.title}</h4>
                                                        {folder.description && (
                                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{folder.description}</p>
                                                        )}
                                                    </div>
                                                    <svg className="w-4 h-4 text-gray-300 group-hover:text-[#059669] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Root files (grouped by type) */}
                                {rootFiles.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">Files</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {rootFiles.map(renderFileCard)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
            )}

            {/* ════════════════════════════
                LEVEL 3: Files inside folder
            ════════════════════════════ */}
            {view.level === "files" && (
                filesLoading
                    ? renderSpinner("Loading files...")
                    : folderFiles.length === 0
                        ? renderEmpty("📄", "No files in this folder", "এই ফোল্ডারে এখনো আপনার ব্যাচের জন্য কোনো ফাইল নেই।")
                        : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {folderFiles.map(renderFileCard)}
                            </div>
                        )
            )}
        </div>
    );
}
