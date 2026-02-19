import { holidays } from '@kyungseopk1m/holidays-kr';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2024년부터 2045년까지 (22년치)
const START_YEAR = 2024;
const END_YEAR = 2045;
// app/data 디렉토리가 없으면 생성해야 함
const OUTPUT_DIR = path.join(__dirname, '../app/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'holidays.json');

async function generate() {
  const allHolidays = {};
  
  console.log(`Generating holidays from ${START_YEAR} to ${END_YEAR}...`);

  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (e) {
    console.log("Directory might already exist or error creating it:", e);
  }

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const yearStr = year.toString();
    console.log(`Fetching ${year}...`);
    try {
      // 라이브러리가 API를 호출함
      const response = await holidays(yearStr);
      
      // 라이브러리 응답 구조: { success: true, api: ..., data: [...] }
      if (response) {
         if (Array.isArray(response.data)) {
            allHolidays[yearStr] = response.data;
         } else if (Array.isArray(response)) {
            // 혹시라도 형식이 다를 경우 대비
            allHolidays[yearStr] = response;
         } else {
             console.warn(`Unexpected data format for ${year}, saving raw response just in case but likely empty.`);
             allHolidays[yearStr] = [];
         }
      } else {
        console.warn(`No response for ${year}`);
        allHolidays[yearStr] = [];
      }
      
      // API Rate Limit 방지를 위해 약간의 지연
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (e) {
      console.error(`Error fetching ${year}:`, e);
      allHolidays[yearStr] = [];
    }
  }

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(allHolidays, null, 2), 'utf-8');
  console.log(`Saved ${Object.keys(allHolidays).length} years of data to ${OUTPUT_FILE}`);
}

generate();
