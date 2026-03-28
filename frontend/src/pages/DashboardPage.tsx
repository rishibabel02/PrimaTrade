import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LayoutList, LogOut, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { tasksApi, type Task, type TaskFilters } from '../api/tasks';
import { getErrorMessage } from '../utils/errorMessage';

const STATUS_OPTIONS: Array<{ value: TaskFilters['status'] | ''; label: string }> = [
    { value: '', label: 'All statuses' },
    { value: 'TODO', label: 'To do' },
    { value: 'IN_PROGRESS', label: 'In progress' },
    { value: 'DONE', label: 'Done' },
];

const PRIORITY_OPTIONS: Array<{ value: TaskFilters['priority'] | ''; label: string }> = [
    { value: '', label: 'All priorities' },
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
];

function statusChipClass(status: Task['status']) {
    if (status === 'DONE') return 'chip chip-done';
    if (status === 'IN_PROGRESS') return 'chip chip-in-progress';
    return 'chip chip-todo';
}

function priorityChipClass(priority: Task['priority']) {
    if (priority === 'HIGH') return 'chip chip-high';
    if (priority === 'MEDIUM') return 'chip chip-medium';
    return 'chip chip-low';
}

function toDatetimeLocal(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const emptyForm = {
    title: '',
    description: '',
    status: 'TODO' as Task['status'],
    priority: 'MEDIUM' as Task['priority'],
    dueDate: '',
};

export function DashboardPage() {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<TaskFilters['status'] | ''>('');
    const [priorityFilter, setPriorityFilter] = useState<TaskFilters['priority'] | ''>('');
    const [page, setPage] = useState(1);

    const [counts, setCounts] = useState({ todo: 0, inProgress: 0, done: 0, all: 0 });

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Task | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [formSaving, setFormSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter, priorityFilter]);

    const loadTasks = useCallback(async () => {
        setLoading(true);
        try {
            const filters: TaskFilters = {
                page,
                limit: 10,
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(statusFilter && { status: statusFilter }),
                ...(priorityFilter && { priority: priorityFilter }),
            };
            const res = await tasksApi.list(filters);
            setTasks(res.data.data);
            setMeta(res.data.meta);
        } catch (err) {
            toast.error(getErrorMessage(err, 'Could not load tasks'));
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, statusFilter, priorityFilter]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [todo, prog, done, all] = await Promise.all([
                    tasksApi.list({ status: 'TODO', limit: 1 }),
                    tasksApi.list({ status: 'IN_PROGRESS', limit: 1 }),
                    tasksApi.list({ status: 'DONE', limit: 1 }),
                    tasksApi.list({ limit: 1 }),
                ]);
                if (cancelled) return;
                setCounts({
                    todo: todo.data.meta.total,
                    inProgress: prog.data.meta.total,
                    done: done.data.meta.total,
                    all: all.data.meta.total,
                });
            } catch {
                /* stats are optional */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [tasks.length]);

    function openCreate() {
        setEditing(null);
        setForm(emptyForm);
        setFormOpen(true);
    }

    function openEdit(task: Task) {
        setEditing(task);
        setForm({
            title: task.title,
            description: task.description ?? '',
            status: task.status,
            priority: task.priority,
            dueDate: toDatetimeLocal(task.dueDate),
        });
        setFormOpen(true);
    }

    async function submitForm(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim()) {
            toast.error('Title is required');
            return;
        }
        setFormSaving(true);
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                status: form.status,
                priority: form.priority,
                dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
            };
            if (editing) {
                await tasksApi.update(editing.id, payload);
                toast.success('Task updated');
            } else {
                await tasksApi.create(payload);
                toast.success('Task created');
            }
            setFormOpen(false);
            loadTasks();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Save failed'));
        } finally {
            setFormSaving(false);
        }
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        setDeleteBusy(true);
        try {
            await tasksApi.delete(deleteTarget.id);
            toast.success('Task deleted');
            setDeleteTarget(null);
            loadTasks();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Delete failed'));
        } finally {
            setDeleteBusy(false);
        }
    }

    const initials = user?.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="app-layout">
            <header className="navbar">
                <div className="navbar-brand">
                    <div className="navbar-logo">P</div>
                    <span>PrimaTrade</span>
                </div>
                <nav className="navbar-nav" aria-label="Main">
                    <span className="nav-link active">
                        <LayoutList size={18} />
                        Tasks
                    </span>
                </nav>
                <div className="navbar-user">
                    <div className="user-badge">
                        <div className="user-avatar">{initials}</div>
                        <span>{user?.name}</span>
                        <span className={`role-chip ${user?.role === 'ADMIN' ? 'admin' : 'user'}`}>
                            {user?.role}
                        </span>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => logout()}>
                        <LogOut size={16} />
                        Log out
                    </button>
                </div>
            </header>

            <main className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Task dashboard</h1>
                    <p className="page-subtitle">
                        {user?.role === 'ADMIN'
                            ? 'You see all users’ tasks. Create, edit, or delete as needed.'
                            : 'Your tasks — JWT-protected CRUD against the REST API.'}
                    </p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'var(--accent-dim)' }}>
                            <LayoutList color="var(--accent)" size={22} />
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{counts.all}</div>
                            <div className="stat-label">Total tasks</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <div className="stat-value">{counts.todo}</div>
                            <div className="stat-label">To do</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <div className="stat-value">{counts.inProgress}</div>
                            <div className="stat-label">In progress</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <div className="stat-value">{counts.done}</div>
                            <div className="stat-label">Done</div>
                        </div>
                    </div>
                </div>

                <div className="tasks-toolbar">
                    <div className="search-input-wrap">
                        <Search className="search-icon" size={18} />
                        <input
                            className="search-input"
                            placeholder="Search title or description…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search tasks"
                        />
                    </div>
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter((e.target.value || '') as TaskFilters['status'] | '')}
                    >
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.label} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                    <select
                        className="filter-select"
                        value={priorityFilter}
                        onChange={(e) =>
                            setPriorityFilter((e.target.value || '') as TaskFilters['priority'] | '')
                        }
                    >
                        {PRIORITY_OPTIONS.map((o) => (
                            <option key={o.label} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                    <button type="button" className="btn btn-secondary" onClick={openCreate}>
                        <Plus size={18} />
                        New task
                    </button>
                </div>

                {loading ? (
                    <div className="loading-screen" style={{ minHeight: 240 }}>
                        <div className="spinner" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <div className="empty-title">No tasks yet</div>
                        <p className="empty-subtitle">Create your first task or adjust filters.</p>
                        <button type="button" className="btn btn-primary" style={{ width: 'auto' }} onClick={openCreate}>
                            <Plus size={18} />
                            New task
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="tasks-grid">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="task-card"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openEdit(task)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            openEdit(task);
                                        }
                                    }}
                                >
                                    <div
                                        className="task-status-dot"
                                        style={{
                                            background:
                                                task.status === 'DONE'
                                                    ? 'var(--success)'
                                                    : task.status === 'IN_PROGRESS'
                                                      ? 'var(--warning)'
                                                      : 'var(--text-muted)',
                                        }}
                                    />
                                    <div className="task-info">
                                        <div className={`task-title ${task.status === 'DONE' ? 'done' : ''}`}>
                                            {task.title}
                                        </div>
                                        {task.description && (
                                            <div className="task-description">{task.description}</div>
                                        )}
                                        <div className="task-meta">
                                            <span className={statusChipClass(task.status)}>{task.status.replace('_', ' ')}</span>
                                            <span className={priorityChipClass(task.priority)}>{task.priority}</span>
                                            {user?.role === 'ADMIN' && (
                                                <span className="text-muted" style={{ fontSize: 11 }}>
                                                    {task.user.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-icon"
                                            aria-label="Edit task"
                                            onClick={() => openEdit(task)}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-icon text-danger"
                                            aria-label="Delete task"
                                            onClick={() => setDeleteTarget(task)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {meta.totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    type="button"
                                    className="page-btn"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    Previous
                                </button>
                                <span className="text-muted" style={{ fontSize: 13 }}>
                                    Page {meta.page} of {meta.totalPages}
                                </span>
                                <button
                                    type="button"
                                    className="page-btn"
                                    disabled={page >= meta.totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {formOpen && (
                <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
                    <div className="modal">
                        <div className="modal-header">
                            <h2 id="task-modal-title" className="modal-title">
                                {editing ? 'Edit task' : 'New task'}
                            </h2>
                            <button
                                type="button"
                                className="btn btn-ghost btn-icon"
                                aria-label="Close"
                                onClick={() => setFormOpen(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={submitForm}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="task-title">
                                        Title
                                    </label>
                                    <input
                                        id="task-title"
                                        className="form-input"
                                        value={form.title}
                                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="task-desc">
                                        Description
                                    </label>
                                    <textarea
                                        id="task-desc"
                                        className="form-textarea"
                                        value={form.description}
                                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group flex gap-12">
                                    <div className="flex-1">
                                        <label className="form-label" htmlFor="task-status">
                                            Status
                                        </label>
                                        <select
                                            id="task-status"
                                            className="form-input"
                                            value={form.status}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, status: e.target.value as Task['status'] }))
                                            }
                                        >
                                            <option value="TODO">To do</option>
                                            <option value="IN_PROGRESS">In progress</option>
                                            <option value="DONE">Done</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="form-label" htmlFor="task-priority">
                                            Priority
                                        </label>
                                        <select
                                            id="task-priority"
                                            className="form-input"
                                            value={form.priority}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    priority: e.target.value as Task['priority'],
                                                }))
                                            }
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="task-due">
                                        Due date
                                    </label>
                                    <input
                                        id="task-due"
                                        className="form-input"
                                        type="datetime-local"
                                        value={form.dueDate}
                                        onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ width: 'auto', padding: '10px 20px' }}
                                    disabled={formSaving}
                                >
                                    {formSaving ? 'Saving…' : editing ? 'Save changes' : 'Create task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Delete task</h2>
                            <button
                                type="button"
                                className="btn btn-ghost btn-icon"
                                aria-label="Close"
                                onClick={() => setDeleteTarget(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="confirm-msg">
                                Delete <strong>{deleteTarget.title}</strong>? This cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                disabled={deleteBusy}
                                onClick={confirmDelete}
                            >
                                {deleteBusy ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
