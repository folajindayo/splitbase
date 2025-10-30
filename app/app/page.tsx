"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { isConnected } = useAppKitAccount();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("creators");

  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Beta Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm">
              <span className="font-medium">Beta</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-300">Built on Base Network</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-center text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            A payment splitter that<br />works like a{" "}
            <span className="text-emerald-500">Smart Contract</span>
          </h1>

          {/* Subheading */}
          <p className="text-center text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Great teams deserve a system that does it all, from splitting revenue and 
            automatic distributions to helping you track and verify every payment onchain.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-20">
            <div className="bg-gray-900 text-white px-8 py-4 rounded-full hover:bg-gray-800 transition-colors cursor-pointer">
              <appkit-button />
            </div>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="bg-white text-gray-900 px-8 py-4 rounded-full border-2 border-gray-200 hover:border-gray-300 transition-colors font-medium"
            >
              Learn More
            </button>
          </div>

          {/* Logo Bar - Trust Indicators */}
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-60">
            <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">B</span>
              </div>
              Base Network
            </div>
            <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">R</span>
              </div>
              Reown
            </div>
            <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              Solidity
            </div>
            <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">O</span>
              </div>
              OpenZeppelin
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-6 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Transparent and Trustless
          </h3>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto italic">
            "We needed a reliable way to split revenue among our team. SplitBase 
            is onchain, it's the only thing that keeps us sane."
          </p>
          <p className="text-gray-500 mt-4 text-sm">- Web3 Founders, Building Onchain</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6" id="how-it-works">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-semibold mb-2 uppercase tracking-wide text-sm">
              Features
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Customize the full experience
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From contract deployment to fund distribution, your team always knows it's you.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
            {[
              { id: "creators", label: "Creators" },
              { id: "teams", label: "Teams" },
              { id: "daos", label: "DAOs" },
              { id: "developers", label: "Developers" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feature Content */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Deploy custom split contracts</h4>
                    <p className="text-gray-600 text-sm">Create your own smart contract with custom recipient percentages</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Automatic fund distribution</h4>
                    <p className="text-gray-600 text-sm">Funds are automatically split when received, no manual action needed</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Track everything onchain</h4>
                    <p className="text-gray-600 text-sm">All transactions are verified and visible on Base blockchain</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Share your split address</h4>
                    <p className="text-gray-600 text-sm">Generate QR codes and shareable links for easy payments</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Mockup */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 border-2 border-gray-200 shadow-xl">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">S</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Split Contract</p>
                        <p className="text-xs text-gray-500">0x742d...a4f2</p>
                      </div>
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
                      Active
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-medium">A</span>
                        </div>
                        <span className="text-sm text-gray-600">Alice</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">40%</span>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 text-xs font-medium">B</span>
                        </div>
                        <span className="text-sm text-gray-600">Bob</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">35%</span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 text-xs font-medium">C</span>
                        </div>
                        <span className="text-sm text-gray-600">Charlie</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">25%</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-medium mb-1">Total Received</p>
                    <p className="text-2xl font-bold text-emerald-700">5.42 ETH</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-emerald-600 font-semibold mb-2 uppercase tracking-wide text-sm">
              Process
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Three steps to start splitting
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Connect Wallet</h3>
              <p className="text-gray-600">
                Connect your Web3 wallet using Reown (WalletConnect) to get started
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Create Split</h3>
              <p className="text-gray-600">
                Add recipient addresses and set their percentages. Deploy your smart contract
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Receive Payments</h3>
              <p className="text-gray-600">
                Share your contract address. Funds automatically split to all recipients
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-emerald-600 font-semibold mb-2 uppercase tracking-wide text-sm">
              Benefits
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Why choose SplitBase?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-emerald-300 transition-colors">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Splits</h3>
              <p className="text-gray-600">
                Funds are automatically distributed as soon as they hit your contract. No delays, no manual work.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-emerald-300 transition-colors">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Trustless & Secure</h3>
              <p className="text-gray-600">
                Powered by audited smart contracts on Base. No intermediaries, no custody risks.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-emerald-300 transition-colors">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Full Transparency</h3>
              <p className="text-gray-600">
                Every transaction is verifiable onchain. Track all splits and distributions in real-time.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-emerald-300 transition-colors">
              <div className="text-3xl mb-4">🌐</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Share Easily</h3>
              <p className="text-gray-600">
                Generate QR codes and shareable links. Make it easy for anyone to send payments.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-emerald-300 transition-colors">
              <div className="text-3xl mb-4">💎</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Low Fees</h3>
              <p className="text-gray-600">
                Built on Base for minimal gas fees. Keep more of what you earn.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-emerald-300 transition-colors">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Deploy in Minutes</h3>
              <p className="text-gray-600">
                No code required. Set up your split contract and start receiving payments today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-gradient-to-br from-emerald-500 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to split smarter?
          </h2>
          <p className="text-xl text-emerald-50 mb-12">
            Join teams, creators, and DAOs using SplitBase to automate their payments onchain.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="bg-white text-gray-900 px-8 py-4 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
              <appkit-button />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
