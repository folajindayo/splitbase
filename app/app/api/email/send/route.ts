import { NextRequest, NextResponse } from "next/server";

// This API route handles email sending
// To use this, you'll need to:
// 1. Sign up for Resend at https://resend.com
// 2. Get your API key
// 3. Add RESEND_API_KEY to your .env.local file
// 4. Install resend package: npm install resend

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, splitAddress, txHash, amount } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured. Email sending is disabled.");
      
      // In development, log the email instead of sending
      if (process.env.NODE_ENV === "development") {
        console.log("📧 [DEV MODE] Email would be sent:");
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("Split Address:", splitAddress);
        console.log("TX Hash:", txHash);
        console.log("Amount:", amount);
        
        return NextResponse.json({
          success: true,
          message: "Email logged (dev mode)",
          devMode: true,
        });
      }
      
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 }
      );
    }

    // Send email using Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "SplitBase <notifications@splitbase.app>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Resend API error:", error);
      
      return NextResponse.json(
        { error: "Failed to send email", details: error },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Log the email send (optional - you could save this to Supabase)
    console.log("✅ Email sent successfully:", {
      to,
      subject,
      emailId: data.id,
      splitAddress,
      txHash,
    });

    return NextResponse.json({
      success: true,
      emailId: data.id,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error in email send API:", error);
    
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

