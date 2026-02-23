import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: string;
  phone: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !requestingUser) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabaseClient
      .from("user_profiles")
      .select("role")
      .eq("id", requestingUser.id)
      .single();

    if (profile?.role !== "admin") {
      throw new Error("Only admins can create users");
    }

    const { email, password, full_name, role, phone }: CreateUserRequest = await req.json();

    const { data: authData, error: signUpError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (signUpError || !authData.user) {
      throw new Error(`Failed to create auth user: ${signUpError?.message}`);
    }

    const { error: profileError } = await supabaseClient
      .from("user_profiles")
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role,
        phone,
      });

    if (profileError) {
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    await supabaseClient.from("audit_logs").insert({
      user_id: requestingUser.id,
      action: "create",
      entity_type: "user_profile",
      entity_id: authData.user.id,
      new_values: { email, full_name, role, phone },
    });

    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
