'use client';

import { useState } from 'react';

export default function FixFlatNumberPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const applyFix = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/fix-flat-number', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        let resultText = `✅ ${data.message}\n\n`;
        resultText += `TBD profiles found: ${data.tbd_profiles_found}\n\n`;
        resultText += 'Existing profiles:\n';
        resultText += '================\n';

        data.existing_profiles.forEach(
          (profile: { id: string; email?: string; flat_number: string }) => {
            resultText += `ID: ${profile.id}\n`;
            resultText += `Email: ${profile.email || 'N/A'}\n`;
            resultText += `Flat Number: ${profile.flat_number}\n`;
            resultText += '---\n';
          }
        );

        resultText += '\nUpdated profiles:\n';
        resultText += '================\n';

        data.updated_profiles.forEach(
          (profile: { id: string; email?: string; flat_number: string }) => {
            resultText += `ID: ${profile.id}\n`;
            resultText += `Email: ${profile.email || 'N/A'}\n`;
            resultText += `Flat Number: ${profile.flat_number}\n`;
            resultText += '---\n';
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
          Fix Flat Number Constraint Error
        </h1>

        <div className="bg-red-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-red-800">Problem</h2>
          <p className="text-red-700 mb-4">
            The signup error is caused by a duplicate flat number constraint
            violation:
          </p>
          <div className="bg-red-100 p-4 rounded border border-red-200">
            <code className="text-sm text-red-800">
              ERROR: duplicate key value violates unique constraint
              &quot;profiles_flat_number_key&quot; (SQLSTATE 23505)
            </code>
          </div>
          <p className="text-red-700 mt-4">
            The profile creation trigger is trying to insert &apos;TBD&apos; as
            the flat number, but this value already exists in the database.
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Solution</h2>
          <p className="text-blue-700 mb-4">The fix will:</p>
          <ul className="list-disc list-inside space-y-2 text-blue-700">
            <li>
              Update any existing &apos;TBD&apos; flat numbers to unique values
            </li>
            <li>
              Make the flat_number column nullable to avoid constraint issues
            </li>
            <li>
              Update the trigger to use unique default values based on user ID
            </li>
            <li>Recreate the trigger with the fixed function</li>
          </ul>
        </div>

        <button
          onClick={applyFix}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium mb-6"
        >
          {loading ? 'Applying Fix...' : 'Apply Flat Number Fix'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Fix Results:</h3>
            <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Manual Fix Instructions:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
            <li>Go to Supabase Dashboard → SQL Editor</li>
            <li>
              Copy and paste the contents of{' '}
              <code>fix-flat-number-constraint.sql</code>
            </li>
            <li>Run the SQL to apply the fix</li>
            <li>Try signing up with a new user</li>
          </ol>
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">After Fix:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
            <li>Signup should work without constraint violations</li>
            dddd
            <li>Users can update their flat number in their profile</li>
            <li>The trigger will work correctly for future signups</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
