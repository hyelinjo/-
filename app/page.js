"use client"; // Convert to Client Component

import { useState, useEffect } from "react";
import holidaysJson from "@/app/data/holidays.json";
import Scheduler from "@/components/Scheduler";

export default function Home() {
  const [holidaysData, setHolidaysData] = useState([]);
  const [initialEvents, setInitialEvents] = useState([]);

  // Hardcoded regions from the backend for static deployment
  const regions = ['gangbuk', 'gangnam', 'gyeongin', 'busan', 'jungbu', 'daegu', 'honam'];
  const initialRegion = regions[0] || "gangnam"; // Default region

  useEffect(() => {
    // Load static holiday data
    const allHolidays = Object.values(holidaysJson).flat().map(h => ({
      ...h,
      date: h.date.toString() // Ensure date is string if needed by component
    }));
    setHolidaysData(allHolidays);

    // initialEvents are intentionally left empty as the backend is not available.
    // setInitialEvents([]);
  }, []); // Empty dependency array ensures this runs once on mount

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