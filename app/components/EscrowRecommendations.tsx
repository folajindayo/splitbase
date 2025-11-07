"use client";

import { analyzeEscrow, calculateRiskScore, type Recommendation } from "@/lib/escrowRecommendations";
import type { Escrow } from "@/lib/escrow";
import { useState } from "react";

interface EscrowRecommendationsProps {
  escrow: Escrow;
}

export default function EscrowRecommendations({ escrow }: EscrowRecommendationsProps) {
  const [expanded, setExpanded] = useState(true);
  
  const recommendations = analyzeEscrow(escrow);
  const riskAnalysis = calculateRiskScore(escrow);

  if (recommendations.length === 0 && riskAnalysis.score < 20) {
    return null;
  }

  const getTypeIcon = (type: Recommendation["type"]) => {
    switch (type) {
      case "warning":
        return "⚠️";
      case "tip":
        return "💡";
      case "suggestion":
        return "✨";
      case "insight":
        return "📊";
    }
  };

  const getTypeColor = (type: Recommendation["type"]) => {
    switch (type) {
      case "warning":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-900",
          icon: "text-red-600",
        };
      case "tip":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-900",
          icon: "text-blue-600",
        };
      case "suggestion":
        return {
          bg: "bg-purple-50",
          border: "border-purple-200",
          text: "text-purple-900",
          icon: "text-purple-600",
        };
      case "insight":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          text: "text-green-900",
          icon: "text-green-600",
        };
    }
  };

  const getRiskColor = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "low":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          bar: "bg-green-500",
        };
      case "medium":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          bar: "bg-yellow-500",
        };
      case "high":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          bar: "bg-red-500",
        };
    }
  };

  const riskColors = getRiskColor(riskAnalysis.level);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">🎯</div>
          <div>
            <h3 className="font-semibold text-gray-900">Recommendations & Insights</h3>
            <p className="text-sm text-gray-600">
              {recommendations.length} recommendation{recommendations.length !== 1 ? "s" : ""} • Risk: {riskAnalysis.level}
            </p>
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          {expanded ? "▼" : "▶"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Risk Assessment */}
          <div className={`${riskColors.bg} border ${riskColors.border} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <h4 className={`font-semibold ${riskColors.text}`}>
                  Risk Assessment: {riskAnalysis.level.toUpperCase()}
                </h4>
              </div>
              <span className={`${riskColors.text} font-bold`}>
                {riskAnalysis.score}/100
              </span>
            </div>
            
            {/* Risk Bar */}
            <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-3">
              <div
                className={`h-full ${riskColors.bar}`}
                style={{ width: `${riskAnalysis.score}%` }}
              ></div>
            </div>

            {/* Risk Factors */}
            {riskAnalysis.factors.length > 0 && (
              <div className="space-y-1">
                <p className={`text-sm font-medium ${riskColors.text}`}>Risk Factors:</p>
                <ul className="text-sm space-y-1">
                  {riskAnalysis.factors.map((factor, index) => (
                    <li key={index} className={riskColors.text}>
                      • {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations List */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              {recommendations.map((rec, index) => {
                const colors = getTypeColor(rec.type);
                return (
                  <div
                    key={index}
                    className={`${colors.bg} border ${colors.border} rounded-lg p-4`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {getTypeIcon(rec.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-semibold ${colors.text}`}>
                            {rec.title}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            rec.priority === "high" 
                              ? "bg-red-100 text-red-700" 
                              : rec.priority === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className={`text-sm ${colors.text} opacity-90`}>
                          {rec.description}
                        </p>
                        {rec.action && (
                          <button
                            onClick={() => {
                              if (rec.action?.url) {
                                window.open(rec.action.url, "_blank");
                              }
                            }}
                            className={`mt-2 text-sm font-medium ${colors.icon} hover:underline`}
                          >
                            {rec.action.label} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Recommendations */}
          {recommendations.length === 0 && (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-gray-600">
                Everything looks good! No recommendations at this time.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

