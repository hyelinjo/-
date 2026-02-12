"use client";
import { useState, useMemo, useEffect } from "react"; // Added useEffect
import { useCalendar } from "@/hooks/useCalendar";
import CalendarHeader from "@/components/scheduler/CalendarHeader";
import CalendarGrid from "@/components/scheduler/CalendarGrid";
import ScheduleForm from "@/components/scheduler/ScheduleForm";
import ScheduleListModal from "@/components/Scheduler/ScheduleListModal";
// import { supabase } from "@/lib/supabase"; // Removed Supabase import
import { getEvents, addSchedule } from "@/lib/pythonApi"; // Imported Python API functions

export default function Scheduler({ holidayData, initialEvents = [], regions = [], initialRegion = '' }) { // Updated props
  const [view, setView] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(null);
  const [schedules, setSchedules] = useState(initialEvents); // Initialized with initialEvents
  const [selectedRegion, setSelectedRegion] = useState(initialRegion); // New state for selected region

  const { year, month, daysInMonth, firstDayIndex, changeMonth, formatDate } =
    useCalendar();

  // Effect to re-fetch schedules when region or month changes
  useEffect(() => {
    async function fetchSchedules() {
      const fetchedEvents = await getEvents(selectedRegion);
      // Filter out holidays from events for the `schedules` state if necessary
      // Assuming getEvents returns both schedules and holidays,
      // and schedules state should only contain actual schedules for `selectedDaySchedules` filtering.
      // Adjust this logic based on how `getEvents` structures its return (e.g., separate lists or a combined list where you can filter by `type`).
      setSchedules(fetchedEvents.filter(event => event.extendedProps.type === 'schedule')); // Assuming 'type' is available from Python backend
    }
    fetchSchedules();
  }, [selectedRegion, year, month]); // Dependency array: re-run when selectedRegion, year, or month changes

  const holidayMap = useMemo(() => {
    const map = {};
    if (Array.isArray(holidayData)) {
      holidayData.forEach((h) => {
        if (h.date) { // Assuming holidaysData still comes from the external API
          const dateKey = String(h.date);
          map[dateKey] = h.name;
        }
      });
    }
    // Filter holidays from fetched events if they are part of `schedules` for display on the calendar grid
    schedules.filter(event => event.extendedProps.type === 'holiday' && event.region === selectedRegion || event.extendedProps.type === 'holiday' && event.region === 'all').forEach(h => {
        if (h.start) {
            const dateKey = h.start.split('T')[0]; // Assuming ISO format like "YYYY-MM-DDTHH:MM:SS"
            map[dateKey] = h.title.replace('⛔ [전체] ', '').replace('⛔ [개별] ', ''); // Remove emoji and prefix
        }
    });

    return map;
  }, [holidayData, schedules, selectedRegion]); // Added schedules and selectedRegion to dependencies

// 선택된 날짜의 일정들만 필터링 (팝업에 넘겨줄 데이터)
  const selectedDaySchedules = useMemo(() => {
    return schedules.filter((s) => {
      const scheduleDate = new Date(s.start).toISOString().split('T')[0]; // Assuming s.start is ISO string
      return scheduleDate === selectedDate && s.region === selectedRegion;
    });
  }, [schedules, selectedDate, selectedRegion]); // Added selectedRegion to dependencies

  const handleDateClick = (day, status) => {
    if (status.disabled) {
      alert(`[${status.label || "휴일"}] 예약이 불가능합니다.`);
      return;
    }
    const dateStr = formatDate(day);
    setSelectedDate(dateStr);

    // 해당 날짜에 일정이 있는지 확인
    const hasSchedule = schedules.some((s) => {
      const scheduleDate = new Date(s.start).toISOString().split('T')[0];
      return scheduleDate === dateStr && s.region === selectedRegion;
    });

    if (hasSchedule) {
      // 일정이 있으면 -> 목록 팝업('list') 보여주기
      setView("list");
    } else {
      // 일정이 없으면 -> 바로 등록 폼('form')으로 이동
      setView("form");
    }
  };

  const handleScheduleSubmit = async (formData) => {
    const newSchedule = {
      date: selectedDate, // This will be replaced by start/end in Flask
      name: formData.name,
      department: formData.department,
      start: `${selectedDate}T${formData.startTime}:00`, // Combined date and time for Flask backend
      end: `${selectedDate}T${formData.endTime}:00`,     // Combined date and time for Flask backend
      content: formData.content,
      region: selectedRegion, // Pass the selected region
      topic: formData.topic, // Assuming topic is now part of formData from ScheduleForm
      center: formData.department, // Assuming center is department
      applicant: formData.name,
      pwd: '1234' // Placeholder for password, needs to be handled in ScheduleForm
    };

    try {
      const response = await addSchedule(newSchedule); // Use addSchedule from pythonApi

      if (response.status === 'success') {
        // Re-fetch events to get the latest state including the new schedule
        const updatedEvents = await getEvents(selectedRegion);
        setSchedules(updatedEvents.filter(event => event.extendedProps.type === 'schedule')); // Update schedules state
        alert(`${formData.name}님의 일정이 저장되었습니다!`);
        setView("calendar");
      } else if (response.status === 'warning') {
        const updatedEvents = await getEvents(selectedRegion);
        setSchedules(updatedEvents.filter(event => event.extendedProps.type === 'schedule')); // Update schedules state
        alert(`${response.message}`); // Show warning message
        setView("calendar");
      }
      else {
        alert(`일정 저장에 실패했습니다: ${response.message}`);
      }
    } catch (error) {
      console.error("저장 실패:", error);
      alert("일정 저장에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-green-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold">📅 디지털교육 예약 시스템</h1>
          <p className="text-lg opacity-80 mt-2">
            공휴일과 주말은 예약할 수 없습니다
          </p>
          {/* Region selection dropdown */}
          {regions.length > 0 && (
            <div className="mt-4">
              <label htmlFor="region-select" className="sr-only">지역 선택</label>
              <select
                id="region-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="block w-full px-4 py-2 mt-1 text-base text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {(view === "calendar" || view === "list") && (
          <div className="p-8">
            <CalendarHeader
              year={year}
              month={month}
              onChangeMonth={changeMonth}
            />
            <CalendarGrid
              year={year}
              month={month}
              firstDayIndex={firstDayIndex}
              daysInMonth={daysInMonth}
              schedules={schedules}
              holidayMap={holidayMap}
              onDateClick={handleDateClick}
              formatDate={formatDate}
            />
          </div>
        )}

        {view === "list" && (
          <ScheduleListModal
            date={selectedDate}
            schedules={selectedDaySchedules} // 위에서 필터링한 데이터 전달
            onClose={() => setView("calendar")}
            onAdd={() => setView("form")} // 팝업 내 '추가하기' 버튼 클릭 시 폼으로 이동
          />
        )}

        {view === "form" && (
          <ScheduleForm
            selectedDate={selectedDate}
            onBack={() => setView("calendar")}
            onSubmit={handleScheduleSubmit}
            selectedRegion={selectedRegion} // Pass selected region to ScheduleForm
          />
        )}
      </div>
    </div>
  );
}