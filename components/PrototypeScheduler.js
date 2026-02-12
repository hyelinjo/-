"use client";
import { useState, useMemo } from "react";

// props로 holidayData(공휴일 배열)를 받습니다.
export default function PrototypeScheduler({ holidayData = [] }) {
  // --- 상태 관리 ---
  const [view, setView] = useState("calendar");
  const [currentDate, setCurrentDate] = useState(new Date()); // 2026년 가정 시 new Date(2026, 0, 1) 등
  const [selectedDate, setSelectedDate] = useState(null);
  const [schedules, setSchedules] = useState([]);

  const [formData, setFormData] = useState({
    name: "", time: "09:00", content: "",
  });

  // --- 날짜 계산 로직 ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const formatDate = (day) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  // --- 공휴일 데이터 최적화 (배열 -> 객체 변환) ---
  // 넘어온 holidayData를 검색하기 쉬운 Map 형태로 변환합니다.
  const holidayMap = useMemo(() => {
    const map = {};
    if (Array.isArray(holidayData)) {
      holidayData.forEach((item) => {
        // 라이브러리 데이터 포맷: { locdate: '20260101', dateName: '신정', ... }
        // 혹은 item 자체가 날짜 문자열일 수도 있으니 구조 확인 필요 (보통 객체로 옴)
        // 안전하게 문자열 변환 및 하이픈 제거
        const dateStr = String(item.locdate || item).replace(/-/g, ""); 
        map[dateStr] = item.dateName || item.name || "공휴일";
      });
    }
    return map;
  }, [holidayData]);

  // --- 날짜 상태 판별 함수 (핵심) ---
  const getDateStatus = (day) => {
    // 비교용 키 생성 (YYYYMMDD)
    const dateKey = `${year}${String(month + 1).padStart(2, "0")}${String(day).padStart(2, "0")}`;
    const dayOfWeek = new Date(year, month, day).getDay(); // 0:일, 6:토

    // 1. 공휴일 체크
    if (holidayMap[dateKey]) {
      return { type: "holiday", label: holidayMap[dateKey], disabled: true };
    }
    // 2. 주말 체크
    if (dayOfWeek === 0) return { type: "sunday", label: "일", disabled: true };
    if (dayOfWeek === 6) return { type: "saturday", label: "토", disabled: true };

    // 3. 평일
    return { type: "weekday", label: null, disabled: false };
  };

  // --- 이벤트 핸들러 ---
  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const handleDateClick = (day, status) => {
    // disabled 상태면 클릭 방지
    if (status.disabled) {
      alert(`[${status.label || "휴일"}] 예약이 불가능합니다.`);
      return;
    }
    setSelectedDate(formatDate(day));
    setView("form");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSchedules([...schedules, { id: Date.now(), date: selectedDate, ...formData }]);
    alert(`${formData.name}님의 일정이 등록되었습니다!`);
    setFormData({ name: "", time: "09:00", content: "" });
    setView("calendar");
  };

  // --- UI 렌더링 ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        
        <div className="bg-blue-600 p-4 text-white text-center">
          <h1 className="text-xl font-bold">📅 일정 예약 시스템</h1>
          <p className="text-sm opacity-80">공휴일 데이터 연동 완료 (Backendless)</p>
        </div>

        {view === "calendar" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full font-bold text-gray-600">&lt; 이전달</button>
              <h2 className="text-lg font-bold text-gray-800">{year}년 {month + 1}월</h2>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full font-bold text-gray-600">다음달 &gt;</button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
                <div key={day} className={`text-center text-sm font-bold py-2 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"}`}>{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`empty-${i}`}></div>)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const status = getDateStatus(day); // 상태 확인
                const hasSchedule = schedules.some((s) => s.date === formatDate(day));
                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                // 스타일 클래스
                let btnClass = "aspect-square border rounded-lg flex flex-col items-center justify-center relative transition ";
                if (status.disabled) {
                    btnClass += "bg-gray-100 text-gray-400 cursor-not-allowed border-transparent"; // 휴일 스타일
                } else if (isToday) {
                    btnClass += "bg-blue-50 border-blue-500 font-bold text-blue-600";
                } else {
                    btnClass += "hover:bg-gray-50 text-gray-700";
                }

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day, status)}
                    disabled={status.disabled} // 버튼 비활성화
                    className={btnClass}
                  >
                    <span className={status.type === "holiday" ? "text-red-400 font-bold" : ""}>{day}</span>
                    {/* 공휴일 이름 표시 */}
                    {status.type === "holiday" && <span className="text-[10px] text-red-500 truncate w-full text-center absolute bottom-1">{status.label}</span>}
                    {hasSchedule && !status.disabled && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full"></span>}
                  </button>
                );
              })}
            </div>
            
            {/* 리스트 뷰는 생략 혹은 기존 코드 유지 */}
          </div>
        )}
        
        {/* 입력 폼 뷰는 기존과 동일하여 생략 (그대로 사용하시면 됩니다) */}
        {view === "form" && (
           <div className="p-6">
             <button onClick={() => setView("calendar")} className="text-sm text-gray-500 mb-4">← 뒤로가기</button>
             <h2 className="text-xl font-bold mb-6">{selectedDate} 예약하기</h2>
             <form onSubmit={handleSubmit} className="space-y-4">
               {/* ... 기존 폼 내용 ... */}
               <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border p-2 rounded" placeholder="이름" />
               <button className="w-full bg-blue-600 text-white py-3 rounded-lg">예약하기</button>
             </form>
           </div>
        )}
      </div>
    </div>
  );
}