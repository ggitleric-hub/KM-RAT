// t.me/SentinelLinks

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { login, createUser, getUserByUsername, type User } from "@/lib/auth"
import { Terminal, Lock, UserPlus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AuthPageProps {
  onAuth: (user: User) => void
}

export function AuthPage({ onAuth }: AuthPageProps) {
  const [loginUsername, setLoginUsername] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerUsername, setRegisterUsername] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("")
  const [registerKey, setRegisterKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [registerError, setRegisterError] = useState("")

  const handleLogin = () => {
    setLoginError("")

    if (!loginUsername || !loginPassword) {
      setLoginError("Заполните все поля")
      toast.error("Заполните все поля")
      return
    }

    setIsLoading(true)

    try {
      const user = getUserByUsername(loginUsername)

      if (!user) {
        const errorMsg = "Пользователь не найден"
        setLoginError(errorMsg)
        toast.error(errorMsg)
        setIsLoading(false)
        return
      }

      if (user.password !== loginPassword) {
        const errorMsg = "Неверный пароль"
        setLoginError(errorMsg)
        toast.error(errorMsg)
        setIsLoading(false)
        return
      }

      if (user.blocked) {
        const errorMsg = "Аккаунт заблокирован"
        setLoginError(errorMsg)
        toast.error(errorMsg)
        setIsLoading(false)
        return
      }

      // Auto login - no pending status check
      const authState = login(loginUsername, loginPassword, true)
      if (authState.isAuthenticated && authState.user) {
        toast.success(`Добро пожаловать, ${authState.user.username}!`)
        onAuth(authState.user)
      } else {
        const errorMsg = "Ошибка входа"
        setLoginError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      const errorMsg = "Ошибка входа"
      setLoginError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    setRegisterError("")

    if (!registerUsername || !registerPassword || !registerConfirmPassword) {
      setRegisterError("Заполните все поля")
      toast.error("Заполните все поля")
      return
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Пароли не совпадают")
      toast.error("Пароли не совпадают")
      return
    }

    if (registerUsername.length < 3) {
      setRegisterError("Имя пользователя должно быть не менее 3 символов")
      toast.error("Имя пользователя должно быть не менее 3 символов")
      return
    }

    if (registerPassword.length < 4) {
      setRegisterError("Пароль должен быть не менее 4 символов")
      toast.error("Пароль должен быть не менее 4 символов")
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(registerUsername)) {
      setRegisterError("Имя пользователя может содержать только буквы, цифры и _")
      toast.error("Имя пользователя может содержать только буквы, цифры и _")
      return
    }

    setIsLoading(true)

    try {
      // Check if user exists
      const existingUser = getUserByUsername(registerUsername)
      if (existingUser) {
        setRegisterError("Пользователь с таким именем уже существует")
        toast.error("Пользователь с таким именем уже существует")
        setIsLoading(false)
        return
      }

      // Check promo code for admin
      const isAdmin = registerKey === "Admin-KM-RAT-1488"

      // Create user - auto approved, no pending status
      const newUser = createUser(registerUsername, registerPassword, isAdmin)

      if (newUser) {
        if (isAdmin) {
          toast.success("Аккаунт создан! Вы получили права администратора", {
            description: "Добро пожаловать, Admin!",
          })
        } else {
          toast.success("Аккаунт успешно создан", {
            description: "Вы можете войти в систему.",
          })
        }
        setRegisterUsername("")
        setRegisterPassword("")
        setRegisterConfirmPassword("")
        setRegisterKey("")
        setRegisterError("")
      } else {
        setRegisterError("Ошибка создания аккаунта")
        toast.error("Ошибка создания аккаунта")
      }
    } catch (error) {
      setRegisterError("Ошибка создания аккаунта")
      toast.error("Ошибка создания аккаунта")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-6">
            <Terminal className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Grob rat</h1>
          <p className="text-sm text-muted-foreground">Remote Administration Platform</p>
        </div>

        <Card className="border shadow-lg">
          <Tabs defaultValue="login">
            <CardHeader className="pb-3">
              <TabsList className="grid w-full grid-cols-2 h-11">
                <TabsTrigger value="login" className="gap-2">
                  <Lock className="w-4 h-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pb-6">
              <TabsContent value="login" className="space-y-4 mt-0">
                {loginError && (
                  <Alert variant="destructive" className="animate-fade-in">
                    <AlertDescription className="text-sm">{loginError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login-username" className="text-sm font-medium">
                    Username
                  </Label>
                  <Input
                    id="login-username"
                    placeholder="Enter your username"
                    value={loginUsername}
                    onChange={(e) => {
                      setLoginUsername(e.target.value)
                      setLoginError("")
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value)
                      setLoginError("")
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="h-10"
                  />
                </div>

                <Button onClick={handleLogin} className="w-full h-10 mt-6 btn-hover" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-0">
                {registerError && (
                  <Alert variant="destructive" className="animate-fade-in">
                    <AlertDescription className="text-sm">{registerError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="register-username" className="text-sm font-medium">
                    Username
                  </Label>
                  <Input
                    id="register-username"
                    placeholder="Choose a username"
                    value={registerUsername}
                    onChange={(e) => {
                      setRegisterUsername(e.target.value)
                      setRegisterError("")
                    }}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Create a password"
                    value={registerPassword}
                    onChange={(e) => {
                      setRegisterPassword(e.target.value)
                      setRegisterError("")
                    }}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={registerConfirmPassword}
                    onChange={(e) => {
                      setRegisterConfirmPassword(e.target.value)
                      setRegisterError("")
                    }}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-key" className="text-sm font-medium">
                    Promo Code (optional)
                  </Label>
                  <Input
                    id="register-key"
                    placeholder="Admin-KM-RAT-1488"
                    value={registerKey}
                    onChange={(e) => {
                      setRegisterKey(e.target.value)
                      setRegisterError("")
                    }}
                    className="h-10 font-mono"
                  />
                </div>

                <Button onClick={handleRegister} className="w-full h-10 mt-6 btn-hover" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        // t.me/SentinelLinks
        <p className="text-center text-xs text-muted-foreground/70 mt-8">
          2026 Grob rat. Professional Remote Administration.
        </p>
      </div>
    </div>
  )
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
