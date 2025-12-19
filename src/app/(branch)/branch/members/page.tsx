'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    Search,
    UserPlus,
    Filter,
    Download,
    MoreVertical,
    Mail,
    Phone,
    Calendar,
    Activity,
    CheckCircle2,
    Clock,
    AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'

// Sample data - Replace with actual API call
const memberStats = [
    { name: 'Total Members', value: '234', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Active', value: '189', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { name: 'Expiring Soon', value: '28', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Inactive', value: '17', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
]

const sampleMembers = [
    { id: 1, name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91 98765 43210', plan: 'Premium', status: 'active', joinDate: '2024-01-15', expiryDate: '2025-01-15' },
    { id: 2, name: 'Priya Singh', email: 'priya@example.com', phone: '+91 98765 43211', plan: 'Gold', status: 'active', joinDate: '2024-02-20', expiryDate: '2024-12-20' },
    { id: 3, name: 'Amit Kumar', email: 'amit@example.com', phone: '+91 98765 43212', plan: 'Basic', status: 'expiring', joinDate: '2024-03-10', expiryDate: '2024-12-25' },
    { id: 4, name: 'Sneha Patel', email: 'sneha@example.com', phone: '+91 98765 43213', plan: 'Premium', status: 'active', joinDate: '2024-01-05', expiryDate: '2025-01-05' },
    { id: 5, name: 'Vikram Reddy', email: 'vikram@example.com', phone: '+91 98765 43214', plan: 'Gold', status: 'inactive', joinDate: '2023-11-15', expiryDate: '2024-11-15' },
]

export default function BranchMembersPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedFilter, setSelectedFilter] = useState('all')
    const router = useRouter()

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Active</Badge>
            case 'expiring':
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">Expiring Soon</Badge>
            case 'inactive':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Inactive</Badge>
            default:
                return <Badge>Unknown</Badge>
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient-emerald">
                        Member Management
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage and monitor all branch members</p>
                </div>
                <Button 
                    onClick={() => router.push('/branch/members/register')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald"
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add New Member
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {memberStats.map((stat, index) => (
                    <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="glass border-green-100 card-hover">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{stat.name}</p>
                                        <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Members Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="glass border-green-100">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-xl">All Members</CardTitle>
                                <CardDescription>Complete list of enrolled members</CardDescription>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:flex-none sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search members..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                                <Button variant="outline" size="icon" className="border-green-200 hover:bg-green-50">
                                    <Filter className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="border-green-200 hover:bg-green-50">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {sampleMembers.map((member, index) => (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center justify-between p-4 bg-white border border-green-100 rounded-xl hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <Avatar className="w-12 h-12 border-2 border-emerald-100">
                                            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                                                {member.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-semibold text-foreground">{member.name}</h3>
                                                {getStatusBadge(member.status)}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {member.email}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {member.phone}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Expires: {member.expiryDate}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="hidden md:block">
                                            <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                                {member.plan}
                                            </Badge>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="hover:bg-green-50">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                            <DropdownMenuItem>Edit Member</DropdownMenuItem>
                                            <DropdownMenuItem>Renew Membership</DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
