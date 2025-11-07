"use client";

import { useState } from "react";

interface EscrowTemplate {
  id: string;
  name: string;
  description: string;
  type: "simple" | "time_locked" | "milestone";
  icon: string;
  popular: boolean;
  category: string;
  suggestedAmount?: string;
  suggestedDuration?: number;
  milestones?: { title: string; percentage: number }[];
}

const templates: EscrowTemplate[] = [
  {
    id: "freelance-web",
    name: "Web Development Project",
    description: "3-milestone escrow for web development work",
    type: "milestone",
    icon: "💻",
    popular: true,
    category: "Freelance",
    suggestedAmount: "1.0",
    milestones: [
      { title: "Design & Wireframes", percentage: 30 },
      { title: "Development", percentage: 50 },
      { title: "Testing & Launch", percentage: 20 },
    ],
  },
  {
    id: "freelance-design",
    name: "Graphic Design Project",
    description: "2-milestone escrow for design work",
    type: "milestone",
    icon: "🎨",
    popular: true,
    category: "Freelance",
    suggestedAmount: "0.5",
    milestones: [
      { title: "Initial Concepts", percentage: 40 },
      { title: "Final Deliverables", percentage: 60 },
    ],
  },
  {
    id: "service-monthly",
    name: "Monthly Service Payment",
    description: "Simple payment for monthly services",
    type: "simple",
    icon: "📅",
    popular: false,
    category: "Services",
    suggestedAmount: "0.2",
  },
  {
    id: "product-purchase",
    name: "Product Purchase",
    description: "Buy physical or digital products safely",
    type: "simple",
    icon: "🛒",
    popular: true,
    category: "E-commerce",
    suggestedAmount: "0.3",
  },
  {
    id: "rental-deposit",
    name: "Rental Deposit",
    description: "Hold deposit until rental period ends",
    type: "time_locked",
    icon: "🏠",
    popular: false,
    category: "Real Estate",
    suggestedAmount: "2.0",
    suggestedDuration: 30,
  },
  {
    id: "content-creation",
    name: "Content Creation",
    description: "Multi-part content delivery",
    type: "milestone",
    icon: "✍️",
    popular: true,
    category: "Freelance",
    suggestedAmount: "0.4",
    milestones: [
      { title: "Outline & Research", percentage: 25 },
      { title: "Draft Content", percentage: 50 },
      { title: "Final Revisions", percentage: 25 },
    ],
  },
  {
    id: "consulting-project",
    name: "Consulting Project",
    description: "Professional consulting engagement",
    type: "milestone",
    icon: "💼",
    popular: false,
    category: "Professional",
    suggestedAmount: "1.5",
    milestones: [
      { title: "Initial Assessment", percentage: 30 },
      { title: "Strategy Development", percentage: 40 },
      { title: "Implementation Plan", percentage: 30 },
    ],
  },
  {
    id: "event-booking",
    name: "Event Booking",
    description: "Secure payment for event services",
    type: "time_locked",
    icon: "🎉",
    popular: false,
    category: "Events",
    suggestedAmount: "0.8",
    suggestedDuration: 14,
  },
];

interface EscrowTemplatesProps {
  onSelectTemplate: (template: EscrowTemplate) => void;
}

export default function EscrowTemplates({ onSelectTemplate }: EscrowTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", ...Array.from(new Set(templates.map((t) => t.category)))];

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory =
      selectedCategory === "All" || template.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose a Template
        </h2>
        <p className="text-gray-600">
          Start with a pre-configured template or create a custom escrow
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onSelectTemplate(template)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{template.icon}</div>
              {template.popular && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                  Popular
                </span>
              )}
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {template.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-medium">Type:</span>
                <span className="capitalize">{template.type.replace("_", " ")}</span>
              </div>
              {template.suggestedAmount && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium">Suggested:</span>
                  <span>{template.suggestedAmount} ETH</span>
                </div>
              )}
              {template.milestones && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium">Milestones:</span>
                  <span>{template.milestones.length}</span>
                </div>
              )}
            </div>

            {/* Button */}
            <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
              Use Template
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No templates found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Custom Option */}
      <div className="border-t border-gray-200 pt-6">
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Need something custom?
          </h3>
          <p className="text-gray-600 mb-4">
            Create a fully customized escrow from scratch
          </p>
          <button
            onClick={() =>
              onSelectTemplate({
                id: "custom",
                name: "Custom Escrow",
                description: "Build your own",
                type: "simple",
                icon: "⚙️",
                popular: false,
                category: "Custom",
              })
            }
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
          >
            Create Custom Escrow
          </button>
        </div>
      </div>
    </div>
  );
}

