"use client";

import React from "react";

interface Participant {
  address: string;
  role: "creator" | "recipient" | "arbiter";
  name?: string;
  verified?: boolean;
}

interface EscrowParticipantsProps {
  participants: Participant[];
}

/**
 * EscrowParticipants Component
 * Displays all participants in an escrow with their roles
 */
export default function EscrowParticipants({
  participants,
}: EscrowParticipantsProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case "creator":
        return "bg-blue-100 text-blue-800";
      case "recipient":
        return "bg-green-100 text-green-800";
      case "arbiter":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Participants</h3>

      <div className="space-y-3">
        {participants.map((participant, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <span className="font-medium text-gray-600">
                  {participant.address[0].toUpperCase()}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">
                    {participant.name || truncateAddress(participant.address)}
                  </p>
                  {participant.verified && (
                    <svg
                      className="h-4 w-4 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {truncateAddress(participant.address)}
                </p>
              </div>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${getRoleColor(
                participant.role
              )}`}
            >
              {getRoleLabel(participant.role)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

