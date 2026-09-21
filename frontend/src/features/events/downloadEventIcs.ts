import axios, { AxiosError } from "axios";

// Kept app-local rather than folded into packages/shared/src/api/events.ts:
// it needs a `Blob` response and browser-only download mechanics
// (`URL.createObjectURL`, an anchor click), and packages/shared must stay
// DOM-free. `HttpClient`'s `get()` also has no `responseType` support, so
// this goes straight through axios rather than the shared api layer.
const API_URL = import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";

export const downloadEventIcs = async (id: string, title: string) => {
  try {
    const response = await axios.get(`${API_URL}/events/${id}/calendar.ics`, {
      responseType: "blob",
    });
    const objectUrl = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${title}.ics`;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    const message =
      (error as AxiosError<{ message?: string }>)?.response?.data?.message ||
      "Could not download calendar file";
    throw new Error(message);
  }
};
