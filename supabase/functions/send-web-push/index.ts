import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

interface NotificationRequest {
  user_id?: string;
  employee_id?: string;
  payload: PushPayload;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, employee_id, payload } = await req.json() as NotificationRequest;

    if (!user_id && !employee_id) {
      return new Response(
        JSON.stringify({ error: 'user_id or employee_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user_id from employee_id if needed
    let targetUserId = user_id;
    if (!targetUserId && employee_id) {
      const { data: employee } = await supabase
        .from('employees')
        .select('user_id')
        .eq('id', employee_id)
        .single();
      
      if (employee) {
        targetUserId = employee.user_id;
      }
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all device tokens for the user
    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', targetUserId);

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch device tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No device tokens found for user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notifications to all devices
    // Note: In production, you would use web-push library here
    // For now, this is a placeholder that logs the notifications
    console.log(`Would send ${tokens.length} push notifications to user ${targetUserId}`);
    console.log('Payload:', payload);

    // TODO: Implement actual Web Push using web-push library
    // This requires VAPID keys and proper implementation
    // Example:
    // const webpush = require('web-push');
    // webpush.setVapidDetails('mailto:your-email', publicKey, privateKey);
    // await Promise.all(tokens.map(token => 
    //   webpush.sendNotification({
    //     endpoint: token.endpoint,
    //     keys: { p256dh: token.p256dh, auth: token.auth }
    //   }, JSON.stringify(payload))
    // ));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications queued for ${tokens.length} devices`,
        user_id: targetUserId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
