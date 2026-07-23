import { Calendar, CalendarClock } from "lucide-react";

interface TabNavigationProps {
    activeTab: "today" | "future" | "past";
    setActiveTab: (tab: "today" | "future" | "past") => void;
    todayCount: number;
    futureCount: number;
    pastCount: number;
}

export function TabNavigation({
    activeTab,
    setActiveTab,
    todayCount,
    futureCount,
    pastCount,
}: TabNavigationProps) {
    return (
        <div className="flex border-b border-gray-200 dark:border-neutral-700 overflow-x-auto">
            <button
                onClick={() => setActiveTab("today")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "today"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
            >
                <Calendar className="w-4 h-4" />
                Hoy
                <span className="ml-1 rounded-full bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 text-xs">
                    {todayCount}
                </span>
            </button>
            <button
                onClick={() => setActiveTab("future")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "future"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
            >
                <CalendarClock className="w-4 h-4" />
                Futuros
                <span className="ml-1 rounded-full bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 text-xs">
                    {futureCount}
                </span>
            </button>
            <button
                onClick={() => setActiveTab("past")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "past"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
            >
                <CalendarClock className="w-4 h-4" />
                Pasados
                <span className="ml-1 rounded-full bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 text-xs">
                    {pastCount}
                </span>
            </button>
        </div>
    );
}