import { supabase } from "./supabase";

export interface TemplateRecipient {
  id?: string;
  template_id?: string;
  wallet_address?: string;
  percentage: number;
  label?: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  is_preset: boolean;
  owner_address?: string;
  icon?: string;
  created_at: string;
  usage_count: number;
}

export interface TemplateWithRecipients extends Template {
  recipients: TemplateRecipient[];
}

// Get all preset templates
export async function getPresetTemplates(): Promise<TemplateWithRecipients[]> {
  const { data: templates, error: templatesError } = await supabase
    .from("templates")
    .select("*")
    .eq("is_preset", true)
    .order("usage_count", { ascending: false });

  if (templatesError) {
    throw new Error(`Failed to fetch preset templates: ${templatesError.message}`);
  }

  if (!templates || templates.length === 0) {
    return [];
  }

  // Fetch recipients for all templates
  const templateIds = templates.map((t) => t.id);
  const { data: recipients, error: recipientsError } = await supabase
    .from("template_recipients")
    .select("*")
    .in("template_id", templateIds);

  if (recipientsError) {
    throw new Error(`Failed to fetch template recipients: ${recipientsError.message}`);
  }

  // Combine templates with their recipients
  return templates.map((template) => ({
    ...template,
    recipients: recipients?.filter((r) => r.template_id === template.id) || [],
  }));
}

// Get user's custom templates
export async function getUserTemplates(
  ownerAddress: string
): Promise<TemplateWithRecipients[]> {
  const { data: templates, error: templatesError } = await supabase
    .from("templates")
    .select("*")
    .eq("owner_address", ownerAddress.toLowerCase())
    .eq("is_preset", false)
    .order("created_at", { ascending: false });

  if (templatesError) {
    throw new Error(`Failed to fetch user templates: ${templatesError.message}`);
  }

  if (!templates || templates.length === 0) {
    return [];
  }

  // Fetch recipients for all templates
  const templateIds = templates.map((t) => t.id);
  const { data: recipients, error: recipientsError } = await supabase
    .from("template_recipients")
    .select("*")
    .in("template_id", templateIds);

  if (recipientsError) {
    throw new Error(`Failed to fetch template recipients: ${recipientsError.message}`);
  }

  // Combine templates with their recipients
  return templates.map((template) => ({
    ...template,
    recipients: recipients?.filter((r) => r.template_id === template.id) || [],
  }));
}

// Get a single template by ID
export async function getTemplateById(
  templateId: string
): Promise<TemplateWithRecipients | null> {
  const { data: template, error: templateError } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (templateError) {
    if (templateError.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch template: ${templateError.message}`);
  }

  // Fetch recipients
  const { data: recipients, error: recipientsError } = await supabase
    .from("template_recipients")
    .select("*")
    .eq("template_id", template.id);

  if (recipientsError) {
    throw new Error(`Failed to fetch template recipients: ${recipientsError.message}`);
  }

  return {
    ...template,
    recipients: recipients || [],
  };
}

// Save a new custom template
export async function saveTemplate(
  name: string,
  ownerAddress: string,
  recipients: { wallet_address?: string; percentage: number; label?: string }[],
  description?: string,
  icon?: string
): Promise<string> {
  // Insert template
  const { data: templateData, error: templateError } = await supabase
    .from("templates")
    .insert({
      name,
      description: description || null,
      is_preset: false,
      owner_address: ownerAddress.toLowerCase(),
      icon: icon || "📋",
      usage_count: 0,
    })
    .select()
    .single();

  if (templateError) {
    throw new Error(`Failed to save template: ${templateError.message}`);
  }

  // Insert recipients
  const recipientRecords = recipients.map((r) => ({
    template_id: templateData.id,
    wallet_address: r.wallet_address?.toLowerCase() || null,
    percentage: r.percentage,
    label: r.label || null,
  }));

  const { error: recipientsError } = await supabase
    .from("template_recipients")
    .insert(recipientRecords);

  if (recipientsError) {
    throw new Error(`Failed to save template recipients: ${recipientsError.message}`);
  }

  return templateData.id;
}

// Delete a custom template
export async function deleteTemplate(
  templateId: string,
  ownerAddress: string
): Promise<void> {
  // Verify ownership
  const { data: template, error: fetchError } = await supabase
    .from("templates")
    .select("owner_address, is_preset")
    .eq("id", templateId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch template: ${fetchError.message}`);
  }

  if (!template) {
    throw new Error("Template not found");
  }

  if (template.is_preset) {
    throw new Error("Cannot delete preset templates");
  }

  if (template.owner_address?.toLowerCase() !== ownerAddress.toLowerCase()) {
    throw new Error("You can only delete your own templates");
  }

  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", templateId);

  if (error) {
    throw new Error(`Failed to delete template: ${error.message}`);
  }
}

// Increment usage count for a template
export async function incrementTemplateUsage(templateId: string): Promise<void> {
  const { error } = await supabase.rpc("increment_template_usage", {
    template_id: templateId,
  });

  if (error) {
    // If the RPC function doesn't exist, use a regular update
    const { data: template } = await supabase
      .from("templates")
      .select("usage_count")
      .eq("id", templateId)
      .single();

    if (template) {
      await supabase
        .from("templates")
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq("id", templateId);
    }
  }
}

