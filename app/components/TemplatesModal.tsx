"use client";

import { useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  getPresetTemplates,
  getUserTemplates,
  TemplateWithRecipients,
  deleteTemplate,
  saveTemplate,
  incrementTemplateUsage,
} from "@/lib/templates";

interface TemplatesModalProps {
  onClose: () => void;
  onSelectTemplate: (recipients: { address: string; percentage: string; label?: string }[]) => void;
  currentRecipients?: { address: string; percentage: string }[];
  splitName?: string;
}

export default function TemplatesModal({
  onClose,
  onSelectTemplate,
  currentRecipients,
  splitName,
}: TemplatesModalProps) {
  const { address } = useAppKitAccount();
  const [presetTemplates, setPresetTemplates] = useState<TemplateWithRecipients[]>([]);
  const [userTemplates, setUserTemplates] = useState<TemplateWithRecipients[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"preset" | "custom">("preset");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTemplates();
  }, [address]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const [presets, custom] = await Promise.all([
        getPresetTemplates(),
        address ? getUserTemplates(address) : Promise.resolve([]),
      ]);
      setPresetTemplates(presets);
      setUserTemplates(custom);
    } catch (err) {
      console.error("Failed to load templates:", err);
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template: TemplateWithRecipients) => {
    try {
      // Increment usage count
      await incrementTemplateUsage(template.id);

      // Convert template recipients to the expected format
      const recipients = template.recipients.map((r) => ({
        address: r.wallet_address || "",
        percentage: r.percentage.toString(),
        label: r.label,
      }));

      onSelectTemplate(recipients);
      onClose();
    } catch (err) {
      console.error("Failed to select template:", err);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!address) return;
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await deleteTemplate(templateId, address);
      await loadTemplates();
    } catch (err) {
      console.error("Failed to delete template:", err);
      alert("Failed to delete template. Please try again.");
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!address || !currentRecipients) return;

    if (!templateName.trim()) {
      setError("Please enter a template name");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const recipients = currentRecipients.map((r) => ({
        wallet_address: r.address || undefined,
        percentage: parseInt(r.percentage),
        label: undefined,
      }));

      await saveTemplate(
        templateName.trim(),
        address,
        recipients,
        templateDescription.trim() || undefined
      );

      // Reload templates
      await loadTemplates();

      // Reset form and close modal
      setTemplateName("");
      setTemplateDescription("");
      setShowSaveModal(false);
      setActiveTab("custom");
    } catch (err) {
      console.error("Failed to save template:", err);
      setError("Failed to save template. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const templates = activeTab === "preset" ? presetTemplates : userTemplates;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Split Templates</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("preset")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "preset"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Preset Templates ({presetTemplates.length})
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "custom"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              My Templates ({userTemplates.length})
            </button>
            {currentRecipients && currentRecipients.length > 0 && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="ml-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                💾 Save Current as Template
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
              <p className="mt-4 text-sm text-gray-500">Loading templates...</p>
            </div>
          )}

          {!loading && templates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeTab === "preset"
                  ? "No preset templates available"
                  : "No custom templates yet"}
              </h3>
              <p className="text-sm text-gray-500">
                {activeTab === "preset"
                  ? "Check back later for preset templates"
                  : "Save your current split configuration as a template"}
              </p>
            </div>
          )}

          {!loading && templates.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{template.icon || "📋"}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        {template.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {!template.is_preset && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {template.recipients.map((recipient, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-gray-700">
                          {recipient.label || `Recipient ${idx + 1}`}
                        </span>
                        <span className="text-sm font-semibold text-blue-600">
                          {recipient.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>{template.recipients.length} recipients</span>
                    {template.usage_count > 0 && (
                      <span>Used {template.usage_count} times</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Save as Template
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., My Team Split"
                  value={templateName}
                  onChange={(e) => {
                    setTemplateName(e.target.value);
                    setError("");
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  placeholder="Add notes about this template..."
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>

              {currentRecipients && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    This template will have {currentRecipients.length} recipients
                  </p>
                  <div className="space-y-1">
                    {currentRecipients.map((r, idx) => (
                      <div key={idx} className="text-xs text-gray-600">
                        Recipient {idx + 1}: {r.percentage}%
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setTemplateName("");
                  setTemplateDescription("");
                  setError("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsTemplate}
                disabled={saving || !templateName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

