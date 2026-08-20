'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  User,
  Trash2,
  Check,
  Clock,
  Sparkles,
  Filter,
} from 'lucide-react'

export interface SpaceTaskItem {
  id: string
  title: string
  description?: string
  completed: boolean
  dueDate?: string
  assigneeName?: string
  assigneeAvatar?: string
  createdBy: string
  createdAt: string
}

interface SpaceTasksTabProps {
  currentUserId: string
  currentUserName: string
  spaceId: string
  spaceName: string
}

export const SpaceTasksTab: React.FC<SpaceTasksTabProps> = ({
  currentUserId,
  currentUserName,
  spaceId,
  spaceName,
}) => {
  // Space tasks state (starts empty)
  const [tasks, setTasks] = useState<SpaceTaskItem[]>([])

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState(currentUserName)
  const [isAdding, setIsAdding] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const newTask: SpaceTaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
      dueDate: newTaskDueDate || undefined,
      assigneeName: newTaskAssignee || currentUserName,
      createdBy: currentUserName,
      createdAt: new Date().toISOString(),
    }

    setTasks([newTask, ...tasks])
    setNewTaskTitle('')
    setNewTaskDueDate('')
    setIsAdding(false)
  }

  const toggleTaskCompleted = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)] select-none">
      {/* Top Header & Actions */}
      <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--md-sys-color-surface-container)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
            <span>Space Tasks</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
              {completedCount}/{tasks.length} Completed
            </span>
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Action items and deliverables for #{spaceName}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Filters */}
          <div className="flex items-center gap-1 bg-[var(--md-sys-color-surface-container-high)] p-0.5 rounded-full border border-[var(--md-sys-color-outline-variant)]">
            {(['all', 'pending', 'completed'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] shadow-2xs font-bold'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold hover:opacity-95 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Task Creation Inline Form */}
      {isAdding && (
        <form
          onSubmit={handleAddTask}
          className="p-4 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="space-y-3 max-w-xl">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40"
            />

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]">
                <Calendar className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                <input
                  type="text"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  placeholder="Due date (e.g. Tomorrow, Friday)"
                  className="bg-transparent border-none text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none w-36"
                />
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]">
                <User className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                <input
                  type="text"
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  placeholder="Assignee name"
                  className="bg-transparent border-none text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none w-32"
                />
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-4 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  Save Task
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 opacity-60" />
            </div>
            <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-1">
              No tasks found
            </h4>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-sm">
              Keep your team aligned by tracking todos and deliverables right inside this space.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-start justify-between p-3.5 rounded-2xl border transition-all group ${
                task.completed
                  ? 'bg-[var(--md-sys-color-surface-container-low)]/50 border-[var(--md-sys-color-outline-variant)]/50 opacity-70'
                  : 'bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] border-[var(--md-sys-color-outline-variant)] shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1 pr-3">
                <button
                  type="button"
                  onClick={() => toggleTaskCompleted(task.id)}
                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                    task.completed
                      ? 'bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] text-white'
                      : 'border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-lowest)]'
                  }`}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <div className="min-w-0">
                  <h5
                    className={`text-xs sm:text-sm font-semibold transition-all ${
                      task.completed
                        ? 'line-through text-[var(--md-sys-color-on-surface-variant)]'
                        : 'text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    {task.title}
                  </h5>

                  {task.description && (
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {task.dueDate && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>{task.dueDate}</span>
                      </span>
                    )}

                    {task.assigneeName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]">
                        <User className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                        <span>{task.assigneeName}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
