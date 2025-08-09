import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { COLORS, type Category, type Task } from "../types/EventType";

interface ICalenderProps {
  weeks: Date[][];
  filteredTasks: Task[];
  setTaskCategory: React.Dispatch<React.SetStateAction<Category>>;
  setTaskName: React.Dispatch<React.SetStateAction<string>>;
  setCreateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setNewTaskRange: React.Dispatch<
    React.SetStateAction<{ start: string; end: string } | null>
  >;
  setEditingTask: React.Dispatch<React.SetStateAction<Task | null>>;
  tasks: Task[];
  viewMonth: Date;
}
const Calendar: React.FC<ICalenderProps> = ({
  weeks,
  filteredTasks,
  setTaskCategory,
  setTaskName,
  setCreateModalOpen,
  setNewTaskRange,
  setEditingTask,
  tasks,
  viewMonth,
}) => {
  const today = new Date();
  const todayStart = startOfDay(new Date());
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [viewMonth]
  );

  const dateIndex = (dIso: string) => {
    const idx = days.findIndex((d) => iso(d) === dIso);
    return idx;
  };
  const [selecting, setSelecting] = useState<{
    startIndex: number;
    endIndex: number;
  } | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  function onTileMouseDown(idx: number) {
    setIsMouseDown(true);
    setSelecting({ startIndex: idx, endIndex: idx });
  }
  function onTileMouseEnter(idx: number) {
    if (!isMouseDown || !selecting) return;
    setSelecting({ ...selecting, endIndex: idx });
  }
  function onGlobalMouseUp() {
    if (isMouseDown && selecting) {
      openCreateModalForIndices(selecting.startIndex, selecting.endIndex);
    }
    setSelecting(null);
    setIsMouseDown(false);
  }

  useEffect(() => {
    window.addEventListener("mouseup", onGlobalMouseUp);
    return () => window.removeEventListener("mouseup", onGlobalMouseUp);
  }, [isMouseDown, selecting]);
  function openCreateModalForIndices(a: number, b: number) {
    const [s, e] = a <= b ? [a, b] : [b, a];
    const start = iso(days[s]);
    const end = iso(days[e]);
    setNewTaskRange({ start, end });
    setTaskName("");
    setTaskCategory("To Do");
    setCreateModalOpen(true);
  }
  const dragState = useRef<{
    mode: null | "move" | "resize-left" | "resize-right";
    taskId?: string;
    initialMouseIndex?: number;
    initialTaskStart?: string;
    initialTaskEnd?: string;
  }>({ mode: null });

  function onTaskMouseDown(
    e: React.MouseEvent,
    taskId: string,
    mode: "move" | "resize-left" | "resize-right"
  ) {
    e.stopPropagation();
    (e.nativeEvent as any).preventDefault?.();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    dragState.current = {
      mode,
      taskId,
      initialMouseIndex: mousePosToDayIndex(
        (e as any).clientX,
        (e as any).clientY
      ),
      initialTaskStart: task.start,
      initialTaskEnd: task.end,
    };
  }
  function mousePosToDayIndex(clientX: number, clientY: number) {
    if (typeof document === "undefined") return 0;
    const els = (document as any).elementsFromPoint
      ? (document as any).elementsFromPoint(clientX, clientY)
      : [document.elementFromPoint(clientX, clientY)];
    for (const el of els) {
      if (!(el instanceof HTMLElement)) continue;
      const dayEl = el.closest("[data-day-index]") as HTMLElement | null;
      if (dayEl && dayEl.dataset.dayIndex !== undefined) {
        return Number(dayEl.dataset.dayIndex);
      }
    }

    // fallback: compute using calendar grid bounding rect
    const grid = document.querySelector(
      "[data-month-grid]"
    ) as HTMLElement | null;
    if (grid) {
      const rect = grid.getBoundingClientRect();
      const cols = 7;
      const rows = Math.ceil(days.length / cols);
      const colWidth = rect.width / cols;
      const rowHeight = rect.height / rows;
      const col = Math.floor((clientX - rect.left) / colWidth);
      const row = Math.floor((clientY - rect.top) / rowHeight);
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        return row * cols + col;
      }
    }

    return 0;
  }
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
                          <div className="font-bold  text-zinc-500">
                            Today
                          </div>
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
