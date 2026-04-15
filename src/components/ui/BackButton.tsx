"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={`group flex items-center gap-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white transition-all duration-300 py-2.5 px-5 rounded-xl font-bold w-fit mx-auto shadow-sm border border-indigo-100 hover:shadow-md text-base md:text-lg ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-6 h-6 transition-transform duration-300 group-hover:-translate-x-1"
      >
        <path
          fillRule="evenodd"
          d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
          clipRule="evenodd"
        />
      </svg>
      Go Back
    </button>
  );
}
