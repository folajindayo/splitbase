/**
 * Footer Component
 */

'use client';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <p>&copy; 2024 Splitbase. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/docs" className="hover:text-purple-400">Docs</a>
            <a href="/support" className="hover:text-purple-400">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

