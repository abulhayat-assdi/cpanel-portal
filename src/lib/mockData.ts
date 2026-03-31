// Mock data for the Internal Web Portal

export interface Teacher {
    id: string;
    name: string;
    employeeId: string;
    designation: string;
    subject: string;
    email: string;
    phone?: string;
    about?: string;
    role: "Teacher" | "Admin";
    status: "Active" | "Inactive";
    avatar?: string;
}

export interface Notice {
    id: string;
    title: string;
    description: string;
    type: "Urgent" | "Normal" | "Important";
    date: string;
    hasAttachment: boolean;
}

export interface ClassSchedule {
    id: string;
    date: string;
    day: string;
    batch: string;
    subject: string;
    time: string;
    status: "Completed" | "Pending" | "Today";
    isToday?: boolean;
}

export interface Resource {
    id: string;
    title: string;
    category: "PDF" | "Drive" | "Link";
    uploadedBy: string;
    uploadDate: string;
    description?: string;
}

export interface Policy {
    id: string;
    title: string;
    date: string;
    version: string;
    type: "Policy" | "Meeting";
}

export interface Feedback {
    id: string;
    submittedBy: string;
    message: string;
    date: string;
    status: "Seen" | "Pending";
}

export interface AdminStats {
    totalTeachers: number;
    totalStudents: number;
    totalNotices: number;
}

export interface User {
    id: string;
    name: string;
    role: string;
    email: string;
    status: "Active" | "Inactive";
}

// Mock Teachers
export const mockTeachers: Teacher[] = [
    {
        id: "T001",
        name: "Abul Hayat",
        employeeId: "EMP-2021-001",
        designation: "Senior Instructor",
        subject: "Mathematics",
        email: "abul.hayat@asm.edu.bd",
        phone: "01712345678",
        about: "Abul Hayat is a dedicated Senior Instructor specializing in Mathematics with over 15 years of experience in education. He brings extensive knowledge and passion to his teaching methodology, focusing on student success and creating an engaging learning environment. His innovative approach to complex mathematical concepts has helped hundreds of students excel in their academic pursuits.",
        role: "Admin",
        status: "Active",
    },
    {
        id: "T002",
        name: "Mohammad Rahman",
        employeeId: "EMP-2021-002",
        designation: "Instructor",
        subject: "English",
        email: "mohammad.rahman@asm.edu.bd",
        phone: "01723456789",
        about: "Mohammad Rahman has a passion for English literature and language teaching. With 8 years of experience, he creates interactive and engaging lessons that help students develop strong communication skills and appreciation for literature.",
        role: "Teacher",
        status: "Active",
    },
    {
        id: "T003",
        name: "Karim Uddin",
        employeeId: "EMP-2022-003",
        designation: "Senior Instructor",
        subject: "Physics",
        email: "karim.uddin@asm.edu.bd",
        phone: "01734567890",
        about: "Karim Uddin specializes in Physics education with a focus on practical applications and experimental learning. His 12 years of teaching experience includes developing innovative lab exercises and demonstration techniques.",
        role: "Teacher",
        status: "Active",
    },
    {
        id: "T004",
        name: "Shahid Ahmed",
        employeeId: "EMP-2022-004",
        designation: "Instructor",
        subject: "Chemistry",
        email: "shahid.ahmed@asm.edu.bd",
        phone: "01745678901",
        about: "Shahid Ahmed brings enthusiasm and expertise to Chemistry education. With 6 years of teaching experience, he focuses on making complex chemical concepts accessible and interesting through hands-on experiments and real-world applications.",
        role: "Teacher",
        status: "Active",
    },
    {
        id: "T005",
        name: "Rafiqul Islam",
        employeeId: "EMP-2023-005",
        designation: "Instructor",
        subject: "Biology",
        email: "rafiqul.islam@asm.edu.bd",
        phone: "01756789012",
        about: "Rafiqul Islam is passionate about Biology and environmental science. His teaching approach emphasizes understanding living systems and their interconnections, preparing students for careers in life sciences and medicine.",
        role: "Teacher",
        status: "Active",
    },
    {
        id: "T006",
        name: "Tarek Hassan",
        employeeId: "EMP-2023-006",
        designation: "Instructor",
        subject: "Bangla",
        email: "tarek.hassan@asm.edu.bd",
        phone: "01767890123",
        about: "Tarek Hassan is dedicated to preserving and teaching Bangla language and literature. With expertise in classical and modern Bangla literature, he helps students develop deep appreciation for their cultural heritage.",
        role: "Teacher",
        status: "Active",
    },
];

// Mock Notices
export const mockNotices: Notice[] = [
    {
        id: "N001",
        title: "আগামী সপ্তাহে শীতকালীন ছুটি",
        description: "২৫ জানুয়ারি থেকে ৩ ফেব্রুয়ারি পর্যন্ত শীতকালীন ছুটি থাকবে। সকল শিক্ষককে অনুরোধ করা হচ্ছে ছুটির আগে সকল কাজ সম্পন্ন করতে।",
        type: "Important",
        date: "2026-01-20",
        hasAttachment: true,
    },
    {
        id: "N002",
        title: "জরুরি মিটিং - আগামীকাল সকাল ১০টা",
        description: "সকল শিক্ষকদের উপস্থিতি বাধ্যতামূলক। নতুন শিক্ষাবর্ষের পরিকল্পনা নিয়ে আলোচনা হবে।",
        type: "Urgent",
        date: "2026-01-22",
        hasAttachment: false,
    },
    {
        id: "N003",
        title: "বার্ষিক পরীক্ষার রুটিন প্রকাশ",
        description: "২০২৬ সালের বার্ষিক পরীক্ষার রুটিন প্রকাশিত হয়েছে। বিস্তারিত রিসোর্স লাইব্রেরিতে দেখুন।",
        type: "Normal",
        date: "2026-01-18",
        hasAttachment: true,
    },
    {
        id: "N004",
        title: "নতুন ডিজিটাল ক্লাসরুম প্রশিক্ষণ",
        description: "আগামী ১৫ ফেব্রুয়ারি নতুন ডিজিটাল ক্লাসরুম সিস্টেম নিয়ে প্রশিক্ষণ অনুষ্ঠিত হবে।",
        type: "Normal",
        date: "2026-01-15",
        hasAttachment: false,
    },
];

// Mock Class Schedule
export const mockSchedule: ClassSchedule[] = [
    {
        id: "CS001",
        date: "2026-01-22",
        day: "Wednesday",
        batch: "HSC 2026 - Science A",
        subject: "Physics",
        time: "10:00 AM - 11:30 AM",
        status: "Today",
        isToday: true,
    },
    {
        id: "CS002",
        date: "2026-01-22",
        day: "Wednesday",
        batch: "SSC 2026 - A",
        subject: "Mathematics",
        time: "12:00 PM - 01:30 PM",
        status: "Today",
        isToday: true,
    },
    {
        id: "CS003",
        date: "2026-01-21",
        day: "Tuesday",
        batch: "HSC 2026 - Commerce",
        subject: "Accounting",
        time: "02:00 PM - 03:30 PM",
        status: "Completed",
    },
    {
        id: "CS004",
        date: "2026-01-21",
        day: "Tuesday",
        batch: "HSC 2026 - Science B",
        subject: "Chemistry",
        time: "10:00 AM - 11:30 AM",
        status: "Completed",
    },
    {
        id: "CS005",
        date: "2026-01-23",
        day: "Thursday",
        batch: "SSC 2026 - B",
        subject: "English",
        time: "09:00 AM - 10:30 AM",
        status: "Pending",
    },
    {
        id: "CS006",
        date: "2026-01-23",
        day: "Thursday",
        batch: "HSC 2026 - Science A",
        subject: "Biology",
        time: "11:00 AM - 12:30 PM",
        status: "Pending",
    },
    {
        id: "CS007",
        date: "2026-01-20",
        day: "Monday",
        batch: "HSC 2027 - Arts",
        subject: "Bangla",
        time: "01:00 PM - 02:30 PM",
        status: "Completed",
    },
    {
        id: "CS008",
        date: "2026-01-24",
        day: "Friday",
        batch: "SSC 2026 - A",
        subject: "ICT",
        time: "10:00 AM - 11:30 AM",
        status: "Pending",
    },
];

// Mock Resources
export const mockResources: Resource[] = [
    {
        id: "R001",
        title: "HSC Physics - Mechanics Chapter Notes",
        category: "PDF",
        uploadedBy: "মোঃ করিম উদ্দিন",
        uploadDate: "2026-01-15",
        description: "Complete chapter notes with examples and practice problems",
    },
    {
        id: "R002",
        title: "SSC Mathematics Question Bank",
        category: "Drive",
        uploadedBy: "মোঃ আবুল হায়াত",
        uploadDate: "2026-01-10",
        description: "Comprehensive question bank for SSC preparation",
    },
    {
        id: "R003",
        title: "English Grammar Worksheets",
        category: "PDF",
        uploadedBy: "রাহিমা খাতুন",
        uploadDate: "2026-01-18",
        description: "Interactive grammar exercises for all levels",
    },
    {
        id: "R004",
        title: "Chemistry Lab Manual 2026",
        category: "Drive",
        uploadedBy: "ফাতিমা আক্তার",
        uploadDate: "2026-01-12",
        description: "Updated lab manual with safety guidelines",
    },
    {
        id: "R005",
        title: "Online Learning Platform Tutorial",
        category: "Link",
        uploadedBy: "System Admin",
        uploadDate: "2026-01-08",
        description: "Guide to using the new digital classroom",
    },
    {
        id: "R006",
        title: "Bangla Literature - Modern Poetry Collection",
        category: "PDF",
        uploadedBy: "সালমা বেগম",
        uploadDate: "2026-01-20",
        description: "Curated collection of modern Bengali poetry",
    },
];

// Mock Policies
export const mockPolicies: Policy[] = [
    {
        id: "P001",
        title: "শিক্ষক আচরণবিধি ২০২৬",
        date: "2026-01-05",
        version: "v2.1",
        type: "Policy",
    },
    {
        id: "P002",
        title: "ডিজিটাল ক্লাসরুম ব্যবহার নীতিমালা",
        date: "2026-01-10",
        version: "v1.0",
        type: "Policy",
    },
    {
        id: "P003",
        title: "পরীক্ষা পরিচালনা ও মূল্যায়ন নীতি",
        date: "2025-12-20",
        version: "v3.0",
        type: "Policy",
    },
];

// Mock Meeting Minutes
export const mockMeetings: Policy[] = [
    {
        id: "M001",
        title: "শিক্ষক সভা - জানুয়ারি ২০২৬",
        date: "2026-01-15",
        version: "Meeting #12",
        type: "Meeting",
    },
    {
        id: "M002",
        title: "পাঠ্যক্রম পরিকল্পনা সভা",
        date: "2026-01-08",
        version: "Meeting #11",
        type: "Meeting",
    },
    {
        id: "M003",
        title: "বার্ষিক পরীক্ষা প্রস্তুতি সভা",
        date: "2025-12-28",
        version: "Meeting #10",
        type: "Meeting",
    },
    {
        id: "M004",
        title: "ডিজিটাল রূপান্তর পর্যালোচনা সভা",
        date: "2025-12-15",
        version: "Meeting #09",
        type: "Meeting",
    },
];

// Mock Feedback
export const mockFeedback: Feedback[] = [
    {
        id: "F001",
        submittedBy: "মোঃ করিম উদ্দিন",
        message: "নতুন ডিজিটাল ক্লাসরুম সিস্টেম খুবই কার্যকর। তবে আরও প্রশিক্ষণ প্রয়োজন।",
        date: "2026-01-20",
        status: "Seen",
    },
    {
        id: "F002",
        submittedBy: "রাহিমা খাতুন",
        message: "শিক্ষার্থীদের জন্য অনলাইন রিসোর্স লাইব্রেরি খুব সহায়ক হবে।",
        date: "2026-01-18",
        status: "Pending",
    },
    {
        id: "F003",
        submittedBy: "ফাতিমা আক্তার",
        message: "ল্যাব সরঞ্জাম আপডেট করা প্রয়োজন। বিশেষ করে রসায়ন বিভাগে।",
        date: "2026-01-15",
        status: "Seen",
    },
    {
        id: "F004",
        submittedBy: "সালমা বেগম",
        message: "শিক্ষকদের জন্য নিয়মিত ওয়ার্কশপ আয়োজন করা হলে ভালো হয়।",
        date: "2026-01-12",
        status: "Pending",
    },
];

// Mock Admin Stats
export const mockAdminStats: AdminStats = {
    totalTeachers: 24,
    totalStudents: 486,
    totalNotices: 12,
};

// Mock Users for Admin Panel
export const mockUsers: User[] = [
    {
        id: "U001",
        name: "মোঃ আবুল হায়াত",
        role: "Teacher",
        email: "abul.hayat@asm.edu.bd",
        status: "Active",
    },
    {
        id: "U002",
        name: "রাহিমা খাতুন",
        role: "Teacher",
        email: "rahima.khatun@asm.edu.bd",
        status: "Active",
    },
    {
        id: "U003",
        name: "Admin User",
        role: "Administrator",
        email: "admin@asm.edu.bd",
        status: "Active",
    },
    {
        id: "U004",
        name: "মোঃ করিম উদ্দিন",
        role: "Teacher",
        email: "karim.uddin@asm.edu.bd",
        status: "Active",
    },
    {
        id: "U005",
        name: "Moderator",
        role: "Moderator",
        email: "moderator@asm.edu.bd",
        status: "Active",
    },
];
