'use client';

import { useState } from 'react';

export default function TestSupabasePage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [schemaResult, setSchemaResult] = useState<string>('');
  const [schemaLoading, setSchemaLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();

      if (data.success) {
        setResult(`✅ ${data.message}\nURL: ${data.url}`);
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

  const checkSchema = async () => {
    setSchemaLoading(true);
    setSchemaResult('');

    try {
      const response = await fetch('/api/check-schema');
      const data = await response.json();

      if (data.success) {
        setSchemaResult(
          `✅ ${data.message}\nProfiles: ${data.profilesCount || 'N/A'}\nBookings: ${data.bookingsCount || 'N/A'}`
        );
      } else {
        setSchemaResult(
          `❌ ${data.message}\nDetails: ${data.error || data.profilesError || data.bookingsError || 'Unknown error'}`
        );
      }
    } catch (error) {
      setSchemaResult(
        `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setSchemaLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>

        <div className="bg-gray-100 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Environment Variables Check
          </h2>
          <div className="space-y-2">
            <p>
              <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
            </p>
            <p>
              <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                ? '✅ Set'
                : '❌ Missing'}
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
          >
            {loading ? 'Testing...' : 'Test Supabase Connection'}
          </button>

          <button
            onClick={checkSchema}
            disabled={schemaLoading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
          >
            {schemaLoading ? 'Checking...' : 'Check Database Schema'}
          </button>

          <a
            href="/test-rls"
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium text-center"
          >
            Test RLS Policies
          </a>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Connection Test Result:</h3>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}

        {schemaResult && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Schema Check Result:</h3>
            <pre className="whitespace-pre-wrap text-sm">{schemaResult}</pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Setup Instructions:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
            <li>
              Create a <code>.env.local</code> file in the project root
            </li>
            <li>
              Add your Supabase URL and anon key from the Supabase dashboard
            </li>
            <li>Go to Supabase Dashboard → SQL Editor</li>
            <li>
              Copy and paste the contents of <code>database-schema.sql</code>
            </li>
            <li>Run the SQL to create the tables</li>
            <li>
              Copy and paste the contents of <code>rls-policies.sql</code>
            </li>
            <li>Run the SQL to create RLS policies</li>
            <li>Restart the development server</li>
            <li>Click the test buttons above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
