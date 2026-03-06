import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { useAuth } from '../../context/AuthContext';
import {
    Plus, Search, Filter, Clock, CheckCircle,
    AlertTriangle, User, MoreVertical, Calendar,
    Shield, ArrowRight, MessageSquare, Briefcase,
    Zap, Star, ThumbsUp
} from 'lucide-react';
import { getDatabase, ref, onValue, push, update, serverTimestamp } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { sanitizeKey } from '../../utils/firebaseUtils';

const TaskBoard = () => {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        deadline: '',
        assignedTo: ''
    });

    useEffect(() => {
        if (!currentUser?.department) return;

        const db = getDatabase();
        const sanitizedDept = sanitizeKey(currentUser.department);
        const tasksRef = ref(db, `tasks/${sanitizedDept}`);

        const unsubscribe = onValue(tasksRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                setTasks(list);
            } else {
                setTasks([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser?.department]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            const db = getDatabase();
            const sanitizedDept = sanitizeKey(currentUser.department);
            const tasksRef = ref(db, `tasks/${sanitizedDept}`);

            await push(tasksRef, {
                ...newTask,
                status: 'Todo',
                createdBy: currentUser.firstName + ' ' + currentUser.lastName,
                timestamp: serverTimestamp(),
                department: currentUser.department
            });

            toast.success("Assignment Deployed");
            setShowAddModal(false);
            setNewTask({ title: '', description: '', priority: 'Medium', deadline: '', assignedTo: '' });
        } catch (error) {
            toast.error("Deployment Failed");
        }
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            const db = getDatabase();
            const sanitizedDept = sanitizeKey(currentUser.department);
            await update(ref(db, `tasks/${sanitizedDept}/${taskId}`), {
                status: newStatus
            });
            toast.success(`Task shifted to ${newStatus}`);
        } catch (error) {
            toast.error("Shift Failed");
        }
    };

    const columns = [
        { id: 'Todo', label: 'Backlog', icon: <Briefcase size={16} className="text-slate-400" /> },
        { id: 'In Progress', label: 'In Action', icon: <Zap size={16} className="text-blue-500" /> },
        { id: 'Completed', label: 'Finalized', icon: <CheckCircle size={16} className="text-green-500" /> }
    ];

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                            Strategic Ops <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black text-blue-600 border border-slate-200 dark:border-slate-700">{currentUser?.department}</span>
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Coordinate field assignments and operational milestones</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-6 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 transition-transform active:scale-95"
                    >
                        <Plus size={18} /> Deploy Assignment
                    </button>
                </div>

                {/* Task Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {columns.map(column => (
                        <div key={column.id} className="flex flex-col h-full min-h-[600px] bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 transition-colors">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                                        {column.icon}
                                    </div>
                                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">{column.label}</h3>
                                </div>
                                <span className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm border border-slate-200 dark:border-slate-700">
                                    {tasks.filter(t => t.status === column.id).length}
                                </span>
                            </div>

                            <div className="space-y-4 flex-1">
                                {tasks.filter(t => t.status === column.id).map(task => (
                                    <div
                                        key={task.id}
                                        className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl">
                                                <MoreVertical size={14} className="text-slate-400" />
                                            </button>
                                        </div>

                                        <div className="mb-4">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                                                task.priority === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                {task.priority || 'Medium'} Priority
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2 uppercase leading-tight">{task.title}</h4>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-6 line-clamp-2 italic">"{task.description}"</p>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700/50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                    {task.assignedTo?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{task.assignedTo || 'Unassigned'}</span>
                                            </div>

                                            <div className="flex gap-1">
                                                {column.id !== 'Todo' && (
                                                    <button
                                                        onClick={() => updateTaskStatus(task.id, column.id === 'Completed' ? 'In Progress' : 'Todo')}
                                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
                                                    >
                                                        <ArrowRight size={14} className="rotate-180" />
                                                    </button>
                                                )}
                                                {column.id !== 'Completed' && (
                                                    <button
                                                        onClick={() => updateTaskStatus(task.id, column.id === 'Todo' ? 'In Progress' : 'Completed')}
                                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-blue-600 transition-colors"
                                                    >
                                                        <ArrowRight size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {tasks.filter(t => t.status === column.id).length === 0 && (
                                    <div className="py-12 flex flex-col items-center justify-center opacity-30">
                                        <div className="w-12 h-12 border-2 border-dashed border-slate-400 rounded-2xl flex items-center justify-center mb-2">
                                            <Calendar size={20} className="text-slate-400" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inactive</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Task Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-8">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Deploy New Assignment</h3>

                            <form onSubmit={handleAddTask} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mission Title</label>
                                        <input required type="text" className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-0" placeholder="e.g., Road Blockade Deployment" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational Brief</label>
                                        <textarea required className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-600 dark:text-slate-300 placeholder-slate-400 outline-none focus:ring-0 resize-none h-24" placeholder="Detail the objectives and requirements..." value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })}></textarea>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority Factor</label>
                                            <select className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-0" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                                                <option value="Low">Standard</option>
                                                <option value="Medium">Urgent</option>
                                                <option value="High">Critical</option>
                                            </select>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Field Lead</label>
                                            <input required type="text" className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-0" placeholder="Officer Name" value={newTask.assignedTo} onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors">Abort</button>
                                    <button type="submit" className="flex-2 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform px-12">Commit Assignment</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default TaskBoard;
