import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables on server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Get Auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Initialize user client to verify identity
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token", details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Read body parameters
    const { wallet_id } = await req.json()
    if (!wallet_id) {
      return new Response(
        JSON.stringify({ error: "Bad Request: wallet_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Initialize admin client to run operations with bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Verify user is owner of the wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('id, user_id')
      .eq('id', wallet_id)
      .single()

    if (walletError || !wallet) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Wallet not found", details: walletError?.message }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (wallet.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only wallet owner can generate invitation codes" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 2. Check current member count (Max 3 members, including Owner)
    // Wallet Members count
    const { count: memberCount, error: memberError } = await supabaseAdmin
      .from('wallet_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('wallet_id', wallet_id)

    if (memberError) {
      return new Response(
        JSON.stringify({ error: "Internal Server Error", details: memberError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Owner is 1, so if memberCount is 2 or more, the total is already 3 or more.
    const totalMembers = 1 + (memberCount || 0)
    if (totalMembers >= 3) {
      return new Response(
        JSON.stringify({ 
          error: "Ví đã đầy, không thể mời thêm thành viên.", 
          code: "E-wallet-003" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 3. Deactivate any existing pending invite codes for this wallet
    const { error: expireError } = await supabaseAdmin
      .from('wallet_invitations')
      .update({ status: 'expired' })
      .eq('wallet_id', wallet_id)
      .eq('status', 'pending')

    if (expireError) {
      return new Response(
        JSON.stringify({ error: "Failed to deactivate previous codes", details: expireError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 4. Generate unique invitation code: CAPY-XXXXXX
    let code = ''
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      attempts++
      const digits = Math.floor(100000 + Math.random() * 900000).toString()
      code = `CAPY-${digits}`

      // Check if code is already pending
      const { data: existingInvite } = await supabaseAdmin
        .from('wallet_invitations')
        .select('id')
        .eq('code', code)
        .eq('status', 'pending')
        .maybeSingle()

      if (!existingInvite) {
        isUnique = true
      }
    }

    if (!isUnique) {
      return new Response(
        JSON.stringify({ error: "Failed to generate a unique code. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 5. Insert new invite record (expires in 24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { data: newInvite, error: insertError } = await supabaseAdmin
      .from('wallet_invitations')
      .insert({
        wallet_id,
        invited_by: user.id,
        code,
        status: 'pending',
        expires_at: expiresAt,
        role: 'editor'
      })
      .select('code', 'expires_at')
      .single()

    if (insertError || !newInvite) {
      return new Response(
        JSON.stringify({ error: "Failed to save invitation code", details: insertError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({
        code: newInvite.code,
        expires_at: newInvite.expires_at
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
