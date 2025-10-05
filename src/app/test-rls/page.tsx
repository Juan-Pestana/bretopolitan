'use client';

import { useState } from 'react';

export default function TestRLSPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testRLS = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/test-rls');
      const data = await response.json();

      if (data.success) {
        let resultText = `✅ ${data.message}\n\n`;
        resultText += 'Test Results:\n';
        resultText += '================\n';

        data.results.forEach(
          (test: { test_name: string; result: string; details: string }) => {
            resultText += `${test.test_name}: ${test.result}\n`;
            if (test.details) {
              resultText += `  Details: ${test.details}\n`;
            }
            resultText += '\n';
          }
        );

        setResult(resultText);
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
        <h1 className="text-3xl font-bold mb-8">
          Row-Level Security (RLS) Test
        </h1>

        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">What is RLS?</h2>
          <p className="text-gray-700 mb-4">
            Row-Level Security (RLS) is a database security feature that
            controls access to rows in a table based on the characteristics of
            the user executing a query. This ensures that users can only access
            and modify data they&apos;re authorized to see.
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Profiles Table Policies:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Users can view/update their own profile</li>
                <li>Admins can view/update all profiles</li>
                <li>Role changes only by admins</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Bookings Table Policies:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Everyone can view all bookings (availability)</li>
                <li>Users can manage their own bookings</li>
                <li>Admins can manage all bookings</li>
                <li>Trainers can delete their own bookings</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={testRLS}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium mb-6"
        >
          {loading ? 'Testing RLS...' : 'Test RLS Policies'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">RLS Test Results:</h3>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Setup Instructions:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
            <li>Make sure you&apos;ve run the database schema first</li>
            <li>Go to Supabase Dashboard → SQL Editor</li>
            <li>
              Copy and paste the contents of <code>rls-policies.sql</code>
            </li>
            <li>Run the SQL to create RLS policies</li>
            <li>Click the test button above to verify</li>
          </ol>
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">
            Security Features:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
            <li>
              <strong>Data Isolation:</strong> Users can only see their own data
            </li>
            <li>
              <strong>Role-Based Access:</strong> Different permissions for
              neighbors, trainers, and admins
            </li>
            <li>
              <strong>Booking Visibility:</strong> Everyone can see
              availability, but only manage their own bookings
            </li>
            <li>
              <strong>Admin Override:</strong> Admins have full access for
              management purposes
            </li>
            <li>
              <strong>Database-Level Security:</strong> Policies enforced at the
              database level, not just application level
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
