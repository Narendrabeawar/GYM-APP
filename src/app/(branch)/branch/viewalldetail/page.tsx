'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Clock,
    Dumbbell,
    Image as ImageIcon,
    Info,
    ArrowLeft,
    Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { getBranchSettings } from '@/app/actions/branch'

interface BranchData {
    id?: string
    name?: string
    branch_code?: string
    description?: string
    established_year?: number
    member_capacity?: number
    email?: string
    phone?: string
    whatsapp?: string
    website?: string
    address?: string
    social_media?: string
    nearby_landmarks?: string
    operating_hours?: Record<string, { open: string; close: string; closed: boolean }>
    holiday_hours?: string
    peak_hours?: string
    facilities?: string[]
    amenities?: string[]
    special_features?: string
    manager_name?: string
    certifications?: string
    emergency_contact?: string
    rules?: string
    policies?: string
    images?: string[]
}

export default function ViewAllDetailPage() {
    const [branchData, setBranchData] = useState<BranchData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [branchId, setBranchId] = useState<string>('')
    const router = useRouter()

    // Get branch ID from authenticated user
    useEffect(() => {
        const getBranchId = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (user?.user_metadata?.branch_id) {
                    setBranchId(user.user_metadata.branch_id)
                } else {
                    console.error('No branch ID found in user metadata')
                    router.push('/signin')
                }
            } catch (error) {
                console.error('Error getting branch ID:', error)
                router.push('/signin')
            }
        }

        getBranchId()
    }, [router])

    // Load branch data when branchId is available
    useEffect(() => {
        if (!branchId) return

        const loadBranchData = async () => {
            try {
                const data = await getBranchSettings(branchId)
                setBranchData(data)
            } catch (error) {
                console.error('Error loading branch data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadBranchData()
    }, [branchId])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-emerald-50 to-green-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!branchData) {
        return (
            <div className="min-h-screen bg-linear-to-br from-emerald-50 to-green-50 p-6">
                <div className="max-w-6xl mx-auto text-center">
                    <p className="text-red-600">Failed to load branch information</p>
                    <Button
                        onClick={() => router.back()}
                        className="mt-4 bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        )
    }

    const formatOperatingHours = (hours: Record<string, { open: string; close: string; closed: boolean }> | undefined) => {
        if (!hours) return null

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

        return days.map((day, index) => {
            const dayData = hours[day]
            if (!dayData) return null

            return {
                day: dayNames[index],
                open: dayData.closed ? 'Closed' : `${dayData.open} - ${dayData.close}`,
                closed: dayData.closed
            }
        }).filter(Boolean)
    }

    const operatingHours = formatOperatingHours(branchData.operating_hours)

    return (
        <div className="min-h-screen bg-linear-to-br from-emerald-50 to-green-50">
            {/* Top Header */}
            <div className="max-w-6xl mx-auto px-6 py-4">
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Settings
                    </Button>
                </div>
                <div className="text-center mb-2">
                    <h1 className="text-4xl font-bold text-gradient-emerald mb-2 flex items-center justify-center gap-3">
                        <Building2 className="w-10 h-10 text-emerald-600" />
                        {branchData.name || 'Branch Details'}
                    </h1>
                    <p className="text-lg text-emerald-700 max-w-2xl mx-auto mb-4">
                        Complete branch information and facility overview
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 pt-0 pb-6 space-y-8">
                {/* Basic Information Section */}
                <section className="bg-white rounded-xl shadow-xl border-2 border-emerald-300 overflow-hidden relative">
                    <div className="bg-linear-to-r from-emerald-50 to-green-50 border-b border-emerald-200 p-6">
                        <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-emerald-600" />
                            Basic Information
                        </h2>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Branch Name</label>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{branchData.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Branch Code</label>
                                    <p className="text-xl font-semibold text-emerald-600 mt-2">{branchData.branch_code || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Established Year</label>
                                    <p className="text-xl font-semibold text-gray-900 mt-2">{branchData.established_year || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Member Capacity</label>
                                    <p className="text-xl font-semibold text-emerald-600 mt-2">{branchData.member_capacity || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        {branchData.description && (
                            <div className="mt-8 pt-8 border-t border-gray-200">
                                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                                <p className="text-gray-700 mt-3 leading-relaxed">{branchData.description}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Contact Information Section */}
                <section className="bg-white rounded-xl shadow-lg border border-emerald-200 overflow-hidden">
                    <div className="bg-linear-to-r from-emerald-50 to-green-50 border-b border-emerald-200 p-6">
                        <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-3">
                            <Phone className="w-5 h-5 text-emerald-600" />
                            Contact Information
                        </h2>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <Mail className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-emerald-700">Email</label>
                                        <p className="text-base font-medium text-gray-900">{branchData.email || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <Phone className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-emerald-700">Phone</label>
                                        <p className="text-base font-medium text-gray-900">{branchData.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {branchData.whatsapp && (
                                    <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                            <Phone className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-emerald-700">WhatsApp</label>
                                            <p className="text-base font-medium text-gray-900">{branchData.whatsapp}</p>
                                        </div>
                                    </div>
                                )}

                                {branchData.website && (
                                    <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                            <Building2 className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-emerald-700">Website</label>
                                            <a href={branchData.website} className="text-base font-medium text-emerald-600 hover:text-emerald-800 hover:underline">
                                                {branchData.website}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                    {/* Location */}
                    <section className="bg-white rounded-xl shadow-lg border border-emerald-200 overflow-hidden">
                        <div className="bg-linear-to-r from-emerald-50 to-green-50 border-b border-emerald-200 p-6">
                            <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-emerald-600" />
                                Location & Address
                            </h2>
                        </div>
                        <div className="p-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Full Address</label>
                                    <p className="text-gray-700 mt-2 leading-relaxed whitespace-pre-line">{branchData.address || 'No address available'}</p>
                                </div>
                            </div>

                            {branchData.nearby_landmarks && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Nearby Landmarks</label>
                                    <p className="text-gray-700 mt-2">{branchData.nearby_landmarks}</p>
                                </div>
                            )}

                            {branchData.social_media && (
                                <div className="mt-6">
                                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Social Media</label>
                                    <p className="text-gray-700 mt-2">{branchData.social_media}</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Operating Hours */}
                    <section className="bg-white rounded-xl shadow-lg border border-emerald-200 overflow-hidden">
                        <div className="bg-linear-to-r from-emerald-50 to-green-50 border-b border-emerald-200 p-6">
                            <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-3">
                                <Clock className="w-5 h-5 text-emerald-600" />
                                Operating Hours
                            </h2>
                        </div>
                        <div className="p-8">
                            <div className="space-y-3">
                                {operatingHours && operatingHours.length > 0 ? (
                                    operatingHours.map((hour, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                            <span className="font-medium text-gray-900">{hour?.day}</span>
                                            <span className={`font-medium ${hour?.closed ? 'text-red-600' : 'text-emerald-700'}`}>
                                                {hour?.open}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                        No operating hours set
                                    </div>
                                )}
                            </div>

                            {branchData.holiday_hours && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Holiday Hours</label>
                                    <p className="text-gray-700 mt-2">{branchData.holiday_hours}</p>
                                </div>
                            )}

                            {branchData.peak_hours && (
                                <div className="mt-6">
                                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Peak Hours</label>
                                    <p className="text-gray-700 mt-2">{branchData.peak_hours}</p>
                                </div>
                            )}
                        </div>
                    </section>

                {/* Facilities & Amenities Section */}
                <section className="bg-white rounded-xl shadow-lg border border-emerald-200 overflow-hidden">
                    <div className="bg-linear-to-r from-emerald-50 to-green-50 border-b border-emerald-200 p-6">
                        <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-3">
                            <Dumbbell className="w-5 h-5 text-emerald-600" />
                            Facilities & Amenities
                        </h2>
                    </div>
                    <div className="p-8">
                        {branchData.facilities && branchData.facilities.length > 0 ? (
                            <div className="mb-6">
                                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Facilities</label>
                                <div className="flex flex-wrap gap-2">
                                    {branchData.facilities.map((facility: string, index: number) => (
                                        <span key={index} className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-md font-medium text-sm">
                                            {facility}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500 mb-6">
                                <Dumbbell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                No facilities listed
                            </div>
                        )}

                        {branchData.amenities && branchData.amenities.length > 0 ? (
                            <div>
                                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Amenities</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {branchData.amenities.map((amenity: string, index: number) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0"></div>
                                            <span className="text-gray-700 text-sm">{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                <Info className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                No amenities listed
                            </div>
                        )}

                        {branchData.special_features && (
                            <div className="mt-8 pt-8 border-t border-gray-200">
                                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Special Features</label>
                                <p className="text-gray-700 mt-3 leading-relaxed">{branchData.special_features}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Additional Information Section */}
                <section className="bg-white rounded-xl shadow-lg border border-emerald-200 overflow-hidden">
                    <div className="bg-linear-to-r from-emerald-50 to-green-50 border-b border-emerald-200 p-6">
                        <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-3">
                            <Info className="w-5 h-5 text-emerald-600" />
                            Additional Information
                        </h2>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {branchData.manager_name && (
                                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <Building2 className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-emerald-700">Branch Manager</label>
                                        <p className="text-base font-medium text-gray-900">{branchData.manager_name}</p>
                                    </div>
                                </div>
                            )}

                            {branchData.emergency_contact && (
                                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <Phone className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-emerald-700">Emergency Contact</label>
                                        <p className="text-base font-medium text-gray-900">{branchData.emergency_contact}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {branchData.certifications && (
                            <div className="mt-6">
                                <label className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Certifications & Awards</label>
                                <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <Award className="w-4 h-4 text-emerald-600 inline mr-2" />
                                    <span className="text-gray-700">{branchData.certifications}</span>
                                </div>
                            </div>
                        )}

                        {branchData.rules && (
                            <div className="mt-6">
                                <label className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Gym Rules & Regulations</label>
                                <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{branchData.rules}</p>
                                </div>
                            </div>
                        )}

                        {branchData.policies && (
                            <div className="mt-6">
                                <label className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Membership Policies</label>
                                <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{branchData.policies}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Gallery Section */}
                {branchData.images && branchData.images.length > 0 && (
                    <section className="bg-white rounded-xl shadow-lg border border-emerald-200 overflow-hidden">
                        <div className="bg-linear-to-r from-emerald-50 to-green-50 border-b border-emerald-200 p-6">
                            <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-3">
                                <ImageIcon className="w-5 h-5 text-emerald-600" />
                                Gallery ({branchData.images.length} images)
                            </h2>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {branchData.images.map((image: string, index: number) => (
                                    <div key={index} className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                                        <img
                                            src={image}
                                            alt={`Gallery image ${index + 1}`}
                                            className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                // Fallback for broken images
                                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE2QzE0IDE3LjEgMTMuMSAxOCA4IDE4UzIgMTcuMSAyIDE2VjRDMiAyLjkgMi45IDIgNCAySDEyWk0xNiA3VjE2QzE2IDE4LjIgMTQuMiAyMCAxMiAyMFMyMCAxOC4yIDIwIDE2VjEwSDE4VjE2QzE4IDE3LjEgMTcuMSAxOCA4IDE4UzYgMTcuMSA2IDE2VjEwSDRWMTZDNS45IDIwIDggMjIuMSAxMiAyMkMxNS4xIDIyLjEgMTcuOSA5IDE2IDdaIiBmaWxsPSIjOWNhM2FmIi8+Cjwvc3ZnPgo=';
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
