// Export escrow data to CSV

import { EscrowWithMilestones } from "./escrow";

export function exportEscrowToCSV(escrow: EscrowWithMilestones): void {
  // Prepare CSV headers and data
  const headers = [
    "Title",
    "Description",
    "Buyer Address",
    "Seller Address",
    "Amount",
    "Currency",
    "Type",
    "Status",
    "Created Date",
    "Funded Date",
    "Released Date",
  ];

  const data = [
    escrow.title,
    escrow.description || "",
    escrow.buyer_address,
    escrow.seller_address,
    escrow.total_amount.toString(),
    escrow.currency,
    escrow.escrow_type,
    escrow.status,
    new Date(escrow.created_at).toLocaleString(),
    escrow.funded_at ? new Date(escrow.funded_at).toLocaleString() : "Not funded",
    escrow.released_at ? new Date(escrow.released_at).toLocaleString() : "Not released",
  ];

  // Create CSV content
  let csvContent = headers.join(",") + "\n";
  csvContent += data.map(field => `"${field}"`).join(",") + "\n";

  // Add milestones if present
  if (escrow.milestones && escrow.milestones.length > 0) {
    csvContent += "\n\nMilestones\n";
    csvContent += "Title,Description,Amount,Status,Order,Completed Date,Released Date\n";
    
    escrow.milestones.forEach((milestone) => {
      const milestoneData = [
        milestone.title,
        milestone.description || "",
        milestone.amount.toString(),
        milestone.status,
        milestone.order_index.toString(),
        milestone.completed_at ? new Date(milestone.completed_at).toLocaleString() : "Not completed",
        milestone.released_at ? new Date(milestone.released_at).toLocaleString() : "Not released",
      ];
      csvContent += milestoneData.map(field => `"${field}"`).join(",") + "\n";
    });
  }

  // Add activity log
  if (escrow.activities && escrow.activities.length > 0) {
    csvContent += "\n\nActivity Log\n";
    csvContent += "Action Type,Actor Address,Message,Date\n";
    
    escrow.activities.forEach((activity) => {
      const activityData = [
        activity.action_type,
        activity.actor_address,
        activity.message,
        new Date(activity.created_at).toLocaleString(),
      ];
      csvContent += activityData.map(field => `"${field}"`).join(",") + "\n";
    });
  }

  // Download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `escrow-${escrow.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAllEscrowsToCSV(escrows: EscrowWithMilestones[]): void {
  if (escrows.length === 0) return;

  // Prepare CSV headers
  const headers = [
    "Title",
    "Description",
    "Buyer Address",
    "Seller Address",
    "Amount",
    "Currency",
    "Type",
    "Status",
    "Milestones Count",
    "Created Date",
    "Funded Date",
    "Released Date",
  ];

  // Create CSV content
  let csvContent = headers.join(",") + "\n";

  escrows.forEach((escrow) => {
    const data = [
      escrow.title,
      escrow.description || "",
      escrow.buyer_address,
      escrow.seller_address,
      escrow.total_amount.toString(),
      escrow.currency,
      escrow.escrow_type,
      escrow.status,
      escrow.milestones ? escrow.milestones.length.toString() : "0",
      new Date(escrow.created_at).toLocaleString(),
      escrow.funded_at ? new Date(escrow.funded_at).toLocaleString() : "Not funded",
      escrow.released_at ? new Date(escrow.released_at).toLocaleString() : "Not released",
    ];
    csvContent += data.map(field => `"${field}"`).join(",") + "\n";
  });

  // Download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `all-escrows-${Date.now()}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

