"use client";

import React, { useState } from "react";

const INITIAL_FORM_DATA = {
  name: "",
  department: "",
  startTime: "09:00",
  endTime: "18:00",
  content: "",
};

export default function ScheduleForm({ selectedDate, onBack, onSubmit, selectedRegion }) { // Added selectedRegion prop
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [showHelpModal, setShowHelpModal] = useState(false); // New state for help modal

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.startTime >= formData.endTime) {
      alert("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    onSubmit({ ...formData, region: selectedRegion }); // Pass selectedRegion to onSubmit
    setFormData(INITIAL_FORM_DATA);
  };

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="text-base text-gray-500 mb-6 hover:text-gray-800 flex items-center"
      >
        ← 뒤로가기
      </button>
      <h2 className="text-3xl font-bold mb-8">{selectedDate} 예약하기</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Display selected region - optional, for user clarity */}
        {selectedRegion && (
            <div className="mb-4">
                <label className="block text-lg font-medium mb-2">선택 권역</label>
                <input
                    type="text"
                    value={selectedRegion.toUpperCase()}
                    className="w-full border p-3 rounded-lg text-lg bg-gray-100"
                    disabled
                />
            </div>
        )}
        <div>
          <label className="block text-lg font-medium mb-2">시간</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-lg font-medium mb-2">시작 시간</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full border p-3 rounded-lg text-lg"
              />
            </div>
            <div>
              <label className="block text-lg font-medium mb-2">종료 시간</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full border p-3 rounded-lg text-lg"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-lg font-medium mb-2">기관명</label>
          <input
            type="text"
            name="department"
            required
            value={formData.department}
            onChange={handleInputChange}
            className="w-full border p-3 rounded-lg text-lg"
            placeholder="부산FP지원단 루키트레이닝센터"
          />
        </div>
        <div>
          <label className="block text-lg font-medium mb-2">신청자 성명</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            className="w-full border p-3 rounded-lg text-lg"
            placeholder="홍길동"
          />
        </div>
        <div>
          <label className="block text-lg font-medium mb-2">내용</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows="4"
            className="w-full border p-3 rounded-lg text-lg"
          ></textarea>
        </div>
        <div className="flex justify-between items-center gap-4">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="flex-1 bg-blue-500 text-white py-4 rounded-xl text-xl font-bold hover:bg-blue-600 transition"
          >
            도움말
          </button>
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white py-4 rounded-xl text-xl font-bold hover:bg-green-700 transition"
          >
            예약하기
          </button>
        </div>
      </form>

      {showHelpModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-2xl font-bold mb-4">예약 안내</h3>
            <p className="mb-2">
              <strong>이름:</strong> 본인 확인을 위해 정확한 이름을 입력해주세요.
            </p>
            <p className="mb-2">
              <strong>기관명:</strong> 소속된 기관 또는 단체명을 입력해주세요.
            </p>
            <p className="mb-2">
              <strong>시간:</strong> 시작 시간은 종료 시간보다 빨라야 합니다.
            </p>
            <p className="mb-4">
              <strong>내용:</strong> 예약 목적을 상세히 기재해주세요.
            </p>
            <p className="mb-4 text-red-600 font-bold">
              교육 신청시 취소가 되지않습니다. 각 권역 담당자에게 문의하세요.
            </p>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-blue-500 text-white py-3 rounded-lg text-lg font-bold hover:bg-blue-600 transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
