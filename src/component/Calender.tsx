import {
  differenceInCalendarDays,
  format,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";
import React from "react";
import { COLORS, type Category, type Task } from "../types/EventType";

interface ICalenderProps {
  weeks: Date[][];
  filteredTasks: Task[];
  setTaskCategory: React.Dispatch<React.SetStateAction<Category>>;
  setTaskName: React.Dispatch<React.SetStateAction<string>>;
  setEditingTask: React.Dispatch<React.SetStateAction<Task | null>>;
  viewMonth: Date;
  onTileMouseDown: Function;
  onTileMouseEnter: Function;
  onTaskMouseDown: (
    e: React.MouseEvent,
    taskId: string,
    mode: "move" | "resize-left" | "resize-right"
  ) => void;

  dateIndex: (date: string) => number;
  selecting: { startIndex: number; endIndex: number } | null;
}

const Calendar: React.FC<ICalenderProps> = ({
  weeks,
   filteredTasks,
   setTaskCategory,
   setTaskName,
   setEditingTask,
  viewMonth,
   onTileMouseDown,
   onTaskMouseDown,
   dateIndex,
   onTileMouseEnter,
   selecting,
}) => {
  const today = new Date();
  const todayStart = startOfDay(new Date());

  return (
    <div
      className="grid grid-cols-7 gap-1 border rounded overflow-hidden select-none"
      data-month-grid
    >
      {/* day names */}
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div
          key={d}
          className="text-center py-2 bg-gray-50 border-b font-medium"
        >
          {d}
        </div>
      ))}

      {weeks.map((week, wIdx) => {
        const weekStartIdx = wIdx * 7;
        const weekEndIdx = weekStartIdx + 6;

        const tasksThisWeek = filteredTasks.filter((t) => {
          const s = dateIndex(t.start);
          const e = dateIndex(t.end);
          return !(e < weekStartIdx || s > weekEndIdx);
        });

        return (
          <div key={wIdx} className="relative col-span-7">
            {/* day row */}
            <div className="grid grid-cols-7 gap-1 relative">
              {week.map((day, idx) => {
                const globalIdx = weekStartIdx + idx;
                const isInMonth = day.getMonth() === viewMonth.getMonth();
                const selectingHere =
                  selecting &&
                  globalIdx >=
                    Math.min(selecting.startIndex, selecting.endIndex) &&
                  globalIdx <=
                    Math.max(selecting.startIndex, selecting.endIndex);
                const isToday = isSameDay(day, today);
                return (
                  <div
                    key={globalIdx}
                    data-day-index={globalIdx}
                    onMouseDown={() => onTileMouseDown(globalIdx)}
                    onMouseEnter={() => onTileMouseEnter(globalIdx)}
                    className={`h-48 p-1 border ${
                      selectingHere
                        ? "bg-blue-500/30"
                        : !isInMonth
                        ? "bg-gray-100 text-gray-400"
                        : "bg-white"
                    }`}
                  >
                    <div className="text-xs mb-1 top-20 items-center">
                      <div>
                        {format(day, "d")}{" "}
                        {isToday && (
                          <div className="font-bold  text-zinc-500">Today</div>
                        )}{" "}
                      </div>
                    </div>

                    {/* NOTE: per-cell labels removed — bars are rendered in the overlay below */}
                  </div>
                );
              })}
            </div>

            {/* Overlay grid for task bars (absolute so it sits on top of the day cells) */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="grid grid-cols-7 gap-1 pt-5 h-48">
                {tasksThisWeek.map((t) => {
                  const startIdx = dateIndex(t.start);
                  const endIdx = dateIndex(t.end);

                  if (startIdx === -1 || endIdx === -1) return null;

                  const barStart = Math.max(startIdx, weekStartIdx);
                  const barEnd = Math.min(endIdx, weekEndIdx);

                  // gridColumn for spanning columns inside the 7-column overlay grid
                  const gridCol = `${(barStart % 7) + 1} / ${(barEnd % 7) + 2}`;

                  // show name only in first chunk
                  const showName = barStart === startIdx;
                  const isOverdue = isBefore(parseISO(t.end), todayStart);
                  const colorForDisplay =
                    t.category === "Completed"
                      ? COLORS["Completed"] // always green for Completed
                      : isOverdue
                      ? "bg-red-600" // red for overdue non-completed
                      : COLORS[t.category];
                  return (
                    <div
                      key={`${t.id}-w${wIdx}`}
                      // the bar itself must be pointer-enabled for drag/resize
                      className={`pointer-events-auto mt-1 rounded text-white flex items-center h-5 ${colorForDisplay}`}
                      style={{
                        gridColumn: gridCol,
                        alignSelf: "center",
                        zIndex: 10,
                      }}
                      onMouseDown={(e) => onTaskMouseDown(e, t.id, "move")}
                      onClick={() => {
                        setEditingTask(t);
                        setTaskName(t.name);
                        setTaskCategory(t.category);
                      }}
                      title={`${t.name} • ${t.category} • ${t.start} → ${t.end}`}
                    >
                      {/* Left handle (only if this chunk is the task start) */}
                      {barStart === startIdx && (
                        <div
                          className="w-2 h-full cursor-ew-resize"
                          onMouseDown={(e) =>
                            onTaskMouseDown(e, t.id, "resize-left")
                          }
                        />
                      )}

                      <div className="flex-1 px-1 truncate text-xs  flex items-center justify-center">
                        {showName
                          ? `${t.name} ${
                              differenceInCalendarDays(
                                parseISO(t.end),
                                parseISO(t.start)
                              ) +
                                1 >
                              1
                                ? `(${
                                    differenceInCalendarDays(
                                      parseISO(t.end),
                                      parseISO(t.start)
                                    ) + 1
                                  }d)`
                                : ""
                            }`
                          : ""}
                      </div>

                      {/* Right handle (only if this chunk is the task end) */}
                      {barEnd === endIdx && (
                        <div
                          className="w-2 h-full cursor-ew-resize"
                          onMouseDown={(e) =>
                            onTaskMouseDown(e, t.id, "resize-right")
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Calendar;
