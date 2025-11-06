import { supabase } from "./supabase";
import { getCustodyAuditStats } from "./custodyAudit";

export interface BackupData {
  version: string;
  timestamp: string;
  escrows: any[];
  audit_logs: any[];
  statistics: any;
  metadata: {
    totalEscrows: number;
    totalAuditLogs: number;
    backupSize: string;
  };
}

/**
 * Create comprehensive backup of custody data
 */
export async function createCustodyBackup(): Promise<BackupData> {
  const timestamp = new Date().toISOString();

  // Fetch all escrows with custody wallets
  const { data: escrows, error: escrowsError } = await supabase
    .from("escrows")
    .select("*")
    .not("custody_wallet_address", "is", null)
    .order("created_at", { ascending: false });

  if (escrowsError) {
    throw new Error(`Failed to fetch escrows: ${escrowsError.message}`);
  }

  // Fetch all custody audit logs
  const { data: auditLogs, error: auditError } = await supabase
    .from("custody_audit_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (auditError) {
    throw new Error(`Failed to fetch audit logs: ${auditError.message}`);
  }

  // Get statistics
  const statistics = await getCustodyAuditStats();

  // Calculate backup size (approximate)
  const dataString = JSON.stringify({ escrows, auditLogs });
  const backupSizeKB = (new Blob([dataString]).size / 1024).toFixed(2);

  const backup: BackupData = {
    version: "2.0.0",
    timestamp,
    escrows: escrows || [],
    audit_logs: auditLogs || [],
    statistics,
    metadata: {
      totalEscrows: escrows?.length || 0,
      totalAuditLogs: auditLogs?.length || 0,
      backupSize: `${backupSizeKB} KB`,
    },
  };

  return backup;
}

/**
 * Export backup as JSON file
 */
export function exportBackupToJSON(
  backup: BackupData,
  filename?: string
): void {
  const name = filename || `custody-backup-${Date.now()}.json`;
  const jsonContent = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", name);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Create encrypted backup (placeholder for future implementation)
 */
export async function createEncryptedBackup(): Promise<string> {
  const backup = await createCustodyBackup();
  const jsonString = JSON.stringify(backup);

  // TODO: Implement proper encryption
  // For now, just base64 encode (NOT SECURE - implement real encryption)
  const encoded = Buffer.from(jsonString).toString("base64");

  return encoded;
}

/**
 * Validate backup data structure
 */
export function validateBackupData(data: any): boolean {
  try {
    if (!data.version || !data.timestamp || !data.escrows || !data.audit_logs) {
      return false;
    }

    if (!Array.isArray(data.escrows) || !Array.isArray(data.audit_logs)) {
      return false;
    }

    if (!data.metadata || typeof data.metadata !== "object") {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get backup summary without full data
 */
export async function getBackupSummary(): Promise<{
  totalEscrows: number;
  totalAuditLogs: number;
  oldestEscrow: string | null;
  newestEscrow: string | null;
  estimatedBackupSize: string;
}> {
  const { count: escrowCount } = await supabase
    .from("escrows")
    .select("*", { count: "exact", head: true })
    .not("custody_wallet_address", "is", null);

  const { count: auditCount } = await supabase
    .from("custody_audit_logs")
    .select("*", { count: "exact", head: true });

  const { data: oldestEscrow } = await supabase
    .from("escrows")
    .select("created_at")
    .not("custody_wallet_address", "is", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const { data: newestEscrow } = await supabase
    .from("escrows")
    .select("created_at")
    .not("custody_wallet_address", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Estimate size (rough calculation)
  const estimatedSizeKB = ((escrowCount || 0) * 2 + (auditCount || 0) * 1).toFixed(2);

  return {
    totalEscrows: escrowCount || 0,
    totalAuditLogs: auditCount || 0,
    oldestEscrow: oldestEscrow?.created_at || null,
    newestEscrow: newestEscrow?.created_at || null,
    estimatedBackupSize: `${estimatedSizeKB} KB`,
  };
}

/**
 * Schedule automatic backup (returns cron-like config)
 */
export function getBackupScheduleConfig() {
  return {
    daily: "0 2 * * *", // 2 AM every day
    weekly: "0 2 * * 0", // 2 AM every Sunday
    monthly: "0 2 1 * *", // 2 AM on 1st of month
  };
}

/**
 * Create backup manifest for tracking
 */
export async function createBackupManifest(backup: BackupData): Promise<string> {
  const manifest = {
    id: `backup-${Date.now()}`,
    version: backup.version,
    timestamp: backup.timestamp,
    metadata: backup.metadata,
    checksums: {
      escrows: generateChecksum(backup.escrows),
      audit_logs: generateChecksum(backup.audit_logs),
    },
  };

  return JSON.stringify(manifest, null, 2);
}

/**
 * Simple checksum generation (use proper hash in production)
 */
function generateChecksum(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Compare two backups for differences
 */
export function compareBackups(
  backup1: BackupData,
  backup2: BackupData
): {
  escrowsDiff: number;
  auditLogsDiff: number;
  timeDiff: string;
} {
  const escrowsDiff = backup2.escrows.length - backup1.escrows.length;
  const auditLogsDiff = backup2.audit_logs.length - backup1.audit_logs.length;

  const time1 = new Date(backup1.timestamp).getTime();
  const time2 = new Date(backup2.timestamp).getTime();
  const diffMs = Math.abs(time2 - time1);
  const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

  return {
    escrowsDiff,
    auditLogsDiff,
    timeDiff: `${diffHours} hours`,
  };
}

