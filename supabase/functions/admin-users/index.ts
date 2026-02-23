import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const jwtToken = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(jwtToken);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = claimsData.claims.sub as string;
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Csak admin végezheti ezt a műveletet" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // LIST action
    if (action === "list") {
      const { data: roles, error: rolesError } = await serviceClient
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: true });

      if (rolesError) throw rolesError;

      // Get all auth users to map emails
      const { data: authData, error: authError } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
      if (authError) throw authError;

      const emailMap = new Map<string, string>();
      for (const u of authData.users) {
        emailMap.set(u.id, u.email || "");
      }

      const result = (roles || []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        role: r.role,
        email: emailMap.get(r.user_id) || "N/A",
        created_at: r.created_at,
      }));

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE USER action
    if (action === "delete") {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const { userId } = body;

      if (!userId || typeof userId !== "string" || !uuidRegex.test(userId)) {
        return new Response(JSON.stringify({ error: "Érvénytelen userId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (userId === callerUserId) {
        return new Response(JSON.stringify({ error: "Nem törölheted saját fiókodat" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get user email before deleting
      const { data: authUser } = await serviceClient.auth.admin.getUserById(userId);
      const userEmail = authUser?.user?.email;

      // Delete MFA settings
      await serviceClient.from("user_mfa_settings").delete().eq("user_id", userId);
      // Delete role
      await serviceClient.from("user_roles").delete().eq("user_id", userId);
      // Mark invitation as deleted
      if (userEmail) {
        await serviceClient
          .from("user_invitations")
          .update({ deleted: true })
          .eq("email", userEmail);
      }
      // Delete auth user
      const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- ÚJ BLOKK: JOGOSULTSÁG MÓDOSÍTÁSA ---
    if (action === "update") {
      const { userId, role } = body;

      if (!userId || !role || (role !== "admin" && role !== "user")) {
        return new Response(JSON.stringify({ error: "Érvénytelen adatok a módosításhoz" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (userId === callerUserId && role === "user") {
        return new Response(JSON.stringify({ error: "Saját magadtól nem veheted el az admin jogot" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await serviceClient
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // --- ÚJ BLOKK: MEGHÍVÓ TÖRLÉSE ---
    if (action === "deleteInvitation") {
      const { id } = body;
      
      if (!id) {
        return new Response(JSON.stringify({ error: "Hiányzó meghívó ID" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Átállítjuk a deleted státuszt true-ra az adatbázisban
      const { error: invError } = await serviceClient
        .from("user_invitations")
        .update({ deleted: true })
        .eq("id", id);

      if (invError) throw invError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ismeretlen művelet" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("admin-users error:", error);
    return new Response(JSON.stringify({ error: "Belső szerverhiba" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
