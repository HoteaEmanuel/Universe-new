import type { Request, Response } from "express";
import {
  createReportForUser,
  DuplicateReportError,
  ReportRateLimitError,
  SelfReportError,
} from "../services/report.service.js";
import type { CreateReportInput } from "../schemas/report.schema.js";

export const createReportController = async (req: Request, res: Response) => {
  try {
    const reporterId = req.userId as string;
    const body = req.body as CreateReportInput;
    const report = await createReportForUser({ ...body, reporterId });
    return res.status(201).json({ message: "Report submitted", report });
  } catch (error) {
    if (error instanceof SelfReportError) {
      return res.status(400).json({ message: error.message });
    }
    if (error instanceof DuplicateReportError) {
      return res.status(409).json({ message: error.message });
    }
    if (error instanceof ReportRateLimitError) {
      return res.status(429).json({ message: error.message });
    }
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Could not submit report",
    });
  }
};
