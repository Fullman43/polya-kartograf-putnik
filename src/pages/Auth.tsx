import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { OrganizationRegistration } from "@/components/auth/OrganizationRegistration";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"operator" | "employee" | "organization_owner">("employee");

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Redirect based on role after login
        setTimeout(async () => {
          const { data: userRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();
          
          if (
            userRole?.role === "operator" || 
            userRole?.role === "manager" ||
            userRole?.role === "organization_owner" ||
            userRole?.role === "organization_admin"
          ) {
            navigate("/dashboard");
          } else {
            navigate("/employee");
          }
        }, 100);
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      toast({
        title: "Ошибка входа",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешный вход",
        description: "Добро пожаловать!",
      });
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          phone: phone,
          role: role,
        },
      },
    });

    if (error) {
      toast({
        title: "Ошибка регистрации",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешная регистрация",
        description: "Аккаунт создан! Выполняется вход...",
      });
    }

    setLoading(false);
  };

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Контроль персонала</CardTitle>
          <CardDescription>
            Система мониторинга и управления сотрудниками
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="signup">Регистрация</TabsTrigger>
              <TabsTrigger value="organization">Организация</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="example@mail.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Вход..." : "Войти"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">ФИО</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Иванов Иван Иванович"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="example@mail.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Телефон</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Роль</Label>
                  <Select value={role} onValueChange={(value: "operator" | "employee" | "organization_owner") => setRole(value)}>
                    <SelectTrigger id="signup-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Сотрудник</SelectItem>
                      <SelectItem value="operator">Оператор</SelectItem>
                      <SelectItem value="organization_owner">Владелец организации</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Пароль</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="organization">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Зарегистрируйте свою организацию, чтобы начать использовать сервис. 
                  Пробный период - 14 дней.
                </p>
                <OrganizationRegistration />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Button 
        onClick={() => navigate("/")} 
        variant="outline" 
        className="w-full bg-background"
      >
        Вернуться на главную
      </Button>
      </div>
    </div>
  );
};

export default Auth;
