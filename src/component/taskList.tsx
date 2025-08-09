import React from "react";
import type { Task } from "../types/EventType";

const TaskList = ({
  tasks,
  setTasks,
}: {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) => {
  return (
    <div className="mt-4">
      <h4 className="font-semibold">Tasks ({tasks.length})</h4>
      <div className="space-y-2 mt-2">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="flex justify-between items-center border p-2 rounded "
          >
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-gray-500">
                {t.start} → {t.end} • {t.category}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 border rounded text-sm"
                onClick={() =>
                  setTasks((s: Task[]) => s.filter((x) => x.id !== t.id))
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;
