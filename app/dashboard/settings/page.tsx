'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, LogOut, Bell, Lock, User } from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = useState({
    notifications: true,
    email_updates: true,
    darkMode: true,
  });
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      alert('Preferences saved!');
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-slate-400 mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid grid-cols-3 bg-slate-800 border border-slate-700">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-300">Email</label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-900 border-slate-700 text-slate-400 mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">Full Name</label>
                <Input
                  value={user?.full_name || ''}
                  disabled
                  className="bg-slate-900 border-slate-700 text-slate-400 mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">Role</label>
                <Input
                  value={user?.role || 'user'}
                  disabled
                  className="bg-slate-900 border-slate-700 text-slate-400 mt-1 capitalize"
                />
              </div>

              <p className="text-xs text-slate-400 mt-6">
                To update your account information, please contact support.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Push Notifications</p>
                  <p className="text-sm text-slate-400">Receive push notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={(e) =>
                    setPreferences({ ...preferences, notifications: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Email Updates</p>
                  <p className="text-sm text-slate-400">Receive email updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email_updates}
                  onChange={(e) =>
                    setPreferences({ ...preferences, email_updates: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Dark Mode</p>
                  <p className="text-sm text-slate-400">Use dark theme</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.darkMode}
                  onChange={(e) =>
                    setPreferences({ ...preferences, darkMode: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </div>

              <Button
                onClick={handleSavePreferences}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300 mb-4">
                Manage your security and account access settings.
              </p>

              <Button variant="outline" className="w-full text-slate-300">
                Change Password
              </Button>

              <Button variant="outline" className="w-full text-slate-300">
                View Login History
              </Button>

              <div className="pt-6 border-t border-slate-700">
                <p className="text-sm text-slate-400 mb-4">
                  Sign out of your account and return to the login page.
                </p>
                <Button
                  onClick={handleLogout}
                  className="w-full gap-2 bg-red-900/20 text-red-400 hover:bg-red-900/30"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
