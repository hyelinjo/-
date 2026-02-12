import React from "react";

export default function CalendarHeader({ year, month, onChangeMonth }) {

  return (
    <div className="flex justify-between items-center mb-8">
      <button
        onClick={() => onChangeMonth(-1)}
        className="px-4 py-2 hover:bg-gray-100 rounded-full font-bold text-xl text-gray-600"
      >
        &lt; 이전달
      </button>
      <h2 className="text-2xl font-bold text-gray-800">
        {year}년 {month + 1}월
      </h2>
      <button
        onClick={() => onChangeMonth(1)}
        className="px-4 py-2 hover:bg-gray-100 rounded-full font-bold text-xl text-gray-600"
      >
        다음달 &gt;
      </button>
    </div>
  );
}
