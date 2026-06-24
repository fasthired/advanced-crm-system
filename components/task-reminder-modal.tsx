'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { taskApi, followUpApi, reminderApi, activityApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BellRing, Check, Clock, X, CheckCircle2 } from 'lucide-react';

interface DueItem {
  id: string;
  type: 'task' | 'follow_up' | 'reminder';
  title: string;
  description?: string;
  dueTime: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function TaskReminderModal() {
  const { user } = useAuth();
  const [dueItems, setDueItems] = useState<DueItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dismissedIdsRef = useRef<Set<string>>(new Set());
  const checkedSessionRef = useRef(false);

  const priorityColors = {
    low: 'bg-slate-500/10 text-slate-400 border-slate-700/50',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-700/50',
    high: 'bg-orange-500/10 text-orange-400 border-orange-700/50',
    urgent: 'bg-red-500/10 text-red-400 border-red-700/50',
  };

  const typeLabels = {
    task: { label: 'Task', color: 'bg-blue-500/10 text-blue-400 border-blue-700/50' },
    follow_up: { label: 'Follow-up', color: 'bg-purple-500/10 text-purple-400 border-purple-700/50' },
    reminder: { label: 'Reminder', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-700/50' },
  };

  const fetchDueItems = async () => {
    if (!user?.id) return;
    try {
      const now = new Date();
      const [tasks, followUps, reminders] = await Promise.all([
        taskApi.getAll(user.id),
        followUpApi.getAll(user.id),
        reminderApi.getAll(user.id),
      ]);

      const items: DueItem[] = [];

      // Filter Overdue Tasks
      (tasks || []).forEach((t: any) => {
        if (t.status !== 'completed' && t.status !== 'cancelled' && t.due_date) {
          const dueTime = new Date(t.due_date);
          if (dueTime <= now) {
            items.push({
              id: t.id,
              type: 'task',
              title: t.title,
              description: t.description || undefined,
              dueTime: t.due_date,
              priority: t.priority || 'medium',
            });
          }
        }
      });

      // Filter Overdue Follow-ups
      (followUps || []).forEach((f: any) => {
        if (!f.completed && f.scheduled_date) {
          const schedTime = new Date(f.scheduled_date);
          if (schedTime <= now) {
            items.push({
              id: f.id,
              type: 'follow_up',
              title: `Follow-up: ${f.description || 'No description'}`,
              description: f.follow_up_type ? `Type: ${f.follow_up_type}` : undefined,
              dueTime: f.scheduled_date,
              priority: f.priority || 'medium',
            });
          }
        }
      });

      // Filter Overdue Reminders
      (reminders || []).forEach((r: any) => {
        if (!r.completed && r.scheduled_time) {
          const schedTime = new Date(r.scheduled_time);
          if (schedTime <= now) {
            items.push({
              id: r.id,
              type: 'reminder',
              title: r.title,
              description: r.description || undefined,
              dueTime: r.scheduled_time,
              priority: r.priority || 'medium',
            });
          }
        }
      });

      // Sort by due date (most overdue first)
      items.sort((a, b) => new Date(a.dueTime).getTime() - new Date(b.dueTime).getTime());

      // Filter out items already dismissed by the user during this runtime
      const filtered = items.filter(item => !dismissedIdsRef.current.has(item.id));
      
      setDueItems(filtered);

      // Auto-open modal if there are due items we haven't dismissed
      if (filtered.length > 0) {
        setIsOpen(true);
      }
    } catch (err) {
      console.error('Error checking due items:', err);
    }
  };

  // Check on login (mount)
  useEffect(() => {
    if (!user?.id) return;

    // Check sessionStorage to verify if we already did the initial login popup check
    const alreadyChecked = sessionStorage.getItem('login_reminders_checked');
    if (!alreadyChecked && !checkedSessionRef.current) {
      checkedSessionRef.current = true;
      sessionStorage.setItem('login_reminders_checked', 'true');
      fetchDueItems();
    }

    // Set background polling every 60 seconds to detect new task deadlines in real-time
    const interval = setInterval(() => {
      fetchDueItems();
    }, 60000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const handleComplete = async (item: DueItem) => {
    try {
      if (item.type === 'task') {
        await taskApi.update(item.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
        });
        await activityApi.log({
          user_id: user!.id,
          activity_type: 'task_updated',
          entity_type: 'task',
          entity_id: item.id,
          description: `Task status changed to completed (from reminder popup)`,
        });
      } else if (item.type === 'follow_up') {
        await followUpApi.complete(item.id, 'Completed from login reminder popup');
        await activityApi.log({
          user_id: user!.id,
          activity_type: 'follow_up_completed',
          entity_type: 'follow_up',
          entity_id: item.id,
          description: 'Follow-up marked as completed (from reminder popup)',
        });
      } else if (item.type === 'reminder') {
        await reminderApi.complete(item.id);
        await activityApi.log({
          user_id: user!.id,
          activity_type: 'reminder_completed',
          entity_type: 'reminder',
          entity_id: item.id,
          description: 'Reminder marked as completed (from reminder popup)',
        });
      }

      // Add to dismissed reference so it doesn't pop up again
      dismissedIdsRef.current.add(item.id);
      
      // Update local state
      const updated = dueItems.filter(i => i.id !== item.id);
      setDueItems(updated);

      if (updated.length === 0) {
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Error completing item:', err);
    }
  };

  const handleDismiss = () => {
    // Add all current due items to dismissed list so they don't prompt again during this session
    dueItems.forEach(i => dismissedIdsRef.current.add(i.id));
    setIsOpen(false);
  };

  if (!isOpen || dueItems.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700/80 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-700/60 flex items-center justify-between bg-slate-800/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/15 text-blue-400 rounded-xl animate-pulse">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Attention Needed</h3>
              <p className="text-xs text-slate-400 mt-0.5">You have {dueItems.length} pending deadlines reached</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content - Scrollable List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 max-h-[50vh] scrollbar-thin scrollbar-thumb-slate-700">
          {dueItems.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-slate-900/60 border border-slate-700/40 rounded-xl flex items-start justify-between gap-3 group hover:border-slate-600/50 transition-all duration-200"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${typeLabels[item.type].color} border capitalize text-[10px] px-2 py-0.5`}>
                    {typeLabels[item.type].label}
                  </Badge>
                  <Badge className={`${priorityColors[item.priority]} border capitalize text-[10px] px-2 py-0.5`}>
                    {item.priority}
                  </Badge>
                </div>
                <h4 className="font-semibold text-sm text-white group-hover:text-blue-400 transition-colors leading-tight">
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-red-400 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Deadline: {new Date(item.dueTime).toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                size="icon"
                onClick={() => handleComplete(item)}
                className="bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/20 hover:border-green-600 rounded-xl transition-all duration-200 flex-shrink-0 self-center"
                title="Mark Completed"
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/60 bg-slate-900/40 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="text-slate-300 hover:text-white hover:bg-slate-700/40 px-4 rounded-xl"
          >
            Snooze All
          </Button>
        </div>
      </div>
    </div>
  );
}
