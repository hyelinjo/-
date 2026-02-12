export default function ScheduleListModal({ date, schedules, onClose, onAdd }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 헤더 */}
        <div className="bg-green-600 p-4 text-white flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold">{date} 교육일정 목록</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl font-bold">&times;</button>
        </div>

        {/* 일정 리스트 (스크롤 가능) */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {schedules.length === 0 ? (
            <p className="text-center text-gray-500 py-4">등록된 일정이 없습니다.</p>
          ) : (
            schedules
              .sort((a, b) => a.start_time.localeCompare(b.start_time)) // 시간순 정렬
              .map((schedule) => (
              <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full border border-green-200">
                      {schedule.department} 
                    </span>
                    <span className="font-bold text-gray-800 text-lg">{schedule.name}</span>
                  </div>
                  <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {schedule.start_time} ~ {schedule.end_time}
                  </span>
                </div>
                <p className="text-gray-600 text-sm whitespace-pre-wrap pl-1 border-l-2 border-gray-300">
                  {schedule.content || "내용 없음"}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 shrink-0">
          <button 
            onClick={onAdd}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition flex items-center justify-center gap-2"
          >
            <span>➕</span> 신청하기
          </button>
        </div>

      </div>
    </div>
  );
}