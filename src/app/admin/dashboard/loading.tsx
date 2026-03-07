import { SkeletonDashboard } from "@/components/Skeleton";

export default function Loading() {
    return (
        <div className="aurora-page text-white font-sans flex flex-col items-center w-full">
            <main className="max-w-5xl w-full px-6 sm:px-8 py-10 sm:py-16">
                <SkeletonDashboard />
            </main>
        </div>
    );
}
