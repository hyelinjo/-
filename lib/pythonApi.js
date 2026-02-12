// lib/pythonApi.js
const API_BASE_URL = "/api"; // Will be proxied to Flask backend

export async function getEvents(region = '') {
  try {
    const url = region ? `${API_BASE_URL}/events?region=${region}` : `${API_BASE_URL}/events`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function addSchedule(scheduleData) {
  try {
    const response = await fetch(`${API_BASE_URL}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(scheduleData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error adding schedule:", error);
    return { status: "fail", message: "Error adding schedule" };
  }
}

export async function getRegions() {
  try {
    const response = await fetch(`${API_BASE_URL}/regions`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching regions:", error);
    return [];
  }
}

// TODO: Add other API functions like getTopics, edit, delete, etc.

