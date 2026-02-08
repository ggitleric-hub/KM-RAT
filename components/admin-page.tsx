// t.me/SentinelLinks

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  RefreshCw,
  Users,
  Trash2,
  Ban,
  CheckCircle,
  Shield,
  UserCheck,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import {
  getUsers,
  deleteUser,
  toggleAdminRole,
  blockUser,
  type User,
} from "@/lib/auth"
import { NewsManager } from "@/components/news-manager"

interface AdminPageProps {
  currentUser?: User | null
}

// t.me/SentinelLinks
export function AdminPage({ currentUser }: AdminPageProps) {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = () => {
    try {
      const usersData = getUsers()
      setUsers(usersData)
    } catch (error) {
      toast.error("Ошибка загрузки данных")
    }
  }

  const handleDeleteUser = (userId: string) => {
    try {
      const success = deleteUser(userId)
      if (success) {
        refreshData()
        toast.success("Пользователь удален")
      } else {
        toast.error("Невозможно удалить этого пользователя")
      }
    } catch (error) {
      toast.error("Ошибка удаления пользователя")
    }
  }

  const handleToggleAdmin = (userId: string, isAdmin: boolean) => {
    if (currentUser?.username !== "Admin") {
      toast.error("Только Admin может выдавать админ права")
      return
    }

    try {
      const success = toggleAdminRole(userId, !isAdmin)
      if (success) {
        refreshData()
        toast.success(isAdmin ? "Админ права сняты" : "Админ права выданы")
      } else {
        toast.error("Ошибка изменения прав")
      }
    } catch (error) {
      toast.error("Ошибка изменения прав")
    }
  }

  const handleBlockUser = (userId: string, blocked: boolean) => {
    try {
      const success = blockUser(userId, blocked)
      if (success) {
        refreshData()
        toast.success(blocked ? "Пользователь заблокирован" : "Пользователь разблокирован")
      } else {
        toast.error("Ошибка изменения статуса пользователя")
      }
    } catch (error) {
      toast.error("Ошибка изменения статуса")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!currentUser?.isAdmin) {
    return (
      <div className="flex-1 bg-background p-6 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Доступ запрещен</h2>
          <p className="text-muted-foreground">У вас нет прав для доступа к админ-панели</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background p-6 overflow-auto pb-16">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Админ панель
          </h2>
          <p className="text-muted-foreground">Управление пользователями</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2">
              <FileText className="w-4 h-4" />
              Новости
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Управление пользователями</h3>
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Обновить
              </Button>
            </div>

            <div className="grid gap-3">
              {users.map((user) => (
                <Card key={user.id} className={user.blocked ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${user.isAdmin ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                        >
                          {user.isAdmin ? <Shield className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.username}</span>
                            {user.isAdmin && (
                              <Badge variant="default" className="text-xs">
                                Админ
                              </Badge>
                            )}
                            {user.blocked && (
                              <Badge variant="destructive" className="text-xs">
                                Заблокирован
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Создан: {formatDate(user.createdAt)}
                          </div>
                        </div>
                      </div>

                      {currentUser?.isAdmin && user.username !== "Admin" && (
                        <div className="flex items-center gap-2">
                          {currentUser?.username === "Admin" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                              className={user.isAdmin ? "text-orange-500" : "text-blue-500"}
                              title={user.isAdmin ? "Снять админ права" : "Дать админ права"}
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBlockUser(user.id, !user.blocked)}
                            className={user.blocked ? "text-green-500" : "text-amber-500"}
                            title={user.blocked ? "Разблокировать" : "Заблокировать"}
                          >
                            {user.blocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-4">
            <NewsManager currentUser={currentUser} />
          </TabsContent>
        </Tabs>
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
