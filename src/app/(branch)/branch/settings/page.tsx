'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Settings,
    Bell,
    Shield,
    User,
    Building2,
    Lock,
    Mail,
    Phone,
    MapPin,
    Save,
    Clock,
    Users,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

export default function BranchSettingsPage() {
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [smsNotifications, setSmsNotifications] = useState(false)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gradient-emerald">
                    Branch Settings
                </h1>
                <p className="text-muted-foreground mt-2">Manage your branch configuration and preferences</p>
            </div>

            <div className="grid gap-6">
                {/* Branch Information */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="glass border-green-100">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-emerald-700" />
                                </div>
                                <div>
                                    <CardTitle>Branch Information</CardTitle>
                                    <CardDescription>Update your branch details</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="branchName">Branch Name</Label>
                                    <Input 
                                        id="branchName" 
                                        placeholder="Main Branch"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="branchCode">Branch Code</Label>
                                    <Input 
                                        id="branchCode" 
                                        placeholder="BRN001"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Email
                                    </Label>
                                    <Input 
                                        id="email" 
                                        type="email"
                                        placeholder="branch@example.com"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        Phone
                                    </Label>
                                    <Input 
                                        id="phone" 
                                        placeholder="+91 98765 43210"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address" className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Address
                                </Label>
                                <Textarea 
                                    id="address" 
                                    placeholder="Enter branch address"
                                    className="border-green-200 focus:border-emerald-500"
                                    rows={3}
                                />
                            </div>
                            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white">
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Operating Hours */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="glass border-green-100">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-blue-700" />
                                </div>
                                <div>
                                    <CardTitle>Operating Hours</CardTitle>
                                    <CardDescription>Set your branch working hours</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="openTime">Opening Time</Label>
                                    <Input 
                                        id="openTime" 
                                        type="time"
                                        defaultValue="06:00"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="closeTime">Closing Time</Label>
                                    <Input 
                                        id="closeTime" 
                                        type="time"
                                        defaultValue="22:00"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white">
                                <Save className="w-4 h-4 mr-2" />
                                Update Hours
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Notifications */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="glass border-green-100">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-amber-700" />
                                </div>
                                <div>
                                    <CardTitle>Notification Preferences</CardTitle>
                                    <CardDescription>Manage how you receive updates</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive notifications about payments and memberships
                                    </p>
                                </div>
                                <Switch 
                                    checked={emailNotifications}
                                    onCheckedChange={setEmailNotifications}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">SMS Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get SMS alerts for important events
                                    </p>
                                </div>
                                <Switch 
                                    checked={smsNotifications}
                                    onCheckedChange={setSmsNotifications}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Expiry Reminders</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Alert when memberships are about to expire
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Security */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="glass border-green-100">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-red-700" />
                                </div>
                                <div>
                                    <CardTitle>Security Settings</CardTitle>
                                    <CardDescription>Manage access and security options</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input 
                                    id="currentPassword" 
                                    type="password"
                                    placeholder="Enter current password"
                                    className="border-green-200 focus:border-emerald-500"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input 
                                        id="newPassword" 
                                        type="password"
                                        placeholder="Enter new password"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input 
                                        id="confirmPassword" 
                                        type="password"
                                        placeholder="Confirm new password"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            <Button className="bg-red-600 hover:bg-red-700 text-white">
                                <Lock className="w-4 h-4 mr-2" />
                                Update Password
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
