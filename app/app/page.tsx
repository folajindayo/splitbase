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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-xl text-gray-900">SplitBase</span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <button onClick={() => scrollToSection('hero')} className="text-sm text-gray-700 hover:text-gray-900 font-medium">
                  Start Here
                </button>
                <button onClick={() => scrollToSection('benefits')} className="text-sm text-gray-600 hover:text-gray-900">
                  Benefits
                </button>
                <button onClick={() => scrollToSection('how-it-works')} className="text-sm text-gray-600 hover:text-gray-900">
                  Process
                </button>
                <button onClick={() => scrollToSection('features')} className="text-sm text-gray-600 hover:text-gray-900">
                  Features
                </button>
                <button onClick={() => scrollToSection('pricing')} className="text-sm text-gray-600 hover:text-gray-900">
                  Pricing
                </button>
              </div>
            </div>
            <div className="bg-gray-900 text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors cursor-pointer">
              <appkit-button />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-24 px-6" id="hero">
        <div className="max-w-5xl mx-auto">
          {/* Beta Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm">
              <span className="font-medium">Beta</span>
              <span className="text-gray-300">Automate splits with Smart Contracts →</span>
            </div>
        </div>
        
          {/* Main Heading */}
          <h1 className="text-center text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            A payment splitter that<br />works like an{" "}
            <span className="text-emerald-500">Organiser</span>
        </h1>
        
          {/* Subheading */}
          <p className="text-center text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Great teams deserve a system that does it all, from splitting revenue and 
            automatic distributions to helping you track and verify every payment onchain.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <button className="bg-gray-900 text-white px-8 py-3.5 rounded-full hover:bg-gray-800 transition-colors font-medium flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
              </svg>
              Get Started
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="bg-white text-gray-900 px-8 py-3.5 rounded-full border border-gray-300 hover:border-gray-400 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Book a Demo
            </button>
          </div>

          {/* Logo Bar - Trust Indicators */}
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-50">
            <div className="text-gray-500 font-medium text-sm flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
              Base Network
            </div>
            <div className="text-gray-500 font-medium text-sm flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              Reown
            </div>
            <div className="text-gray-500 font-medium text-sm flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
              Solidity
            </div>
            <div className="text-gray-500 font-medium text-sm flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
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
      <section className="py-24 px-6 bg-gray-50" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gray-500 font-medium mb-3 text-sm">
              Customization
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Customize the full experience
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From contract deployment to fund distribution, so your<br />
              audience always knows it's you.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-center gap-3 mb-16 flex-wrap">
            {[
              { id: "creators", label: "Creators" },
              { id: "teams", label: "Teams" },
              { id: "daos", label: "DAOs" },
              { id: "developers", label: "Developers" },
              { id: "analytics", label: "Analytics" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "bg-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feature Content */}
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="bg-white rounded-2xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Splits That Feel</h3>
                  <h3 className="text-xl font-bold text-gray-900">Like You</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-700 text-sm">Add your branding & social links</p>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-700 text-sm">Create custom messages for recipients</p>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-700 text-sm">Your split address, your domain</p>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-700 text-sm">Add your social media links</p>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-700 text-sm">Drop event links or important notes</p>
                </div>
              </div>
            </div>

            {/* Visual Mockup - Phone Screen */}
            <div className="relative flex justify-center md:justify-end">
              <div className="relative">
                {/* Phone frame */}
                <div className="w-[320px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="bg-white rounded-[2.5rem] overflow-hidden">
                    {/* Status bar */}
                    <div className="bg-white px-6 py-3 flex items-center justify-between text-xs">
                      <span className="font-semibold">9:19</span>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        </svg>
                      </div>
                    </div>

                    {/* App content */}
                    <div className="px-5 py-4 bg-gray-50 min-h-[500px]">
                      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold">S</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900">SplitBase</p>
                            <p className="text-xs text-gray-500">Your project is now live!</p>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
                          <p className="text-xs mb-1 opacity-90">Total Received</p>
                          <p className="text-xl font-bold">2.5 ETH</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 mb-1">Share this link with your team:</p>
                            <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 truncate">
                              splitbase.app/splits/0x742d...
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative blur circles */}
                <div className="absolute -z-10 -top-10 -right-10 w-40 h-40 bg-emerald-200 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute -z-10 -bottom-10 -left-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-white" id="how-it-works">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gray-500 font-medium mb-3 text-sm">
              Process
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Three steps to start splitting
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Connect Wallet</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Connect your Web3 wallet using Reown (WalletConnect) to get started with SplitBase
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Create Split</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Add recipient addresses and set their percentages. Deploy your smart contract in seconds
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Receive Payments</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Share your contract address. Funds automatically split to all recipients instantly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-24 px-6 bg-gray-50" id="benefits">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gray-500 font-medium mb-3 text-sm">
              Benefits
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why choose SplitBase?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Instant Splits</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Funds are automatically distributed as soon as they hit your contract. No delays, no manual work.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-2xl mb-3">🔒</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Trustless & Secure</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Powered by audited smart contracts on Base. No intermediaries, no custody risks.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-2xl mb-3">📊</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Full Transparency</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Every transaction is verifiable onchain. Track all splits and distributions in real-time.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-2xl mb-3">🌐</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Share Easily</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Generate QR codes and shareable links. Make it easy for anyone to send payments.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-2xl mb-3">💎</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Low Fees</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Built on Base for minimal gas fees. Keep more of what you earn.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-2xl mb-3">🚀</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Deploy in Minutes</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                No code required. Set up your split contract and start receiving payments today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-white" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gray-500 font-medium mb-3 text-sm">
              Pricing
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600">
              Just pay gas fees. No subscriptions, no hidden costs.
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold mb-2">Free Forever</h3>
                <p className="text-gray-300">Pay only network gas fees</p>
              </div>
              <div className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                Popular
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-100">Unlimited split contracts</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-100">Unlimited recipients per split</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-100">Automatic fund distribution</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-100">Transaction history & analytics</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-100">QR codes & shareable links</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-100">Full onchain verification</p>
              </div>
            </div>

            <button className="w-full bg-white text-gray-900 px-8 py-4 rounded-full hover:bg-gray-100 transition-colors font-semibold">
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to split smarter?
              </h2>
              <p className="text-xl text-gray-300 mb-10">
                Join teams, creators, and DAOs using SplitBase to automate<br className="hidden md:block" />
                their payments onchain.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button className="bg-white text-gray-900 px-8 py-3.5 rounded-full hover:bg-gray-100 transition-colors font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                  </svg>
                  Get Started Free
                </button>
                <button 
                  onClick={() => scrollToSection('how-it-works')}
                  className="bg-transparent text-white px-8 py-3.5 rounded-full border-2 border-white/30 hover:border-white/50 transition-colors font-semibold"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-lg text-gray-900">SplitBase</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Onchain payment splitter for teams, creators, and DAOs.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-gray-900 text-sm">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-gray-900 text-sm">
                    Pricing
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-gray-900 text-sm">
                    How It Works
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-3">
                <li>
                  <a href="https://docs.base.org" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 text-sm">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 text-sm">
                    Base Network
                  </a>
                </li>
                <li>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 text-sm">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">
              © 2025 SplitBase. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
