// src/utils/dateUtils.ts
import { parseISO, isBefore, startOfDay } from "date-fns";

export const todayStart = startOfDay(new Date());

export function isTaskOverdue(endDateISO: string): boolean {
  return isBefore(parseISO(endDateISO), todayStart);
}
