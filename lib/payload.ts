import { z } from "zod";
import { databaseSchema } from "./taskhelper-models";
const keyPatterns = {
  hanzi: /^hanzi-(practice|daily-dictation)-/,
  guwen: /^guwen-(leyuan-(learning-v2|read-v1)$|dictation-handwriting-v1:)/,
};
export function validatePayload(tool: string, payload: unknown) {
  if (tool === "taskhelper") return databaseSchema.strict().parse(payload);
  const pattern = keyPatterns[tool as keyof typeof keyPatterns];
  if (!pattern) throw new Error("Unknown tool");
  return z
    .record(
      z.string().max(200).regex(pattern),
      z
        .string()
        .max(1048576)
        .refine((v) => {
          try {
            const value = JSON.parse(v);
            return value !== null && typeof value === "object";
          } catch {
            return false;
          }
        }, "Storage values must contain JSON objects or arrays"),
    )
    .refine((v) => Object.keys(v).length <= 2000, "Too many storage keys")
    .parse(payload);
}
