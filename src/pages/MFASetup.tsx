import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Mail, Loader2 } from "lucide-react";
import { translateError } from "@/lib/errorMessages";
import { QRCodeSVG } from "qrcode.react";

const MFASetup = () => {
  const { user, mfaConfigured, refreshRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<"totp" | "email" | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");

  const setupTotp = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const secret = generateTotpSecret();
      const uri = `otpauth://totp/Umbroll:${user.email}?secret=${secret}&issuer=Umbroll`;

      setTotpSecret(secret);
      setTotpUri(uri);
      setSelectedType("totp");
    } catch (error: any) {
      toast({ title: "Hiba", description: translateError(error.message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const setupEmail = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // JAVÍTÁS: RPC hívás upsert helyett
      const { error } = await supabase.rpc("save_mfa_settings" as any, {
        p_mfa_type: "email",
        p_totp_secret: null,
        p_is_verified: true,
      });

      if (error) throw error;

      await refreshRole();
      toast({ title: "Email 2FA beállítva", description: "Bejelentkezéskor email kódot kapsz." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Hiba", description: translateError(error.message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyTotp = async () => {
    if (!user || !totpSecret) return;
    setLoading(true);
    try {
      // 1. Mentés (Nem verifikált) - JAVÍTÁS: RPC hívás
      const { error: saveError } = await supabase.rpc("save_mfa_settings" as any, {
        p_mfa_type: "totp",
        p_totp_secret: totpSecret,
        p_is_verified: false,
      });

      if (saveError) throw saveError;

      // 2. Kód ellenőrzés (Edge Function)
      const { data, error } = await supabase.functions.invoke("verify-mfa", {
        body: { userId: user.id, code: verificationCode, mfaType: "totp" },
      });

      if (error || !data?.verified) {
        toast({ title: "Hibás kód", description: data?.error || "Kérjük, próbáld újra.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // 3. Véglegesítés (Verifikált) - JAVÍTÁS: RPC hívás
      const { error: finalError } = await supabase.rpc("save_mfa_settings" as any, {
        p_mfa_type: "totp",
        p_totp_secret: totpSecret,
        p_is_verified: true,
      });

      if (finalError) throw finalError;

      await refreshRole();
      toast({ title: "TOTP 2FA beállítva", description: "A kétlépcsős azonosítás aktív." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Hiba", description: translateError(error.message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (selectedType === "totp" && totpUri) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center">
            <CardTitle>TOTP beállítás</CardTitle>
            <CardDescription>Olvasd be a QR kódot az Authenticator alkalmazásoddal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-lg bg-white p-4">
                <QRCodeSVG value={totpUri!} size={200} />
              </div>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">Vagy másold be kézzel a titkos kulcsot:</p>
              <code className="text-sm font-mono break-all">{totpSecret}</code>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyTotp();
              }}
            >
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="6 jegyű kód"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg tracking-widest"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || verificationCode.length !== 6}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Megerősítés"}
              </Button>
            </form>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setSelectedType(null);
                setTotpUri(null);
                setTotpSecret(null);
                setVerificationCode("");
              }}
            >
              Vissza
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <CardTitle>Kétlépcsős azonosítás (2FA)</CardTitle>
          <CardDescription>Válaszd ki a 2FA módszeredet a fiókod védelméhez</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex items-center gap-4"
            onClick={setupTotp}
            disabled={loading}
          >
            <Shield className="h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="font-semibold">Authenticator app</p>
              <p className="text-sm text-muted-foreground">Google/Microsoft Authenticator</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-auto py-4 flex items-center gap-4"
            onClick={setupEmail}
            disabled={loading}
          >
            <Mail className="h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="font-semibold">Email kód</p>
              <p className="text-sm text-muted-foreground">Kód küldése az email címedre</p>
            </div>
          </Button>

          {mfaConfigured && (
            <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
              Vissza
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function generateTotpSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  const arr = new Uint8Array(20);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 20; i++) {
    secret += chars[arr[i] % 32];
  }
  return secret;
}

export default MFASetup;
