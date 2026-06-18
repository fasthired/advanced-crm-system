'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Copy, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function SetupPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Setup Required</h1>
          <p className="text-muted-foreground">Complete these steps to get your CRM running</p>
        </div>

        {/* Warning */}
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex gap-4">
            <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive mb-1">Supabase Credentials Missing</p>
              <p className="text-sm text-muted-foreground">
                Your environment variables are not configured. Follow the steps below to set up your CRM.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 1 */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-semibold text-primary">1</div>
              <CardTitle className="text-lg">Create Supabase Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold">a.</span>
                <span>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com</a></span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">b.</span>
                <span>Sign up with your email</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">c.</span>
                <span>Create a new project (region doesn&apos;t matter)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">d.</span>
                <span>Wait for the project to initialize (about 1 minute)</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-semibold text-primary">2</div>
              <CardTitle className="text-lg">Run Database Schema</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3 text-muted-foreground">
                <span className="text-primary font-bold">a.</span>
                <span>Open the <code className="bg-muted px-2 py-1 rounded text-xs">supabase-setup.sql</code> file in your project</span>
              </li>
              <li className="flex gap-3 text-muted-foreground">
                <span className="text-primary font-bold">b.</span>
                <span>Copy all the SQL code</span>
              </li>
              <li className="flex gap-3 text-muted-foreground">
                <span className="text-primary font-bold">c.</span>
                <span>In Supabase dashboard, go to SQL Editor</span>
              </li>
              <li className="flex gap-3 text-muted-foreground">
                <span className="text-primary font-bold">d.</span>
                <span>Click &quot;New Query&quot; and paste the SQL code</span>
              </li>
              <li className="flex gap-3 text-muted-foreground">
                <span className="text-primary font-bold">e.</span>
                <span>Click the &quot;Run&quot; button</span>
              </li>
              <li className="flex gap-3 text-muted-foreground">
                <span className="text-primary font-bold">f.</span>
                <span>Wait for it to complete (you&apos;ll see the 9 tables created)</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-semibold text-primary">3</div>
              <CardTitle className="text-lg">Get Your Credentials</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold">a.</span>
                <span>In Supabase dashboard, click Settings (gear icon)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">b.</span>
                <span>Go to API</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">c.</span>
                <span>Copy the <strong>Project URL</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">d.</span>
                <span>Copy the <strong>anon public</strong> key (under Project API keys)</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Step 4 */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-semibold text-primary">4</div>
              <CardTitle className="text-lg">Create .env.local File</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a file named <code className="bg-muted px-2 py-1 rounded text-xs">.env.local</code> in your project root with:
            </p>
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">NEXT_PUBLIC_SUPABASE_URL</p>
                <div className="flex gap-2">
                  <code className="flex-1 text-sm bg-background p-2 rounded text-foreground font-mono break-all">NEXT_PUBLIC_SUPABASE_URL=your_project_url_here</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard('NEXT_PUBLIC_SUPABASE_URL=', 'url')}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
                <div className="flex gap-2">
                  <code className="flex-1 text-sm bg-background p-2 rounded text-foreground font-mono break-all">NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard('NEXT_PUBLIC_SUPABASE_ANON_KEY=', 'key')}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Replace <code className="bg-muted px-2 py-1 rounded text-xs">your_project_url_here</code> and <code className="bg-muted px-2 py-1 rounded text-xs">your_anon_key_here</code> with your actual credentials from Supabase.
            </p>
          </CardContent>
        </Card>

        {/* Step 5 */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-semibold text-primary">5</div>
              <CardTitle className="text-lg">Restart Dev Server</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold">a.</span>
                <span>Stop your dev server (Ctrl+C)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">b.</span>
                <span>Run <code className="bg-muted px-2 py-1 rounded text-xs">pnpm dev</code> again</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">c.</span>
                <span>Refresh your browser</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Final Step */}
        <Card className="border-accent/50 bg-accent/5">
          <CardContent className="pt-6 flex gap-4">
            <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-accent mb-1">Ready to Go!</p>
              <p className="text-sm text-muted-foreground">
                After completing these steps, you&apos;ll see the login page. Click &quot;Sign up&quot; to create your account and start using your CRM!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Check that all environment variable names are spelled correctly (they&apos;re case-sensitive)</p>
            <p>• Make sure you&apos;re using the <strong>anon public</strong> key, not the service role key</p>
            <p>• The .env.local file must be in your project root directory</p>
            <p>• After creating .env.local, you must restart your dev server</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
