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
    const { code } = await req.json()
    if (!code) {
      return new Response(
        JSON.stringify({ error: "Bad Request: code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Initialize admin client to run operations with bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Check brute force locking status on user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('failed_invite_attempts, invite_locked_until')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found", details: profileError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const now = new Date()
    if (profile.invite_locked_until && new Date(profile.invite_locked_until) > now) {
      const lockExpiry = new Date(profile.invite_locked_until)
      const minutesLeft = Math.ceil((lockExpiry.getTime() - now.getTime()) / (1000 * 60))
      return new Response(
        JSON.stringify({ 
          error: `Bạn đã nhập sai mã quá nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút.`, 
          code: "E-wallet-005",
          locked_until: profile.invite_locked_until
        }),
        { status: 423, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Helper to increment failed attempts
    const handleFailedAttempt = async () => {
      const newAttempts = (profile.failed_invite_attempts || 0) + 1
      const updateData: any = { failed_invite_attempts: newAttempts }
      
      let isLocked = false
      if (newAttempts >= 3) {
        // Lock for 1 hour
        const lockedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString()
        updateData.invite_locked_until = lockedUntil
        isLocked = true
      }

      await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      return isLocked
    }

    // 2. Lookup invitation code
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('wallet_invitations')
      .select('*')
      .eq('code', code)
      .eq('status', 'pending')
      .maybeSingle()

    if (inviteError) {
      return new Response(
        JSON.stringify({ error: "Database query error", details: inviteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // If code doesn't exist
    if (!invite) {
      const wasLocked = await handleFailedAttempt()
      if (wasLocked) {
        return new Response(
          JSON.stringify({ 
            error: "Bạn đã nhập sai mã quá nhiều lần. Vui lòng thử lại sau 1 tiếng.", 
            code: "E-wallet-005" 
          }),
          { status: 423, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      } else {
        return new Response(
          JSON.stringify({ 
            error: "Mã mời không tồn tại. Vui lòng kiểm tra lại.", 
            code: "E-wallet-001" 
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
    }

    // 3. Check expiry
    const expiresAtDate = new Date(invite.expires_at)
    if (expiresAtDate < now) {
      // Clean up this expired invite status in background
      await supabaseAdmin
        .from('wallet_invitations')
        .update({ status: 'expired' })
        .eq('id', invite.id)

      return new Response(
        JSON.stringify({ 
          error: "Mã mời này đã hết hạn. Vui lòng yêu cầu chủ ví gửi mã mới.", 
          code: "E-wallet-002" 
        }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 4. Check duplicate: Is user already the owner or a member of the wallet?
    const { data: wallet, error: walletQueryError } = await supabaseAdmin
      .from('wallets')
      .select('id, name, user_id')
      .eq('id', invite.wallet_id)
      .single()

    if (walletQueryError || !wallet) {
      return new Response(
        JSON.stringify({ error: "Target wallet not found", details: walletQueryError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (wallet.user_id === user.id) {
      return new Response(
        JSON.stringify({ 
          error: "Bạn đã tham gia ví chung này rồi.", 
          code: "E-wallet-004" 
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { data: existingMember } = await supabaseAdmin
      .from('wallet_members')
      .select('role')
      .eq('wallet_id', invite.wallet_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) {
      return new Response(
        JSON.stringify({ 
          error: "Bạn đã tham gia ví chung này rồi.", 
          code: "E-wallet-004" 
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 5. Check wallet member limit (Max 3 members, owner + 2 editors)
    const { count: memberCount, error: countError } = await supabaseAdmin
      .from('wallet_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('wallet_id', invite.wallet_id)

    if (countError) {
      return new Response(
        JSON.stringify({ error: "Failed to verify wallet capacity", details: countError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const totalMembers = 1 + (memberCount || 0)
    if (totalMembers >= 3) {
      return new Response(
        JSON.stringify({ 
          error: "Ví đã đầy, vui lòng liên hệ chủ ví.", 
          code: "E-wallet-003" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 6. Join process (Add to wallet_members as editor & reset brute-force)
    const { error: joinError } = await supabaseAdmin
      .from('wallet_members')
      .insert({
        wallet_id: invite.wallet_id,
        user_id: user.id,
        role: 'editor'
      })

    if (joinError) {
      return new Response(
        JSON.stringify({ error: "Failed to join wallet", details: joinError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Reset brute force counter
    await supabaseAdmin
      .from('profiles')
      .update({
        failed_invite_attempts: 0,
        invite_locked_until: null
      })
      .eq('id', user.id)

    // Option: update invitation to accepted (though here we support many uses, 
    // wait, rule says "Một mã dùng nhiều lần", so we do NOT set status to 'accepted' or delete it,
    // we keep it pending until it expires).

    return new Response(
      JSON.stringify({
        success: true,
        wallet_name: wallet.name
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
