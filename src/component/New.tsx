import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Task } from "../types/EventType";
import Calendar from "./Calender";
import Modal from "./Modal";
import SearchBar from "./searchbar";
import TaskList from "./taskList";

// Simple types

// Helper utilities
const uid = () => Math.random().toString(36).slice(2, 9);
const COLORS = {
  "To Do": "bg-blue-400",
  "In Progress": "bg-yellow-400",
  Review: "bg-purple-400",
  Completed: "bg-green-400",
  Overdue: "bg-red-600",
};

export default function MonthPlanner() {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const todayStart = startOfDay(new Date());
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const raw = localStorage.getItem("month-planner-tasks");
      if (!raw) return [];
      return JSON.parse(raw) as Task[];
    } catch {
      return [];
    }
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    localStorage.setItem("month-planner-tasks", JSON.stringify(tasks));
  }, [tasks]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [viewMonth]
  );

  const [selecting, setSelecting] = useState<{
    startIndex: number;
    endIndex: number;
  } | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTaskRange, setNewTaskRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const [taskName, setTaskName] = useState("");
  const [taskCategory, setTaskCategory] = useState<Category>("To Do");

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilters, setCategoryFilters] = useState<
    Record<Category, boolean>
  >({
    "To Do": true,
    "In Progress": true,
    Review: true,
    Completed: true,
    Overdue: true,
  });
  const [timeFilter, setTimeFilter] = useState<0 | 7 | 14 | 21>(0);

  const dragState = useRef<{
    mode: null | "move" | "resize-left" | "resize-right";
    taskId?: string;
    initialMouseIndex?: number;
    initialTaskStart?: string;
    initialTaskEnd?: string;
  }>({ mode: null });

  const iso = (d: Date) => d.toISOString().slice(0, 10);

  function openCreateModalForIndices(a: number, b: number) {
    const [s, e] = a <= b ? [a, b] : [b, a];
    const start = iso(days[s]);
    const end = iso(days[e]);
    setNewTaskRange({ start, end });
    setTaskName("");
    setTaskCategory("To Do");
    setCreateModalOpen(true);
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

  function createTask() {
    if (!newTaskRange) return;
    const t: Task = {
      id: uid(),
      name: taskName || "Untitled",
      category: taskCategory,
      start: newTaskRange.start,
      end: newTaskRange.end,
      color: COLORS[taskCategory],
    };
    setTasks((s) => [...s, t]);
    setCreateModalOpen(false);
    setNewTaskRange(null);
  }

  //  elementsFromPoint to find underlying day tile;
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

  function onGlobalMouseMove(e: MouseEvent) {
    if (!dragState.current.mode || !dragState.current.taskId) return;
    const state = dragState.current;
    const currentIndex = mousePosToDayIndex(e.clientX, e.clientY);
    const initialIndex = state.initialMouseIndex ?? 0;
    const deltaDays = currentIndex - initialIndex;

    setTasks((prev) => {
      return prev.map((t) => {
        if (t.id !== state.taskId) return t;
        const sDate = parseISO(state.initialTaskStart!);
        const eDate = parseISO(state.initialTaskEnd!);
        if (state.mode === "move") {
          const newStart = addDays(sDate, deltaDays);
          const newEnd = addDays(eDate, deltaDays);
          return { ...t, start: iso(newStart), end: iso(newEnd) };
        } else if (state.mode === "resize-left") {
          let newStart = addDays(sDate, deltaDays);
          if (differenceInCalendarDays(parseISO(t.end), newStart) < 0) {
            newStart = parseISO(t.end);
          }
          return { ...t, start: iso(newStart) };
        } else if (state.mode === "resize-right") {
          const startDate = parseISO(t.start);

          // Use the exact day index from the mouse position
          let targetIdx = currentIndex;

          // Clamp to last index in `days` so you can resize to the last Saturday in view
          if (targetIdx > days.length - 1) {
            targetIdx = days.length - 1;
          }

          // Ensure we don't reverse start/end
          if (targetIdx < days.findIndex((d) => isSameDay(d, startDate))) {
            targetIdx = days.findIndex((d) => isSameDay(d, startDate));
          }

          // Set new end date
          const newEnd = days[targetIdx];
          return { ...t, end: iso(newEnd) };
        }

        return t;
      });
    });
  }

  function onGlobalMouseUpDrag() {
    dragState.current = { mode: null };
  }

  useEffect(() => {
    window.addEventListener("mousemove", onGlobalMouseMove);
    window.addEventListener("mouseup", onGlobalMouseUpDrag);
    return () => {
      window.removeEventListener("mousemove", onGlobalMouseMove);
      window.removeEventListener("mouseup", onGlobalMouseUpDrag);
    };
  }, []);

  const filteredTasks = tasks.filter((t) => {
    const taskEnd = parseISO(t.end);
    const isOverdue =
      isBefore(taskEnd, todayStart) && t.category !== "Completed";
    const categoryForFilter = isOverdue ? "Overdue" : t.category;

    if (
      searchQuery &&
      !t.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;

    if (!categoryFilters[categoryForFilter]) return false;

    if (timeFilter) {
      const start = parseISO(t.start);
      const end = parseISO(t.end);
      const cutoff = addDays(today, timeFilter);
      if (
        !isWithinInterval(start, { start: today, end: cutoff }) &&
        !isWithinInterval(end, { start: today, end: cutoff })
      )
        return false;
    }
    return true;
  });

  // weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="p-6 font-sans">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Month View Task Planner</h2>
        <div className="flex gap-2 items-center">
          <button
            className="px-3 py-1 rounded border"
            onClick={() => setViewMonth(addDays(viewMonth, -30))}
          >
            Prev
          </button>
          <div className="px-3 py-1">{format(viewMonth, "MMMM yyyy")}</div>
          <button
            className="px-3 py-1 rounded border"
            onClick={() => setViewMonth(addDays(viewMonth, 30))}
          >
            Next
          </button>
        </div>
      </div>
      {/* Controls */}
      <SearchBar
        setSearchQuery={setSearchQuery}
        searchQuery={searchQuery}
        setTimeFilter={setTimeFilter}
        timeFilter={timeFilter}
        setCategoryFilters={setCategoryFilters}
        categoryFilters={categoryFilters}
      />
      {/* Calendar grid*/}
      <Calendar
        filteredTasks={filteredTasks}
        setCreateModalOpen={setCreateModalOpen}
        setNewTaskRange={setNewTaskRange}
        setTaskCategory={setTaskCategory}
        setTaskName={setTaskName}
        setEditingTask={setEditingTask}
        weeks={weeks}
        tasks={tasks}
        viewMonth={viewMonth}
      />

      {/* modal */}
      {(createModalOpen || editingTask) && (
        <Modal
          createTask={createTask}
          editingTask={editingTask}
          newTaskRange={newTaskRange}
          setCreateModalOpen={setCreateModalOpen}
          COLORS={COLORS}
          setEditingTask={setEditingTask}
          setNewTaskRange={setNewTaskRange}
          setTaskCategory={setTaskCategory}
          setTaskName={setTaskName}
          setTasks={setTasks}
          taskCategory={taskCategory}
          taskName={taskName}
        />
      )}

      {/* Quick task list */}

      <TaskList tasks={filteredTasks} setTasks={setTasks} />

      <div className="mt-6 text-sm text-gray-500">
        Tip: Click and drag across days to create a task. Click a task and drag
        to move. Drag the left/right edges to resize.
      </div>
    </div>
  );
}
