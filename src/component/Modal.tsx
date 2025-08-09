import React from "react";
import type { Category, Task } from "../types/EventType";

interface ModalProps {
  editingTask: Task | null;
  newTaskRange: { start: string; end: string } | null;
  taskCategory: Category;
  setTaskCategory: React.Dispatch<React.SetStateAction<Category>>;
  setTaskName: React.Dispatch<React.SetStateAction<string>>;
  setCreateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setNewTaskRange: React.Dispatch<
  React.SetStateAction<{ start: string; end: string } | null>
  >;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setEditingTask: React.Dispatch<React.SetStateAction<Task | null>>;
  taskName: string;
  createTask: () => void;
  COLORS: Record<Category, string>;
}

const Modal: React.FC<ModalProps> = ({
  editingTask,
  newTaskRange,
  setTaskCategory,
  setTaskName,
  setCreateModalOpen,
  setNewTaskRange,
  taskCategory,
  setTasks,
  setEditingTask,
  taskName,
  createTask,
  COLORS,
}) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
      <div className="bg-white p-4 rounded shadow w-96">
        <h3 className="text-lg font-medium mb-2">
          {editingTask ? "Edit Task" : "Create Task"}
        </h3>
        <div className="mb-2 text-sm text-gray-600">
          {editingTask
            ? `${editingTask.start} → ${editingTask.end}`
            : newTaskRange
            ? `${newTaskRange.start} → ${newTaskRange.end}`
            : ""}
        </div>
        <input
          className="w-full border p-2 mb-2"
          placeholder="Task name"
          value={editingTask ? taskName : taskName}
          onChange={(e) => setTaskName(e.target.value)}
        />
        <select
          className="w-full border p-2 mb-4"
          value={editingTask ? taskCategory : taskCategory}
          onChange={(e) => setTaskCategory(e.target.value as Category)}
        >
          <option>To Do</option>
          <option>In Progress</option>
          <option>Review</option>
          <option>Completed</option>
        </select>
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1 rounded border"
            onClick={() => {
              setCreateModalOpen(false);
              setEditingTask(null);
              setNewTaskRange(null);
            }}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white"
            onClick={() => {
              if (editingTask) {
                // Update existing task
                setTasks((s) =>
                  s.map((t) =>
                    t.id === editingTask.id
                      ? {
                          ...t,
                          name: taskName,
                          category: taskCategory,
                          color: COLORS[taskCategory],
                        }
                      : t
                  )
                );
                setEditingTask(null);
              } else {
                // Create new task (same as before)
                createTask();
              }
              setCreateModalOpen(false);
              setNewTaskRange(null);
            }}
          >
            {editingTask ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
