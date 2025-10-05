'use client';

import { useState } from 'react';

export default function RemoveFlatUniquenessPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const applyFix = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/remove-flat-uniqueness', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        let resultText = `✅ ${data.message}\n\n`;
        resultText += `${data.note}\n\n`;
        resultText += 'Current profiles:\n';
        resultText += '================\n';

        data.profiles.forEach(
          (profile: { flat_number: string; email: string }) => {
            resultText += `Flat: ${profile.flat_number} - Email: ${profile.email}\n`;
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
          Remove Flat Number Uniqueness
        </h1>

        <div className="bg-red-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-red-800">Problem</h2>
          <p className="text-red-700 mb-4">
            The signup flow is failing because of a unique constraint on the
            flat_number field. This prevents multiple users from having the same
            flat number, which is not necessary for the gym scheduling system.
          </p>
          <div className="bg-red-100 p-4 rounded border border-red-200">
            <code className="text-sm text-red-800">
              ERROR: duplicate key value violates unique constraint
              &quot;profiles_flat_number_key&quot;
            </code>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Solution</h2>
          <p className="text-blue-700 mb-4">
            Remove the unique constraint on the flat_number field to allow
            multiple users to have the same flat number. This simplifies the
            signup flow and removes unnecessary restrictions.
          </p>
          <ul className="list-disc list-inside space-y-2 text-blue-700">
            <li>Remove unique constraint on flat_number</li>
            <li>Allow multiple users with same flat number</li>
            <li>Simplify signup flow</li>
            <li>Remove constraint violation errors</li>
          </ul>
        </div>

        <button
          onClick={applyFix}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium mb-6"
        >
          {loading ? 'Removing Constraint...' : 'Remove Flat Number Uniqueness'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Results:</h3>
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
              <code>remove-flat-uniqueness.sql</code>
            </li>
            <li>Run the SQL to remove the constraint</li>
            <li>Try signing up with a new user</li>
          </ol>
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">After Fix:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
            <li>Multiple users can have the same flat number</li>
            <li>Signup flow will be simplified</li>
            <li>No more constraint violation errors</li>
            <li>Users can sign up without restrictions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
