"use client";

import { Button } from "@/src/components/ui/Button";
import { ArrowLeft, CalendarDays, CalendarRange, Plus } from "lucide-react";
import * as React from "react";
import { AddHolidayDialog } from "../components/AddHolidayDialog";
import { HolidaysTab } from "../components/HolidaysTab";
import { WorkingDaysTab } from "../components/WorkingDaysTab";

export type WeekDay =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export interface WorkingDaysConfig {
  workingDays: WeekDay[];
  saturdayPolicy: "all-off" | "alternate-off" | "working";
}

export type HolidayType = "Festival" | "National" | "Regional" | "Optional";

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: HolidayType;
  recurringYearly: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();

const defaultHolidays: Holiday[] = [
  {
    id: "1",
    name: "New Year's Day",
    date: `${CURRENT_YEAR}-01-01`,
    type: "National",
    recurringYearly: true,
  },
  {
    id: "2",
    name: "Pongal",
    date: `${CURRENT_YEAR}-01-15`,
    type: "Festival",
    recurringYearly: true,
  },
  {
    id: "3",
    name: "Independence Day",
    date: `${CURRENT_YEAR}-08-15`,
    type: "National",
    recurringYearly: true,
  },
  {
    id: "4",
    name: "Diwali",
    date: `${CURRENT_YEAR}-10-20`,
    type: "Festival",
    recurringYearly: false,
  },
  {
    id: "5",
    name: "Christmas",
    date: `${CURRENT_YEAR}-12-25`,
    type: "Festival",
    recurringYearly: true,
  },
];

type TabKey = "working-days" | "holidays";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "working-days",
    label: "Working Days & Week Offs",
    icon: <CalendarRange className="h-4 w-4" />,
  },
  {
    key: "holidays",
    label: "Holidays",
    icon: <CalendarDays className="h-4 w-4" />,
  },
];

export default function LeavePolicyPage() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("working-days");
  const [holidays, setHolidays] = React.useState<Holiday[]>(defaultHolidays);
  const [editingHoliday, setEditingHoliday] = React.useState<Holiday | null>(
    null,
  );
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = React.useState(false);
  const [holidayMode, setHolidayMode] = React.useState<"create" | "edit">(
    "edit",
  );

  const handleAddHoliday = () => {
    setEditingHoliday(null);
    setHolidayMode("create");
    setIsHolidayDialogOpen(true);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setHolidayMode("edit");
    setIsHolidayDialogOpen(true);
  };

  const handleDeleteHoliday = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  const handleSaveHoliday = (holiday: Holiday) => {
    setHolidays((prev) => {
      const exists = prev.some((h) => h.id === holiday.id);
      if (exists) {
        return prev.map((h) => (h.id === holiday.id ? holiday : h));
      }
      return [...prev, { ...holiday, id: String(Date.now()) }];
    });
    setIsHolidayDialogOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F2F2]">
      <div className="sticky top-0 z-40 bg-[#F2F2F2] pt-4 px-3 sm:px-6 lg:px-8 flex justify-between">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div
            className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary transition-colors"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
          </div>
          <h1 className="text-lg sm:text-2xl font-light truncate">
            Leave Policy
          </h1>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 h-11 cursor-pointer rounded-lg px-4 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white text-ink hover:bg-surface-muted border border-border"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "holidays" && (
            <Button
              onClick={handleAddHoliday}
              aria-label="Add Holiday"
              className="flex h-10 sm:h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-3.5 sm:px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-dark hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Holiday</span>
            </Button>
          )}
        </div>
      </div>

      <div className="w-full px-3 sm:px-6 lg:px-8 py-4">
        {activeTab === "working-days" && <WorkingDaysTab />}
        {activeTab === "holidays" && (
          <HolidaysTab
            holidays={holidays}
            onEdit={handleEditHoliday}
            onDelete={handleDeleteHoliday}
          />
        )}
      </div>

      <AddHolidayDialog
        open={isHolidayDialogOpen}
        onOpenChange={setIsHolidayDialogOpen}
        holiday={editingHoliday}
        mode={holidayMode}
        onSave={handleSaveHoliday}
      />
    </div>
  );
}
