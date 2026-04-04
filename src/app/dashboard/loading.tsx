export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Hero Card Skeleton */}
            <div className="h-64 bg-gray-200 rounded-[20px] w-full"></div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
                ))}
            </div>

            {/* Notices Skeleton */}
            <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
