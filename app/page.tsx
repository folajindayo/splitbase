/**
 * Home Page
 */

'use client';

import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Split Payments Made Simple
          </h1>
          <p className="text-xl text-gray-600">
            Distribute crypto payments to multiple recipients instantly
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">How it works</h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center">1</span>
                  <span>Add recipients and their shares</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center">2</span>
                  <span>Set the total amount to split</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center">3</span>
                  <span>Execute the split in one transaction</span>
                </li>
              </ol>
            </div>
            <div className="flex items-center justify-center">
              <a href="/create" className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700">
                Create Split
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

