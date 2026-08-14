import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

interface ValidateSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

interface ValidationErrorDetail {
  path: string;
  message: string;
}

export const validate = (schemas: ValidateSchemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: ValidationErrorDetail[] = [];

    (Object.keys(schemas) as Array<keyof ValidateSchemas>).forEach((key) => {
      const schema = schemas[key];
      if (!schema) return;

      const result = schema.safeParse(req[key]);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            path: issue.path.length > 0 ? issue.path.join(".") : key,
            message: issue.message,
          })),
        );
        return;
      }

      Object.defineProperty(req, key, {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    });

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    next();
  };
};
