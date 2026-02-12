import { holidays } from "@kyungseopk1m/holidays-kr";
import Scheduler from "@/components/Scheduler";
import { getEvents, getRegions } from "@/lib/pythonApi"; // Import Python API functions

export default async function Home() {
  let holidaysData = [];
  let initialEvents = [];
  let regions = [];
  let initialRegion = "gangnam"; // Default region, can be set dynamically later

  try {
    // 1. 공공데이터 휴일 정보 가져오기
    //console.log("📡 공공데이터 요청 중...");
    const response = await holidays("2026");
    let items = null;

    if (Array.isArray(response.data)) {
      items = response.data;
    }

    if (items) {
      holidaysData = Array.isArray(items) ? items : [items];
    } else {
      console.warn("⚠️ 데이터를 찾았으나, 예상된 경로(items.item)에 데이터가 없습니다.");
      console.log("실제 데이터 내용:", JSON.stringify(response, null, 2).slice(0, 200) + "...");
    }

    // 2. Python Backend에서 지역 목록 가져오기
    regions = await getRegions();
    if (regions.length > 0) {
      initialRegion = regions[0]; // Set initial region to the first available region
    }
    // Optionally add 'all' as a region if needed, but it's not in Topic model
    // if (!regions.includes('all')) {
    //   regions.unshift('all');
    // }
    // if (!regions.includes(initialRegion)) {
    //   initialRegion = regions[0] || '';
    // }


    // 3. Python Backend에서 초기 일정 가져오기 (기본 지역에 대해)
    initialEvents = await getEvents(initialRegion);

  } catch (e) {
    console.error("❌ 데이터 가져오기 실패:", e);
  }

  return (
    <main>
      <Scheduler
        holidayData={holidaysData}
        initialEvents={initialEvents}
        regions={regions}
        initialRegion={initialRegion}
      />
    </main>
  );
}