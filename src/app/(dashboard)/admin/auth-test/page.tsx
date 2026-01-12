'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, XCircle, Loader2, LogOut, User, Mail, Lock } from 'lucide-react';

interface TestStep {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
}

export default function AuthTestPage() {
  const { user, session, signOut, loading } = useAuth();
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addStep = (name: string, status: TestStep['status'], message?: string) => {
    setTestSteps((prev) => [...prev, { name, status, message }]);
  };

  const resetTest = () => {
    setTestSteps([]);
  };

  const testSignOut = async () => {
    addStep('Testing Sign Out', 'running');
    try {
      await signOut();
      // Wait a bit for state to update
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Check if we're redirected (this will be checked by the page state)
      addStep('Sign Out Complete', 'passed', 'User signed out successfully');
    } catch (error: any) {
      addStep('Sign Out Failed', 'failed', error.message);
    }
  };

  const testAuthState = () => {
    resetTest();
    setIsRunning(true);

    addStep('Check Initial Auth State', user ? 'passed' : 'failed', 
      user ? `User is logged in: ${user.email}` : 'No user logged in');

    addStep('Check Session State', session ? 'passed' : 'failed',
      session ? 'Session exists' : 'No session');

    addStep('Check Loading State', !loading ? 'passed' : 'failed',
      loading ? 'Still loading' : 'Not loading');

    setIsRunning(false);
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Authentication Test Page</h1>
        <p className="text-muted-foreground">
          Test the authentication flow: sign out, create account, sign in
        </p>
      </div>

      {/* Current Auth State */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <User size={20} />
          Current Auth State
        </h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">User:</span>
            <span className="text-foreground font-mono">
              {user ? user.email : 'Not logged in'}
            </span>
            {user ? (
              <CheckCircle2 className="text-success" size={16} />
            ) : (
              <XCircle className="text-destructive" size={16} />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Session:</span>
            <span className="text-foreground font-mono">
              {session ? 'Active' : 'No session'}
            </span>
            {session ? (
              <CheckCircle2 className="text-success" size={16} />
            ) : (
              <XCircle className="text-destructive" size={16} />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Loading:</span>
            <span className="text-foreground font-mono">
              {loading ? 'Yes' : 'No'}
            </span>
            {loading ? (
              <Loader2 className="text-primary animate-spin" size={16} />
            ) : (
              <CheckCircle2 className="text-success" size={16} />
            )}
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Test Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={testAuthState}
            disabled={isRunning}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors disabled:opacity-50"
          >
            Test Auth State
          </button>
          {user && (
            <button
              onClick={testSignOut}
              disabled={isRunning}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <LogOut size={16} />
              Test Sign Out
            </button>
          )}
          <button
            onClick={resetTest}
            disabled={isRunning}
            className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            Reset Test
          </button>
        </div>
      </div>

      {/* Test Steps */}
      {testSteps.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Test Results</h2>
          <div className="space-y-2">
            {testSteps.map((step, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  step.status === 'passed'
                    ? 'bg-success/10 border-success/20'
                    : step.status === 'failed'
                    ? 'bg-destructive/10 border-destructive/20'
                    : step.status === 'running'
                    ? 'bg-primary/10 border-primary/20'
                    : 'bg-muted border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  {step.status === 'passed' && <CheckCircle2 className="text-success" size={16} />}
                  {step.status === 'failed' && <XCircle className="text-destructive" size={16} />}
                  {step.status === 'running' && <Loader2 className="text-primary animate-spin" size={16} />}
                  <span className="font-medium text-foreground">{step.name}</span>
                </div>
                {step.message && (
                  <p className="text-sm text-muted-foreground mt-1 ml-6">{step.message}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-card border border-border rounded-lg p-6 mt-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Testing Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>If you're logged in, click "Test Sign Out" to test the sign out functionality</li>
          <li>After signing out, navigate to <code className="bg-muted px-1 rounded">/signup</code> to create a new account</li>
          <li>Fill in the signup form with a new email and password</li>
          <li>Check your email for the confirmation link (if email confirmations are enabled)</li>
          <li>Click the confirmation link to verify your email</li>
          <li>Navigate to <code className="bg-muted px-1 rounded">/login</code> and sign in with your new account</li>
          <li>Verify you can access the dashboard and other protected routes</li>
        </ol>
      </div>

      {/* Quick Links */}
      <div className="bg-card border border-border rounded-lg p-6 mt-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Links</h2>
        <div className="flex flex-wrap gap-4">
          <a
            href="/login"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors flex items-center gap-2"
          >
            <Mail size={16} />
            Login Page
          </a>
          <a
            href="/signup"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors flex items-center gap-2"
          >
            <Lock size={16} />
            Signup Page
          </a>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

