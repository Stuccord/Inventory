import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AlertPayload {
  product_name: string;
  current_stock: number;
  reorder_level: number;
  severity: string;
  admin_emails: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: AlertPayload = await req.json();
    const { product_name, current_stock, reorder_level, severity, admin_emails } = payload;

    console.log(`Sending low stock alert for ${product_name} to ${admin_emails.length} recipients`);

    // In production, you would integrate with an email service like:
    // - SendGrid
    // - Resend
    // - AWS SES
    // - Mailgun

    // For now, we'll log the notification
    const emailContent = {
      to: admin_emails,
      subject: `⚠️ Low Stock Alert: ${product_name}`,
      body: `
        Low Stock Warning!

        Product: ${product_name}
        Current Stock: ${current_stock}
        Reorder Level: ${reorder_level}
        Severity: ${severity.toUpperCase()}

        Please reorder this product immediately to avoid stockouts.

        Login to your inventory system to view details.
      `,
      timestamp: new Date().toISOString(),
    };

    console.log("Email notification prepared:", emailContent);

    // TODO: Replace with actual email service API call
    // Example with Resend:
    // const res = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'alerts@yourdomain.com',
    //     to: admin_emails,
    //     subject: emailContent.subject,
    //     text: emailContent.body,
    //   }),
    // });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Alert notification queued",
        recipients: admin_emails.length,
        details: emailContent,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending alert:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
