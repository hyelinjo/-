import React from "react";

export default function Day({ day, status, hasSchedule, isToday, onDateClick }) {
  let btnClass =
    "aspect-square border rounded-xl flex flex-col items-center justify-start pt-3 relative transition text-lg ";

  if (status.disabled) {
    btnClass +=
      "bg-gray-100 text-gray-400 cursor-not-allowed border-transparent opacity-70";
  } else if (isToday) {
    btnClass +=
      "bg-blue-50 border-blue-500 border-2 font-bold text-blue-600 shadow-md";
  } else {
    btnClass += "hover:bg-blue-50 hover:shadow-md text-gray-700 cursor-pointer";
  }

  return (
    <button
      onClick={() => onDateClick(day, status)}
      disabled={status.disabled}
      className={btnClass}
    >
      <span
        className={
          status.type === "holiday" || status.type === "sunday"
            ? "text-red-500 font-bold"
            : ""
        }
      >
        {day}
      </span>

      {status.type === "holiday" && (
        <span className="text-xs text-red-500 truncate w-full text-center mt-1 font-medium px-1">
          {status.label}
        </span>
      )}

      {hasSchedule && !status.disabled && (
        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm"></span>
      )}
    </button>
  );
}
