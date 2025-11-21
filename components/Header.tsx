/**
 * Header Component
 */

'use client';

export function Header() {
  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-purple-600">Splitbase</h1>
        <nav className="flex gap-4">
          <a href="/" className="text-gray-700 hover:text-purple-600">Home</a>
          <a href="/create" className="text-gray-700 hover:text-purple-600">Create Split</a>
          <a href="/splits" className="text-gray-700 hover:text-purple-600">My Splits</a>
        </nav>
      </div>
    </header>
  );
}

