"use client";

import { useState } from "react";
import { EscrowActivity } from "@/lib/escrow";
import { logActivity } from "@/lib/escrow";

interface EscrowNotesProps {
  escrowId: string;
  activities: EscrowActivity[];
  userAddress: string;
  onUpdate: () => void;
}

export default function EscrowNotes({ escrowId, activities, userAddress, onUpdate }: EscrowNotesProps) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter only note activities
  const notes = activities.filter(a => a.action_type === 'note_added');

  const handleAddNote = async () => {
    if (!note.trim()) {
      setError("Please enter a note");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await logActivity(escrowId, "note_added", userAddress, note.trim());
      setNote("");
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Notes & Comments</h3>

      {/* Add Note */}
      <div className="mb-6">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          placeholder="Add a note or comment..."
          disabled={loading}
        />
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAddNote}
            disabled={loading || !note.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {loading ? "Adding..." : "Add Note"}
          </button>
        </div>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-gray-600 text-sm">No notes yet</p>
          <p className="text-gray-500 text-xs mt-1">Add a note to keep track of important information</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((noteActivity) => (
            <div
              key={noteActivity.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-sm">📝</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 whitespace-pre-wrap">{noteActivity.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span className="font-mono">
                      {noteActivity.actor_address.slice(0, 6)}...{noteActivity.actor_address.slice(-4)}
                    </span>
                    <span>•</span>
                    <span>{new Date(noteActivity.created_at).toLocaleString()}</span>
                    {noteActivity.actor_address.toLowerCase() === userAddress.toLowerCase() && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">You</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

