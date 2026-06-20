'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { notificationApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCircle2, Info, AlertCircle, Trash2 } from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const data = await notificationApi.getAll(user.id);
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const updated = await notificationApi.markAsRead(id);
      setNotifications(notifications.map((n) => (n.id === id ? updated : n)));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.delete(id);
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead(user!.id);
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const typeIcons: Record<string, any> = {
    info: <Info className="w-4 h-4" />,
    warning: <AlertCircle className="w-4 h-4" />,
    success: <CheckCircle2 className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
    reminder: <Bell className="w-4 h-4" />,
  };

  const typeColors: Record<string, string> = {
    info: 'bg-blue-500/10 text-blue-400',
    warning: 'bg-yellow-500/10 text-yellow-400',
    success: 'bg-green-500/10 text-green-400',
    error: 'bg-red-500/10 text-red-400',
    reminder: 'bg-purple-500/10 text-purple-400',
  };

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  const NotificationItem = ({ notification }: any) => (
    <div
      className={`p-4 rounded-lg border flex items-start gap-3 ${
        notification.read
          ? 'bg-slate-900/30 border-slate-700/50'
          : 'bg-slate-800/50 border-slate-600'
      }`}
    >
      <div className={`p-2 rounded-full ${typeColors[notification.notification_type]}`}>
        {typeIcons[notification.notification_type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${notification.read ? 'text-slate-400' : 'text-white'}`}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-sm text-slate-400 mt-1">{notification.message}</p>
        )}
        <p className="text-xs text-slate-500 mt-2">
          {new Date(notification.created_at).toLocaleString()}
        </p>
      </div>
      <div className="flex gap-2">
        {!notification.read && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleMarkAsRead(notification.id)}
            className="text-blue-400 hover:text-blue-300"
          >
            Mark read
          </Button>
        )}
        {user?.role === 'admin' && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDelete(notification.id)}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Notifications
          </h1>
          <p className="text-slate-400 mt-1">Stay updated with your CRM activity</p>
        </div>
        {unread.length > 0 && (
          <Button onClick={handleMarkAllAsRead} className="bg-blue-600 hover:bg-blue-700">
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <Card className="bg-slate-800/50">
          <CardContent className="p-8 text-center text-slate-400">Loading notifications...</CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="unread" className="space-y-6">
          <TabsList className="grid grid-cols-2 bg-slate-800 border border-slate-700">
            <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
            <TabsTrigger value="read">Read ({read.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="space-y-3">
            {unread.length === 0 ? (
              <Card className="bg-slate-800/50">
                <CardContent className="p-8 text-center text-slate-400">All caught up!</CardContent>
              </Card>
            ) : (
              unread.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))
            )}
          </TabsContent>

          <TabsContent value="read" className="space-y-3">
            {read.length === 0 ? (
              <Card className="bg-slate-800/50">
                <CardContent className="p-8 text-center text-slate-400">No read notifications</CardContent>
              </Card>
            ) : (
              read.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
