import { SplitWithRecipients } from "./splits";

// Convert array of objects to CSV string
function arrayToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";

  // Get headers
  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(","));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(",") ? `"${escaped}"` : escaped;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

// Download CSV file
function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export a single split to CSV
export function exportSplitToCSV(split: SplitWithRecipients) {
  const splitInfo = [
    {
      "Split Name": split.name || "Untitled Split",
      "Contract Address": split.contract_address,
      "Owner Address": split.owner_address,
      "Description": split.description || "",
      "Created At": new Date(split.created_at).toLocaleString(),
      "Number of Recipients": split.recipients.length,
    },
  ];

  const recipientsData = split.recipients.map((recipient, index) => ({
    "#": index + 1,
    "Wallet Address": recipient.wallet_address,
    "Percentage": `${recipient.percentage}%`,
  }));

  // Combine split info and recipients
  const splitInfoCSV = arrayToCSV(splitInfo);
  const recipientsCSV = arrayToCSV(recipientsData);

  const csvContent = `Split Information\n${splitInfoCSV}\n\nRecipients\n${recipientsCSV}`;

  const filename = `split-${split.name?.replace(/[^a-z0-9]/gi, "-").toLowerCase() || split.contract_address.slice(0, 8)}-${Date.now()}.csv`;
  downloadCSV(filename, csvContent);
}

// Export all splits to CSV
export function exportAllSplitsToCSV(splits: SplitWithRecipients[]) {
  const splitsData = splits.map((split) => ({
    "Name": split.name || "Untitled Split",
    "Contract Address": split.contract_address,
    "Owner Address": split.owner_address,
    "Description": split.description || "",
    "Recipients": split.recipients.length,
    "Favorite": split.is_favorite ? "Yes" : "No",
    "Created At": new Date(split.created_at).toLocaleString(),
  }));

  const csvContent = arrayToCSV(splitsData);
  const filename = `splits-export-${Date.now()}.csv`;
  downloadCSV(filename, csvContent);
}

// Export split recipients to CSV (detailed)
export function exportRecipientsToCSV(splits: SplitWithRecipients[]) {
  const recipientsData: Record<string, unknown>[] = [];

  splits.forEach((split) => {
    split.recipients.forEach((recipient) => {
      recipientsData.push({
        "Split Name": split.name || "Untitled Split",
        "Split Address": split.contract_address,
        "Recipient Address": recipient.wallet_address,
        "Percentage": recipient.percentage,
        "Created At": new Date(split.created_at).toLocaleString(),
      });
    });
  });

  const csvContent = arrayToCSV(recipientsData);
  const filename = `recipients-export-${Date.now()}.csv`;
  downloadCSV(filename, csvContent);
}

