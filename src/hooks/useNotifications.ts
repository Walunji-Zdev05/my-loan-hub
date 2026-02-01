import { supabase } from '@/integrations/supabase/client';

type NotificationType = 'client_approved' | 'client_rejected' | 'loan_disbursed';

interface NotificationDetails {
  clientNumber?: string;
  loanNumber?: string;
  loanAmount?: number;
  rejectionReason?: string;
}

export async function sendNotification(
  type: NotificationType,
  recipientEmail: string | null | undefined,
  recipientName: string,
  details?: NotificationDetails
) {
  // Skip if no email
  if (!recipientEmail) {
    console.log('No email provided, skipping notification');
    return { success: true, skipped: true };
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        type,
        recipientEmail,
        recipientName,
        details,
      },
    });

    if (error) {
      console.error('Failed to send notification:', error);
      return { success: false, error };
    }

    console.log('Notification sent:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Error sending notification:', err);
    return { success: false, error: err };
  }
}
