"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash,
  UserPlus,
  Users,
  CheckCircle,
  XCircle,
  Key,
  Copy,
  RefreshCw,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  fetchAllUsers,
  createUserAction,
  updateUserAction,
  deleteUserAction,
  verifyUserAction,
  resetPasswordAction,
  generateRandomPassword,
} from "@/app/actions/user-management"

// Types
interface User {
  id: string
  email: string
  full_name: string | null
  role: string | null
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
}

export default function UsersPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [verificationFilter, setVerificationFilter] = useState<"all" | "verified" | "unverified">("all")

  // Form states for create/edit
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("user")
  const [formLoading, setFormLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState("")

  // Check if user is admin, if not redirect
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/login?redirect=/admin/users")
    }
  }, [user, isAdmin, loading, router])

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const { data, error } = await fetchAllUsers()

        if (error) throw new Error(error)

        setUsers(data || [])
      } catch (error: any) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error fetching users",
          description: error.message || "There was a problem loading the user list.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user && isAdmin) {
      fetchUsers()
    }
  }, [user, isAdmin])

  // Filter users based on search query and verification status
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))

    if (verificationFilter === "all") return matchesSearch
    if (verificationFilter === "verified") return matchesSearch && !!user.email_confirmed_at
    if (verificationFilter === "unverified") return matchesSearch && !user.email_confirmed_at

    return matchesSearch
  })

  // Generate random password
  const handleGeneratePassword = async () => {
    const password = await generateRandomPassword()
    setPassword(password)
    setGeneratedPassword(password)
  }

  // Copy password to clipboard
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword || password)
    toast({
      title: "Password copied",
      description: "The password has been copied to your clipboard.",
    })
  }

  // Create user
  const handleCreateUser = async () => {
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Email and password are required.",
        variant: "destructive",
      })
      return
    }

    try {
      setFormLoading(true)

      const { data, error } = await createUserAction(email, password, fullName, role)

      if (error) throw new Error(error)

      if (data) {
        // Add the new user to the list
        setUsers((prev) => [
          {
            id: data.id,
            email,
            full_name: fullName,
            role,
            created_at: new Date().toISOString(),
            last_sign_in_at: null,
            email_confirmed_at: new Date().toISOString(), // Since we're auto-verifying
          },
          ...prev,
        ])

        toast({
          title: "User created",
          description: `User ${email} has been created successfully and is ready to login.`,
        })

        // Reset form
        setEmail("")
        setPassword("")
        setFullName("")
        setRole("user")
        setGeneratedPassword("")
        setIsCreateDialogOpen(false)
      }
    } catch (error: any) {
      console.error("Error creating user:", error)
      toast({
        title: "Error creating user",
        description: error.message || "There was a problem creating the user.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  // Update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      setFormLoading(true)

      const { error } = await updateUserAction(selectedUser.id, fullName, role)

      if (error) throw new Error(error)

      // Update the user in the list
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, full_name: fullName, role } : u)))

      toast({
        title: "User updated",
        description: `User ${selectedUser.email} has been updated successfully.`,
      })

      setIsEditDialogOpen(false)
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast({
        title: "Error updating user",
        description: error.message || "There was a problem updating the user.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setFormLoading(true)

      const { error } = await deleteUserAction(selectedUser.id)

      if (error) throw new Error(error)

      // Remove the user from the list
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id))

      toast({
        title: "User deleted",
        description: `User ${selectedUser.email} has been deleted successfully.`,
      })

      setIsDeleteDialogOpen(false)
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error deleting user",
        description: error.message || "There was a problem deleting the user.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  // Reset password
  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return

    try {
      setFormLoading(true)

      const { error } = await resetPasswordAction(selectedUser.id, newPassword)

      if (error) throw new Error(error)

      toast({
        title: "Password reset",
        description: `Password for ${selectedUser.email} has been reset successfully.`,
      })

      setIsResetPasswordDialogOpen(false)
      setNewPassword("")
    } catch (error: any) {
      console.error("Error resetting password:", error)
      toast({
        title: "Error resetting password",
        description: error.message || "There was a problem resetting the password.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  // Manually verify a user
  const handleVerifyUser = async (userId: string) => {
    try {
      const { error } = await verifyUserAction(userId)

      if (error) throw new Error(error)

      // Update the user in the list
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, email_confirmed_at: new Date().toISOString() } : u)),
      )

      toast({
        title: "User verified",
        description: "The user has been verified successfully and can now login.",
      })
    } catch (error: any) {
      console.error("Error verifying user:", error)
      toast({
        title: "Error verifying user",
        description: error.message || "There was a problem verifying the user.",
        variant: "destructive",
      })
    }
  }

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFullName(user.full_name || "")
    setRole(user.role || "user")
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  // Open reset password dialog
  const openResetPasswordDialog = (user: User) => {
    setSelectedUser(user)
    setNewPassword("")
    setIsResetPasswordDialogOpen(true)
  }

  // Generate random password for reset
  const handleGenerateNewPassword = async () => {
    const password = await generateRandomPassword()
    setNewPassword(password)
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Create and manage user accounts</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Users Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Total Users</div>
              <div className="mt-1 flex items-center">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">{users.length}</div>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Admins</div>
              <div className="mt-1 flex items-center">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">{users.filter((u) => u.role === "admin").length}</div>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Verified Users</div>
              <div className="mt-1 flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">{users.filter((u) => !!u.email_confirmed_at).length}</div>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Unverified Users</div>
              <div className="mt-1 flex items-center">
                <XCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">{users.filter((u) => !u.email_confirmed_at).length}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <Tabs defaultValue="all" onValueChange={(value) => setVerificationFilter(value as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="unverified">Unverified</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "outline"}>
                      {user.role === "admin" ? "Admin" : "User"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.email_confirmed_at ? (
                      <Badge variant="success" className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                        <XCircle className="mr-1 h-3 w-3" /> Unverified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
                          <Key className="mr-2 h-4 w-4" /> Reset Password
                        </DropdownMenuItem>
                        {!user.email_confirmed_at && (
                          <DropdownMenuItem onClick={() => handleVerifyUser(user.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Verify Email
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(user)}>
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Create a new user account with verified email.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="flex items-center justify-between">
                <span>Password</span>
                <Button type="button" variant="outline" size="sm" onClick={handleGeneratePassword}>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Generate
                </Button>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1"
                />
                {password && (
                  <Button type="button" variant="outline" size="icon" onClick={handleCopyPassword}>
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                User will be automatically verified and can login immediately with this password.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Tabs defaultValue="user" onValueChange={(value) => setRole(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="user">Regular User</TabsTrigger>
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input id="editEmail" type="email" value={selectedUser?.email || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editFullName">Full Name</Label>
              <Input
                id="editFullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editRole">Role</Label>
              <Tabs defaultValue={role} onValueChange={(value) => setRole(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="user">Regular User</TabsTrigger>
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new password for {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword" className="flex items-center justify-between">
                <span>New Password</span>
                <Button type="button" variant="outline" size="sm" onClick={handleGenerateNewPassword}>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Generate
                </Button>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="newPassword"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1"
                />
                {newPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(newPassword)
                      toast({
                        title: "Password copied",
                        description: "The new password has been copied to your clipboard.",
                      })
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                The user will be able to login with this new password immediately.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={formLoading || !newPassword}>
              {formLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You are about to delete the user: <strong>{selectedUser?.email}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
