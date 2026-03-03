import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Buffer } from "node:buffer";
import process from "node:process"; // JAVÍTÁS: Plusz Node.js kompatibilitás
// JAVÍTÁS: Verzió frissítése 6.9.14-re a gyorsítótár (cache) kényszerített törléséhez!
import nodemailer from "npm:nodemailer@6.9.14";

// JAVÍTÁS: A legbiztonságosabb Node.js polyfill Deno környezethez
(globalThis as any).Buffer = Buffer;
(globalThis as any).process = process;
(globalThis as any).global = globalThis; 

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // CORS kezelés
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Környezeti változók ellenőrzése az elején
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const smtpUser = Deno.env.get("MAILTRAP_SMTP_USER");
    const smtpPass = Deno.env.get("MAILTRAP_SMTP_PASS");

    if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
      throw new Error("Supabase konfiguráció hiányzik (URL vagy kulcsok).");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Hiányzó vagy hibás Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "A felhasználó nem azonosítható." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // JSON body olvasása
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Érvénytelen JSON formátum." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId } = body;
    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: "Nincs jogosultságod ehhez a művelethez." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Kód generálás (6 jegyű szám)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const { error: dbError } = await serviceClient
      .from("user_mfa_settings")
      .update({
        email_code: code,
        email_code_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        email_code_attempts: 0,
      })
      .eq("user_id", userId);

    if (dbError) {
      console.error("Adatbázis hiba:", dbError);
      throw new Error("Nem sikerült menteni a kódot.");
    }

    // Email küldés SMTP-vel
    if (!smtpUser || !smtpPass) {
      console.warn("MAILTRAP_SMTP_USER vagy PASS hiányzik! A kód csak adatbázisba került.");
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Email rendszer nincs beállítva, de a kód generálva.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const transporter = nodemailer.createTransport({
      host: "live.smtp.mailtrap.io",
      port: 587,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: '"Umbroll AI" <ai@umbroll.hu>',
      to: user.email,
      subject: `Bejelentkezési kód: ${code} - Umbroll`,
      text: `A belépési kódod: ${code}. 10 percig érvényes.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
            .header { background-color: #0f172a; padding: 30px 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 40px 30px; text-align: center; color: #334155; }
            .content p { font-size: 16px; line-height: 1.6; margin-bottom: 25px; }
            .code-box { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0f172a; margin: 0 auto 25px auto; width: max-content; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Umbroll AI & Dashboard</h1>
            </div>
            <div class="content">
              <h2>Bejelentkezési kód</h2>
              <p>Valaki be szeretne lépni az Umbroll fiókodba. A folyamat befejezéséhez használd az alábbi egyszer használatos kódot:</p>
              
              <div class="code-box">${code}</div>
              
              <p style="font-size: 14px; color: #dc2626; font-weight: 500;">A kód 10 perc múlva lejár.</p>
              <p style="font-size: 14px; margin-top: 20px; color: #94a3b8;">Ha nem te próbáltál meg bejelentkezni, kérjük azonnal változtasd meg a jelszavadat a felületen.</p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Umbroll. Minden jog fenntartva.
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Végzetes hiba a send-mfa-code függvényben:", error);
    return new Response(JSON.stringify({ error: error.message || "Belső szerverhiba történt." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
