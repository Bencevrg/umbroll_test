import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { UserPlus, Send, Trash2, Search, Loader2 } from "lucide-react"; // Loader2 hozzáadva a töltéshez
import { translateError } from "@/lib/errorMessages";

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "user";
  email?: string;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: "admin" | "user";
  used: boolean;
  deleted: boolean;
  expires_at: string;
}

const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Új state a gombok töltéséhez
  const [searchEmail, setSearchEmail] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [usersRes, invRes] = await Promise.all([
      supabase.functions.invoke("admin-users", { body: { action: "list" } }),
      // JAVÍTÁS 1: Nem kérjük le a '*' (mindent), hogy a 'token' ne kerüljön a frontendhez
      supabase
        .from("user_invitations")
        .select("id, email, role, used, deleted, expires_at, created_at")
        .eq("deleted", false)
        .order("created_at", { ascending: false }),
    ]);

    if (usersRes.data && !usersRes.error) {
      const data = usersRes.data as { error?: string } | UserRole[];
      if (!("error" in data)) setRoles(data as UserRole[]);
    }
    if (invRes.data) setInvitations(invRes.data as Invitation[]);
  };

  const sendInvite = async () => {
    if (!newEmail || !user) return;
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("invite-user", {
        body: { action: "invite", email: newEmail, role: newRole },
      });
      if (response.error) throw response.error;
      const data = response.data as { error?: string };
      if (data.error) throw new Error(data.error);
      toast({ title: "Meghívó elküldve", description: `Meghívó elküldve: ${newEmail}` });
      setNewEmail("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Hiba", description: translateError(error.message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // JAVÍTÁS 2: Edge Function használata a közvetlen DB törlés helyett
  const deleteInvitation = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("admin-users", {
        body: { action: "deleteInvitation", id },
      });

      if (error) throw error;

      toast({ title: "Meghívó törölve" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Hiba", description: "Nem sikerült törölni a meghívót.", variant: "destructive" });
    }
  };

  // JAVÍTÁS 3: Edge Function használata a közvetlen DB update helyett
  const updateRole = async (userId: string, newRoleValue: "admin" | "user") => {
    setActionLoading(userId);
    try {
      const { error } = await supabase.functions.invoke("admin-users", {
        body: { action: "update", userId, role: newRoleValue },
      });

      if (error) throw error;

      toast({ title: "Szerep módosítva" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Hiba", description: "Nem sikerült módosítani a jogosultságot.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string) => {
    setDeletingId(userId);
    try {
      const res = await supabase.functions.invoke("admin-users", {
        body: { action: "delete", userId },
      });
      if (res.error) throw res.error;
      const data = res.data as { error?: string; success?: boolean };
      if (data.error) throw new Error(data.error);
      toast({ title: "Felhasználó törölve" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Hiba", description: translateError(error.message), variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRoles = roles.filter(
    (r) => !searchEmail || (r.email || "").toLowerCase().includes(searchEmail.toLowerCase()),
  );

  return (
    <DashboardLayout activeTab="admin" onTabChange={(tab) => navigate(`/?tab=${tab}`)}>
      <div className="space-y-8">
        {/* Invite Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Felhasználó meghívása
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Input
                type="email"
                placeholder="Email cím"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="max-w-xs"
              />
              <Select value={newRole} onValueChange={(v: "admin" | "user") => setNewRole(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={sendInvite} disabled={loading || !newEmail}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Meghívó küldése
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Section */}
        <Card>
          <CardHeader>
            <CardTitle>Felhasználók ({filteredRoles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Keresés email alapján..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="pl-9"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Szerep</TableHead>
                  <TableHead>Műveletek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.user_id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-sm">{r.email || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={r.role === "admin" ? "default" : "secondary"}>{r.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* JAVÍTVA: r.user_id átadása r.id helyett, és loading kezelés */}
                        <Select
                          value={r.role}
                          onValueChange={(v: "admin" | "user") => updateRole(r.user_id, v)}
                          disabled={r.user_id === user?.id || actionLoading === r.user_id}
                        >
                          <SelectTrigger className="w-28">
                            {actionLoading === r.user_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>

                        {r.user_id !== user?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={deletingId === r.user_id}>
                                {deletingId === r.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Felhasználó törlése</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Biztosan törölni szeretnéd ezt a felhasználót ({r.email || r.user_id.slice(0, 8)})? Ez
                                  a művelet nem vonható vissza.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Mégse</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUser(r.user_id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Törlés
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Invitations Section */}
        <Card>
          <CardHeader>
            <CardTitle>Meghívók ({invitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Szerep</TableHead>
                  <TableHead>Státusz</TableHead>
                  <TableHead>Lejárat</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant={inv.role === "admin" ? "default" : "secondary"}>{inv.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.deleted ? "destructive" : inv.used ? "secondary" : "outline"}>
                        {inv.deleted ? "Törölve" : inv.used ? "Felhasználva" : "Aktív"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(inv.expires_at).toLocaleDateString("hu-HU")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteInvitation(inv.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
