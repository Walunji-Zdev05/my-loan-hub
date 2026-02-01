import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  type: "client_approved" | "client_rejected" | "loan_disbursed";
  recipientEmail: string;
  recipientName: string;
  details?: {
    clientNumber?: string;
    loanNumber?: string;
    loanAmount?: number;
    rejectionReason?: string;
  };
}

const getEmailContent = (notification: NotificationRequest) => {
  const { type, recipientName, details } = notification;

  switch (type) {
    case "client_approved":
      return {
        subject: "Your Account Has Been Approved! 🎉",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #16a34a; margin-bottom: 20px;">Account Approved!</h1>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Dear ${recipientName},
            </p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Great news! Your account (${details?.clientNumber || 'N/A'}) has been approved. 
              You are now eligible to apply for loans through our platform.
            </p>
            <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #166534; font-weight: 500;">What's Next?</p>
              <p style="margin: 10px 0 0 0; color: #166534;">
                You can now submit a loan application. Our team will review it and get back to you promptly.
              </p>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you have any questions, please don't hesitate to contact us.
            </p>
            <p style="font-size: 14px; color: #666;">
              Best regards,<br/>
              The Loan Management Team
            </p>
          </div>
        `,
      };

    case "client_rejected":
      return {
        subject: "Update on Your Account Application",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626; margin-bottom: 20px;">Application Status Update</h1>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Dear ${recipientName},
            </p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              We regret to inform you that your account application has not been approved at this time.
            </p>
            ${details?.rejectionReason ? `
              <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #991b1b; font-weight: 500;">Reason:</p>
                <p style="margin: 10px 0 0 0; color: #991b1b;">
                  ${details.rejectionReason}
                </p>
              </div>
            ` : ''}
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              If you believe this was made in error or would like to provide additional information, 
              please contact our support team.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Best regards,<br/>
              The Loan Management Team
            </p>
          </div>
        `,
      };

    case "loan_disbursed":
      return {
        subject: "Your Loan Has Been Disbursed! 💰",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">Loan Disbursed Successfully!</h1>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Dear ${recipientName},
            </p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              We're pleased to inform you that your loan has been successfully disbursed.
            </p>
            <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-weight: 500;">Loan Details:</p>
              <ul style="margin: 10px 0 0 0; color: #1e40af; padding-left: 20px;">
                <li>Loan Number: ${details?.loanNumber || 'N/A'}</li>
                <li>Amount Disbursed: K${details?.loanAmount?.toLocaleString() || '0'}</li>
              </ul>
            </div>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              The funds should reflect in your account shortly. Please ensure you make your 
              repayments on time to maintain a good credit standing.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you have any questions about your loan or repayment schedule, please contact us.
            </p>
            <p style="font-size: 14px; color: #666;">
              Best regards,<br/>
              The Loan Management Team
            </p>
          </div>
        `,
      };

    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: NotificationRequest = await req.json();
    console.log("Processing notification:", notification.type, "for:", notification.recipientEmail);

    // Validate required fields
    if (!notification.type || !notification.recipientEmail || !notification.recipientName) {
      throw new Error("Missing required fields: type, recipientEmail, recipientName");
    }

    // Skip sending if no email provided
    if (!notification.recipientEmail || notification.recipientEmail === 'N/A') {
      console.log("No valid email address, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "No email address provided, notification skipped" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { subject, html } = getEmailContent(notification);

    const emailResponse = await resend.emails.send({
      from: "Loan Management <onboarding@resend.dev>",
      to: [notification.recipientEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-notification function:", errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
