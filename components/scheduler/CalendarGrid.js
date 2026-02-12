import React from "react";
import Day from "./Day";

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarGrid({
  year,
  month,
  firstDayIndex,
  daysInMonth,
  schedules,
  holidayMap,
  onDateClick,
  formatDate,
}) {
  const getDateStatus = (day) => {
    const dateKey = `${year}${String(month + 1).padStart(2, "0")}${String(
      day
    ).padStart(2, "0")}`;
    const dayOfWeek = new Date(year, month, day).getDay();

    if (holidayMap[dateKey]) {
      return { type: "holiday", label: holidayMap[dateKey], disabled: true };
    }
    if (dayOfWeek === 0)
      return { type: "sunday", label: "일", disabled: true };
    if (dayOfWeek === 6)
      return { type: "saturday", label: "토", disabled: true };

    return { type: "weekday", label: null, disabled: false };
  };

  return (
    <>
      <div className="grid grid-cols-7 gap-4 mb-4">
        {WEEK_DAYS.map((day, i) => (
          <div
            key={day}
            className={`text-center text-lg font-bold py-2 ${
              i === 0
                ? "text-red-500"
                : i === 6
                ? "text-blue-500"
                : "text-gray-500"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-4">
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`}></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const status = getDateStatus(day);
          const hasSchedule = schedules.some((s) => s.date === formatDate(day));
          const isToday =
            new Date().toDateString() ===
            new Date(year, month, day).toDateString();

          return (
            <Day
              key={day}
              day={day}
              status={status}
              hasSchedule={hasSchedule}
              isToday={isToday}
              onDateClick={onDateClick}
            />
          );
        })}
      </div>
    </>
  );
}
