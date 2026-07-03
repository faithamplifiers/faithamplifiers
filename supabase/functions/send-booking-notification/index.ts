import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { serviceTitle, clientName, clientEmail, clientPhone, message, providerEmail } = await req.json()

    if (!serviceTitle || !clientName || !clientEmail || !providerEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Resend API to send booking email
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Faith Amplifiers Bookings <onboarding@resend.dev>',
        to: providerEmail,
        subject: `New Service Booking: ${serviceTitle}`,
        html: `
          <h3>You have received a new service booking!</h3>
          <p><strong>Service Booked:</strong> ${serviceTitle}</p>
          <p><strong>Client Name:</strong> ${clientName}</p>
          <p><strong>Client Email:</strong> ${clientEmail}</p>
          <p><strong>Client Phone:</strong> ${clientPhone || 'Not provided'}</p>
          <p><strong>Message / Special Instructions:</strong></p>
          <p style="white-space: pre-wrap;">${message || 'No additional message provided.'}</p>
          <hr />
          <p style="font-size: 12px; color: #666;">You can view and manage this booking directly from your Faith Amplifiers Provider Dashboard.</p>
        `,
        reply_to: clientEmail
      }),
    })

    const resData = await res.json()

    if (!res.ok) {
      throw new Error(JSON.stringify(resData))
    }

    return new Response(
      JSON.stringify({ success: true, data: resData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
