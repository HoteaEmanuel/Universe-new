import { File, FileSpreadsheet, FileText, FileType2 } from "lucide-react";

const WORD_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const EXCEL_MIME_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export const getFileTypeIcon = (mimeType: string) => {
  if (mimeType === "application/pdf") return FileText;
  if (WORD_MIME_TYPES.has(mimeType)) return FileType2;
  if (EXCEL_MIME_TYPES.has(mimeType)) return FileSpreadsheet;
  return File;
};

export const getFileTypeLabel = (mimeType: string): string => {
  if (mimeType === "application/pdf") return "PDF";
  if (WORD_MIME_TYPES.has(mimeType)) return "Word";
  if (EXCEL_MIME_TYPES.has(mimeType)) return "Excel";
  return "File";
};
