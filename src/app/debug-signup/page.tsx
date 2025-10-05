'use client';

import { useState } from 'react';

export default function DebugSignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    flat_number: '',
  });
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/debug-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        let resultText = `✅ ${data.message}\n\n`;
        resultText += `User ID: ${data.user.id}\n`;
        resultText += `Email: ${data.user.email}\n`;
        resultText += `Profile: ${JSON.stringify(data.profile, null, 2)}\n\n`;
        resultText += 'Debug Steps:\n';
        resultText += '================\n';

        data.debug.forEach(
          (step: {
            step: number;
            action?: string;
            success?: boolean;
            error?: string;
            code?: string | number;
          }) => {
            resultText += `Step ${step.step}: ${step.action || 'Result'}\n`;
            if (step.success) {
              resultText += `  ✅ Success\n`;
            } else if (step.error) {
              resultText += `  ❌ Error: ${step.error}\n`;
              if (step.code) {
                resultText += `  Code: ${step.code}\n`;
              }
            }
            resultText += '\n';
          }
        );

        setResult(resultText);
      } else {
        let resultText = `❌ ${data.error}\n\n`;
        if (data.debug) {
          resultText += 'Debug Steps:\n';
          resultText += '================\n';

          data.debug.forEach(
            (step: {
              step: number;
              action?: string;
              success?: boolean;
              error?: string;
              code?: string | number;
            }) => {
              resultText += `Step ${step.step}: ${step.action || 'Result'}\n`;
              if (step.success) {
                resultText += `  ✅ Success\n`;
              } else if (step.error) {
                resultText += `  ❌ Error: ${step.error}\n`;
                if (step.code) {
                  resultText += `  Code: ${step.code}\n`;
                }
              }
              resultText += '\n';
            }
          );
        }

        setResult(resultText);
      }
    } catch (error) {
      setResult(
        `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Signup Process</h1>

        <div className="bg-yellow-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">
            Purpose
          </h2>
          <p className="text-yellow-700 mb-4">
            This page helps debug the signup process by testing each step
            individually and showing detailed information about what&apos;s
            happening.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">Test Signup</h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="test@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="password123"
              />
            </div>

            <div>
              <label
                htmlFor="flat_number"
                className="block text-sm font-medium text-gray-700"
              >
                Flat Number
              </label>
              <input
                id="flat_number"
                name="flat_number"
                type="text"
                required
                value={formData.flat_number}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="101"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {loading ? 'Debugging...' : 'Debug Signup'}
          </button>
        </form>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Results:</h3>
            <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Common Issues:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
            <li>
              <strong>Duplicate email:</strong> Email already exists in
              auth.users
            </li>
            <li>
              <strong>Duplicate flat number:</strong> Flat number already exists
              in profiles
            </li>
            <li>
              <strong>Trigger failure:</strong> Profile creation trigger not
              working
            </li>
            <li>
              <strong>RLS policy:</strong> Row Level Security blocking profile
              creation
            </li>
            <li>
              <strong>Constraint violation:</strong> Database constraint
              preventing insert
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
