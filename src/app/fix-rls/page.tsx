'use client';

import { useState } from 'react';

export default function FixRLSPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const applyFix = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/fix-rls', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setResult(
          `✅ ${data.message}\n\nRLS policies have been fixed to avoid infinite recursion.`
        );
      } else {
        setResult(`❌ ${data.error}\nDetails: ${data.details}`);
      }
    } catch (error) {
      setResult(
        `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Fix RLS Infinite Recursion</h1>

        <div className="bg-red-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-red-800">Problem</h2>
          <p className="text-red-700 mb-4">
            The original RLS policies were causing infinite recursion because
            they were checking the user&apos;s role by querying the profiles
            table from within a policy on the profiles table.
          </p>
          <div className="bg-red-100 p-4 rounded border border-red-200">
            <code className="text-sm text-red-800">
              &quot;infinite recursion detected in policy for relation
              &quot;profiles&quot;&quot;
            </code>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Solution</h2>
          <p className="text-blue-700 mb-4">
            The fixed policies use a simpler approach that avoids recursion:
          </p>
          <ul className="list-disc list-inside space-y-2 text-blue-700">
            <li>Users can only access their own profile data</li>
            <li>Everyone can view all bookings (for availability)</li>
            <li>Users can only manage their own bookings</li>
            <li>
              Admin and trainer logic will be handled in the application layer
            </li>
          </ul>
        </div>

        <button
          onClick={applyFix}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium mb-6"
        >
          {loading ? 'Applying Fix...' : 'Apply RLS Fix'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Manual Fix Instructions:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
            <li>Go to Supabase Dashboard → SQL Editor</li>
            <li>
              Copy and paste the contents of <code>rls-policies-fixed.sql</code>
            </li>
            <li>Run the SQL to apply the fixed policies</li>
            <li>Try logging in again</li>
          </ol>
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">After Fix:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
            <li>Authentication should work without recursion errors</li>
            <li>Users can log in and access their profiles</li>
            <li>Basic booking functionality will work</li>
            <li>
              Admin and trainer features will be implemented in the app layer
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
