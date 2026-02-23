import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "https://esm.sh/nodemailer@6.9.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const smtpUser = Deno.env.get("MAILTRAP_SMTP_USER");
    const smtpPass = Deno.env.get("MAILTRAP_SMTP_PASS");

    // Auth ellenőrzés
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Admin jogosultság ellenőrzése
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    // MEGJEGYZÉS: Ha még nincs adminod, ideiglenesen kommentezd ki ezt az ellenőrzést teszteléshez!
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Csak admin hívhat meg felhasználót" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, role, action, token: acceptToken, userId: acceptUserId } = await req.json();

    // --- ACCEPT INVITATION LOGIC (Változatlan) ---
    if (action === "accept") {
      if (!acceptToken || !acceptUserId)
        return new Response(JSON.stringify({ error: "Hiányzó adatok" }), { status: 400, headers: corsHeaders });

      const { data: inv } = await serviceClient
        .from("user_invitations")
        .select("*")
        .eq("token", acceptToken)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (!inv)
        return new Response(JSON.stringify({ error: "Érvénytelen meghívó" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      // User role beállítása
      await serviceClient.from("user_roles").insert({ user_id: acceptUserId, role: inv.role });
      await serviceClient.from("user_invitations").update({ used: true }).eq("id", inv.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- INVITE LOGIC (ÚJ SMTP-vel) ---
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await serviceClient.from("user_invitations").insert({
      email,
      role: role || "user",
      token,
      expires_at: expiresAt,
      invited_by: user.id,
    });

    if (!smtpUser || !smtpPass) {
      console.log("SMTP adatok hiányoznak, email nem ment ki.");
      return new Response(JSON.stringify({ success: true, warning: "SMTP nincs beállítva" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const inviteUrl = `${req.headers.get("origin")}/accept-invite?token=${token}`;

    await transporter.sendMail({
      from: '"Umbroll Admin" <admin@umbroll.com>',
      to: email,
      subject: "Meghívó - Umbroll Dashboard",
      html: `<p>Meghívtak az Umbroll rendszerbe.</p><a href="${inviteUrl}">Kattints ide a csatlakozáshoz</a>`,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Hiba:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
