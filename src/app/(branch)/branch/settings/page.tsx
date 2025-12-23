'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Save,
    Clock,
    Dumbbell,
    Image as ImageIcon,
    Info,
    Upload,
    X,
    Edit,
    Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { saveBranchSettings, getBranchSettings } from '@/app/actions/branch'
import { createClient } from '@/lib/supabase/client'
import { SuccessModal } from '@/components/SuccessModal'

export default function BranchSettingsPage() {
    const [uploadedImages, setUploadedImages] = useState<string[]>([])
    const [facilities, setFacilities] = useState<string[]>([])
    const [newFacility, setNewFacility] = useState('')
    const [isCompressing, setIsCompressing] = useState(false)
    const [uploadError, setUploadError] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [branchId, setBranchId] = useState<string>('')
    const [successModal, setSuccessModal] = useState({
        isOpen: false,
        title: '',
        message: ''
    })
    const [amenitiesSelected, setAmenitiesSelected] = useState<Record<string, boolean>>({})
    const [operatingHours, setOperatingHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({
        monday: { open: '', close: '', closed: false },
        tuesday: { open: '', close: '', closed: false },
        wednesday: { open: '', close: '', closed: false },
        thursday: { open: '', close: '', closed: false },
        friday: { open: '', close: '', closed: false },
        saturday: { open: '', close: '', closed: false },
        sunday: { open: '', close: '', closed: false }
    })

    // Basic information form state
    const [basicInfo, setBasicInfo] = useState({
        branchName: '',
        branchCode: '',
        description: '',
        established: '',
        capacity: '',
        address: '',
        email: '',
        phone: '',
        whatsapp: '',
        website: '',
        socialMedia: ''
    })

    const [additionalInfo, setAdditionalInfo] = useState({
        rules: '',
        policies: '',
        emergency: '',
        manager: '',
        certifications: '',
        nearby: '',
        specialFeatures: '',
        holidayHours: '',
        peakHours: ''
    })

    const router = useRouter()

    // Compress image to max 2MB
    const compressImage = (file: File, maxSizeMB: number = 2): Promise<string> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            const img = new Image()

            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                let { width, height } = img

                // If file size is already under 2MB, return as is
                if (file.size <= maxSizeMB * 1024 * 1024) {
                    resolve(URL.createObjectURL(file))
                    return
                }

                // Reduce quality and size for compression
                const maxDimension = 1920 // Max width/height
                if (width > height) {
                    if (width > maxDimension) {
                        height = (height * maxDimension) / width
                        width = maxDimension
                    }
                } else {
                    if (height > maxDimension) {
                        width = (width * maxDimension) / height
                        height = maxDimension
                    }
                }

                canvas.width = width
                canvas.height = height

                ctx.drawImage(img, 0, 0, width, height)

                // Try different quality levels until file size is under 2MB
                let quality = 0.9
                let compressedDataUrl = canvas.toDataURL('image/jpeg', quality)

                while (compressedDataUrl.length > maxSizeMB * 1024 * 1024 && quality > 0.1) {
                    quality -= 0.1
                    compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
                }

                resolve(compressedDataUrl)
            }

            img.src = URL.createObjectURL(file)
        })
    }

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files) return

        const maxImages = 10
        const maxSizeMB = 2
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

        // Check if adding these files would exceed the limit
        if (uploadedImages.length + files.length > maxImages) {
            setUploadError(`Cannot upload more than ${maxImages} images. You can upload ${maxImages - uploadedImages.length} more.`)
            return
        }

        setIsCompressing(true)
        setUploadError('')

        try {
            const supabase = createClient()
            const uploadedImageUrls: string[] = []

            for (const file of Array.from(files)) {
                // Validate file type
                if (!allowedTypes.includes(file.type)) {
                    setUploadError(`Invalid file type: ${file.name}. Only JPG, PNG, and WebP are allowed.`)
                    continue
                }

                try {
                    let fileToUpload = file

                    // Check original file size and compress if needed
                    if (file.size > maxSizeMB * 1024 * 1024) {
                        // Compress the image
                        const compressedDataUrl = await compressImage(file, maxSizeMB)

                        // Convert data URL back to File object
                        const response = await fetch(compressedDataUrl)
                        const compressedBlob = await response.blob()
                        fileToUpload = new File([compressedBlob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        })
                    }

                    // Generate unique filename
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

                    // For now, use placeholder branch ID. In real app, get from auth context
                    const branchId = 'placeholder-branch-id'
                    const filePath = `branches/${branchId}/${fileName}`

                    // Upload to Supabase Storage
                    const { error: uploadError } = await supabase.storage
                        .from('gym-images')
                        .upload(filePath, fileToUpload, {
                            cacheControl: '3600',
                            upsert: false
                        })

                    if (uploadError) {
                        console.error('Upload error:', uploadError)
                        setUploadError(`Failed to upload ${file.name}: ${uploadError.message}`)
                        continue
                    }

                    // Get public URL
                    const { data: urlData } = supabase.storage
                        .from('gym-images')
                        .getPublicUrl(filePath)

                    if (urlData?.publicUrl) {
                        uploadedImageUrls.push(urlData.publicUrl)
                    }
                } catch (fileError) {
                    console.error('Error processing file:', file.name, fileError)
                    setUploadError(`Error processing ${file.name}. Please try again.`)
                    continue
                }
            }

            if (uploadedImageUrls.length > 0) {
                setUploadedImages(prev => [...prev, ...uploadedImageUrls])
            }
        } catch (error) {
            setUploadError('Error uploading images. Please try again.')
            console.error('Image upload error:', error)
        } finally {
            setIsCompressing(false)
        }

        // Reset the input
        event.target.value = ''
    }

    const removeImage = async (index: number) => {
        const imageUrl = uploadedImages[index]

        // If it's a Supabase storage URL, try to delete from storage
        if (imageUrl && imageUrl.includes('supabase')) {
            try {
                const supabase = createClient()
                // Extract file path from URL
                const urlParts = imageUrl.split('/storage/v1/object/public/gym-images/')
                if (urlParts.length > 1) {
                    const filePath = urlParts[1]
                    await supabase.storage
                        .from('gym-images')
                        .remove([filePath])
                }
            } catch (error) {
                console.error('Error deleting image from storage:', error)
                // Continue with local removal even if storage deletion fails
            }
        }

        // Remove from local state
        const updatedImages = uploadedImages.filter((_, i) => i !== index)
        setUploadedImages(updatedImages)

        // Save the updated images array to database
        if (branchId) {
            try {
                const supabase = createClient()
                const { error } = await supabase
                    .from('branches')
                    .update({
                        images: updatedImages,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', branchId)

                if (error) {
                    console.error('Error saving updated images to database:', error)
                    // Show error to user
                    alert('Image removed from display but failed to save changes. Please refresh the page.')
                }
            } catch (error) {
                console.error('Error saving updated images to database:', error)
                alert('Image removed from display but failed to save changes. Please refresh the page.')
            }
        }
    }

    // Get branch ID from authenticated user
    useEffect(() => {
        const getBranchId = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    // First try to get branch_id from user metadata
                    if (user.user_metadata?.branch_id) {
                        setBranchId(user.user_metadata.branch_id)
                        return
                    }

                    // If not in metadata, try to get from profiles table
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('branch_id')
                        .eq('id', user.id)
                        .single()

                    if (profile?.branch_id) {
                        setBranchId(profile.branch_id)
                    } else {
                        alert('Branch access not found. Please contact your administrator.')
                        router.push('/auth/login')
                        return
                    }
                } else {
                    alert('Please log in to access branch settings.')
                    router.push('/auth/login')
                    return
                }
            } catch (error) {
                console.error('Error getting branch ID:', error)
                setIsLoading(false)
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

                if (data) {
                    // Load existing data into state
                    if (data.images) setUploadedImages(data.images)
                    if (data.facilities) setFacilities(data.facilities)
                    if (data.amenities && Array.isArray(data.amenities)) {
                        const map: Record<string, boolean> = {}
                        data.amenities.forEach((a: string) => {
                            const key = a.toLowerCase().replace(/\s+/g, '')
                            map[key] = true
                        })
                        setAmenitiesSelected(map)
                    }

                    // Load operating hours
                    if (data.operating_hours) {
                        // Merge database data with default structure to ensure all days exist
                        const mergedHours = {
                            monday: data.operating_hours.monday || { open: '', close: '', closed: false },
                            tuesday: data.operating_hours.tuesday || { open: '', close: '', closed: false },
                            wednesday: data.operating_hours.wednesday || { open: '', close: '', closed: false },
                            thursday: data.operating_hours.thursday || { open: '', close: '', closed: false },
                            friday: data.operating_hours.friday || { open: '', close: '', closed: false },
                            saturday: data.operating_hours.saturday || { open: '', close: '', closed: false },
                            sunday: data.operating_hours.sunday || { open: '', close: '', closed: false }
                        };
                        setOperatingHours(mergedHours)
                    } else {
                        // Reset to default empty state
                        setOperatingHours({
                            monday: { open: '', close: '', closed: false },
                            tuesday: { open: '', close: '', closed: false },
                            wednesday: { open: '', close: '', closed: false },
                            thursday: { open: '', close: '', closed: false },
                            friday: { open: '', close: '', closed: false },
                            saturday: { open: '', close: '', closed: false },
                            sunday: { open: '', close: '', closed: false }
                        })
                    }

                    // Load basic information
                    setBasicInfo({
                        branchName: data.name || '',
                        branchCode: data.branch_code || '',
                        description: data.description || '',
                        established: data.established_year?.toString() || '',
                        capacity: data.member_capacity?.toString() || '',
                        address: data.address || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        whatsapp: data.whatsapp || '',
                        website: data.website || '',
                        socialMedia: data.social_media || ''
                    })

                    // Load additional information
                    setAdditionalInfo({
                        rules: data.rules || '',
                        policies: data.policies || '',
                        emergency: data.emergency_contact || '',
                        manager: data.manager_name || '',
                        certifications: data.certifications || '',
                        nearby: data.nearby_landmarks || '',
                        specialFeatures: data.special_features || '',
                        holidayHours: data.holiday_hours || '',
                        peakHours: data.peak_hours || ''
                    })
                }
            } catch (error) {
                console.error('Error loading branch data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadBranchData()
    }, [branchId])

    const handleSaveImages = async () => {
        if (!branchId) {
            alert('Branch ID not found. Please refresh the page and try again.')
            return
        }

        setIsSaving(true)

        try {
            // Create a custom save function just for images or use the existing one
            const supabase = createClient()

            const { error } = await supabase
                .from('branches')
                .update({
                    images: uploadedImages,
                    updated_at: new Date().toISOString()
                })
                .eq('id', branchId)

            if (error) {
                throw new Error(error.message)
            }

            setSuccessModal({
                isOpen: true,
                title: 'Images Saved!',
                message: 'Your branch images have been saved successfully.'
            })
            router.refresh()
        } catch (error) {
            console.error('Error saving images:', error)
            alert('Error saving images: ' + (error as Error).message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        if (!branchId) {
            alert('Branch ID not found. Please refresh the page and try again.')
            return
        }

        event.preventDefault()
        setIsSaving(true)

        try {
            const formData = new FormData(event.currentTarget)


            const result = await saveBranchSettings(branchId, formData, uploadedImages)

            if (result.success) {
                setSuccessModal({
                    isOpen: true,
                    title: 'Branch Information Saved!',
                    message: 'Your branch information has been updated successfully.'
                })
            } else {
                alert('Error: ' + result.error)
            }
        } catch (error) {
            console.error('Error saving branch settings:', error)
            alert('An unexpected error occurred')
        } finally {
            setIsSaving(false)
        }
    }

    const addFacility = () => {
        if (newFacility.trim() && !facilities.includes(newFacility.trim())) {
            setFacilities(prev => [...prev, newFacility.trim()])
            setNewFacility('')
        }
    }

    const removeFacility = (facility: string) => {
        setFacilities(prev => prev.filter(f => f !== facility))
    }

    if (isLoading) {
    return (
        <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gradient-emerald">
                        Branch Information Management
                    </h1>
                    <p className="text-muted-foreground mt-2">Loading branch information...</p>
                </div>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
                </div>
            </div>
        )
    }

    return (
        <>
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gradient-emerald">
                    Branch Information Management
                </h1>
                <p className="text-muted-foreground mt-2">Complete information about your gym branch for landing page display</p>
            </div>

            <div className="space-y-8">
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-linear-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 shadow-sm">
                            <TabsTrigger
                                value="basic"
                                className="flex flex-col items-center gap-1 p-2 rounded-lg text-emerald-700 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 hover:bg-emerald-100 hover:scale-105"
                            >
                                <Building2 className="w-4 h-4" />
                                <span className="text-xs font-medium">Basic Info</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="hours"
                                className="flex flex-col items-center gap-1 p-2 rounded-lg text-emerald-700 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 hover:bg-emerald-100 hover:scale-105"
                            >
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium">Operating Hours</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="facilities"
                                className="flex flex-col items-center gap-1 p-2 rounded-lg text-emerald-700 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 hover:bg-emerald-100 hover:scale-105"
                            >
                                <Dumbbell className="w-4 h-4" />
                                <span className="text-xs font-medium">Facilities</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="gallery"
                                className="flex flex-col items-center gap-1 p-2 rounded-lg text-emerald-700 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 hover:bg-emerald-100 hover:scale-105"
                            >
                                <ImageIcon className="w-4 h-4" />
                                <span className="text-xs font-medium">Gallery</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="additional"
                                className="flex flex-col items-center gap-1 p-2 rounded-lg text-emerald-700 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 hover:bg-emerald-100 hover:scale-105"
                            >
                                <Info className="w-4 h-4" />
                                <span className="text-xs font-medium">Additional</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Basic Information Tab */}
                        <TabsContent value="basic" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="branchName">Branch Name *</Label>
                                    <Input
                                        id="branchName"
                                        name="branchName"
                                        value={basicInfo.branchName}
                                        onChange={(e) => setBasicInfo(prev => ({ ...prev, branchName: e.target.value }))}
                                        placeholder="Main Branch"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="branchCode">Branch Code</Label>
                                    <Input
                                        id="branchCode"
                                        name="branchCode"
                                        value={basicInfo.branchCode}
                                        onChange={(e) => setBasicInfo(prev => ({ ...prev, branchCode: e.target.value }))}
                                        placeholder="BRN001"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Gym Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={basicInfo.description}
                                    onChange={(e) => setBasicInfo(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe your gym, its mission, and what makes it special..."
                                    className="border-green-200 focus:border-emerald-500"
                                    rows={4}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="established">Established Year</Label>
                                    <Input
                                        id="established"
                                        name="established"
                                        value={basicInfo.established}
                                        onChange={(e) => setBasicInfo(prev => ({ ...prev, established: e.target.value }))}
                                        placeholder="2020"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Member Capacity</Label>
                                    <Input
                                        id="capacity"
                                        name="capacity"
                                        value={basicInfo.capacity}
                                        onChange={(e) => setBasicInfo(prev => ({ ...prev, capacity: e.target.value }))}
                                        placeholder="500"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address" className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Full Address *
                                </Label>
                                <Textarea
                                    id="address"
                                    name="address"
                                    value={basicInfo.address}
                                    onChange={(e) => setBasicInfo(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Street address, City, State, PIN Code"
                                    className="border-green-200 focus:border-emerald-500"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Email *
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={basicInfo.email}
                                        onChange={(e) => setBasicInfo(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="branch@example.com"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        Phone *
                                    </Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={basicInfo.phone}
                                        onChange={(e) => setBasicInfo(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="+91 98765 43210"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp">WhatsApp</Label>
                                    <Input
                                        id="whatsapp"
                                        name="whatsapp"
                                        value={basicInfo.whatsapp}
                                        onChange={(e) => setBasicInfo(prev => ({ ...prev, whatsapp: e.target.value }))}
                                        placeholder="+91 98765 43210"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        name="website"
                                        value={basicInfo.website}
                                        onChange={(e) => setBasicInfo(prev => ({ ...prev, website: e.target.value }))}
                                        placeholder="https://yourgym.com"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="socialMedia">Social Media Links</Label>
                                    <Input
                                        id="socialMedia"
                                        name="socialMedia"
                                        value={basicInfo.socialMedia}
                                        onChange={(e) => setBasicInfo(prev => ({ ...prev, socialMedia: e.target.value }))}
                                        placeholder="Facebook, Instagram, Twitter URLs"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Operating Hours Tab */}
                        <TabsContent value="hours" className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Weekly Schedule
                                </h3>

                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                    <div key={day} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                        <Label className="font-medium">{day}</Label>
                                        <div className="space-y-1">
                                            <Label htmlFor={`${day.toLowerCase()}Open`} className="text-sm">Opening</Label>
                                    <Input
                                                id={`${day.toLowerCase()}Open`}
                                                name={`${day.toLowerCase()}Open`}
                                        type="time"
                                        value={operatingHours[day.toLowerCase()]?.open || ''}
                                        onChange={(e) => setOperatingHours(prev => ({
                                            ...prev,
                                            [day.toLowerCase()]: {
                                                ...prev[day.toLowerCase()],
                                                open: e.target.value
                                            }
                                        }))}
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`${day.toLowerCase()}Close`} className="text-sm">Closing</Label>
                                    <Input
                                                id={`${day.toLowerCase()}Close`}
                                                name={`${day.toLowerCase()}Close`}
                                        type="time"
                                        value={operatingHours[day.toLowerCase()]?.close || ''}
                                        onChange={(e) => setOperatingHours(prev => ({
                                            ...prev,
                                            [day.toLowerCase()]: {
                                                ...prev[day.toLowerCase()],
                                                close: e.target.value
                                            }
                                        }))}
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`${day.toLowerCase()}Closed`}
                                                name={`${day.toLowerCase()}Closed`}
                                                value="true"
                                                checked={operatingHours[day.toLowerCase()]?.closed || false}
                                                onChange={(e) => setOperatingHours(prev => ({
                                                    ...prev,
                                                    [day.toLowerCase()]: {
                                                        ...prev[day.toLowerCase()],
                                                        closed: e.target.checked
                                                    }
                                                }))}
                                                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                                            />
                                            <Label htmlFor={`${day.toLowerCase()}Closed`} className="text-sm">Closed</Label>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Special Hours</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="holidayHours">Holiday Hours</Label>
                                        <Textarea
                                            id="holidayHours"
                                            name="holidayHours"
                                            value={additionalInfo.holidayHours}
                                            onChange={(e) => setAdditionalInfo(prev => ({ ...prev, holidayHours: e.target.value }))}
                                            placeholder="Special hours during holidays..."
                                            className="border-green-200 focus:border-emerald-500"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="peakHours">Peak Hours</Label>
                                        <Textarea
                                            id="peakHours"
                                            name="peakHours"
                                            value={additionalInfo.peakHours}
                                            onChange={(e) => setAdditionalInfo(prev => ({ ...prev, peakHours: e.target.value }))}
                                            placeholder="Busiest times of the day..."
                                            className="border-green-200 focus:border-emerald-500"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Facilities & Amenities Tab */}
                        <TabsContent value="facilities" className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Dumbbell className="w-5 h-5" />
                                    Facilities & Equipment
                                </h3>

                                <div className="flex gap-2">
                                    <Input
                                        value={newFacility}
                                        onChange={(e) => setNewFacility(e.target.value)}
                                        placeholder="Add facility (e.g., Cardio Zone, Free Weights)"
                                        className="border-green-200 focus:border-emerald-500"
                                        onKeyPress={(e) => e.key === 'Enter' && addFacility()}
                                    />
                                    <Button onClick={addFacility} className="bg-emerald-700 hover:bg-emerald-800">
                                        <Plus className="w-4 h-4" />
                            </Button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {facilities.map((facility, index) => (
                                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                            {facility}
                                            <X
                                                className="w-3 h-3 cursor-pointer hover:text-red-500"
                                                onClick={() => removeFacility(facility)}
                                            />
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Amenities</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                        'Locker Room', 'Shower Facilities', 'Parking', 'WiFi',
                                        'Personal Training', 'Group Classes', 'Nutrition Counseling',
                                        'Sauna', 'Swimming Pool', 'Cafeteria', 'Child Care', 'Massage'
                                    ].map((amenity) => {
                                        const key = amenity.toLowerCase().replace(/\s+/g, '')
                                        return (
                                            <div key={amenity} className="flex items-center space-x-2">
                                                <Switch
                                                    id={key}
                                                    checked={!!amenitiesSelected[key]}
                                                    onCheckedChange={(val) =>
                                                        setAmenitiesSelected(prev => ({ ...prev, [key]: val }))
                                                    }
                                                />
                                                <Label htmlFor={key}>{amenity}</Label>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="specialFeatures">Special Features</Label>
                                <Textarea
                                    id="specialFeatures"
                                    name="specialFeatures"
                                    value={additionalInfo.specialFeatures}
                                    onChange={(e) => setAdditionalInfo(prev => ({ ...prev, specialFeatures: e.target.value }))}
                                    placeholder="Any unique features or equipment..."
                                    className="border-green-200 focus:border-emerald-500"
                                    rows={3}
                                />
                            </div>
                        </TabsContent>

                        {/* Gallery & Images Tab */}
                        <TabsContent value="gallery" className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5" />
                                    Gym Gallery
                                </h3>

                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-emerald-800">Upload Guidelines</p>
                                            <p className="text-xs text-emerald-600">
                                                Maximum 10 images • Max 2MB per image • PNG, JPG, JPEG supported
                                    </p>
                                </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-emerald-800">
                                                {uploadedImages.length}/10 images
                                            </p>
                                            <div className="w-20 bg-emerald-200 rounded-full h-2 mt-1">
                                                <div
                                                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${(uploadedImages.length / 10) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {uploadError && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                        <p className="text-red-800 text-sm">{uploadError}</p>
                                    </div>
                                )}

                                {isCompressing && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-center">
                                        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                                        <p className="text-blue-800 text-sm">Compressing images...</p>
                            </div>
                                )}

                                {uploadedImages.length < 10 && !isCompressing && (
                                    <div
                                        className="border-2 border-dashed border-green-200 rounded-lg p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all duration-200"
                                        onClick={() => document.getElementById('imageUpload')?.click()}
                                    >
                                        <Upload className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                        <div>
                                            <span className="text-lg font-medium text-green-700">Click to upload images</span>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                PNG, JPG, JPEG up to 2MB each ({10 - uploadedImages.length} remaining)
                                    </p>
                                </div>
                                        <Input
                                            id="imageUpload"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={uploadedImages.length >= 10}
                                />
                            </div>
                                )}

                                {uploadedImages.length >= 10 && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                                        <p className="text-amber-800 font-medium">Maximum 10 images reached</p>
                                        <p className="text-sm text-amber-600">Remove some images to upload more</p>
                                </div>
                                )}

                                {uploadedImages.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-medium text-gray-700">Uploaded Images ({uploadedImages.length}/10)</h4>
                                            <Button
                                                type="button"
                                                onClick={handleSaveImages}
                                                disabled={isSaving || !branchId}
                                                className="bg-green-600 hover:bg-green-700 text-white text-sm"
                                                size="sm"
                                            >
                                                <Save className="w-4 h-4 mr-1" />
                                                Save Images
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {uploadedImages.map((image, index) => (
                                                <div key={index} className="relative group">
                                                    <div
                                                        className="w-full h-24 bg-cover bg-center rounded-lg border"
                                                        style={{ backgroundImage: `url(${image})` }}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => removeImage(index)}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                </div>
                        </TabsContent>

                        {/* Additional Information Tab */}
                        <TabsContent value="additional" className="space-y-6">

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Info className="w-5 h-5" />
                                    Additional Information
                                </h3>

                            <div className="space-y-2">
                                    <Label htmlFor="rules">Gym Rules & Regulations</Label>
                                    <Textarea
                                        id="rules"
                                        name="rules"
                                        value={additionalInfo.rules}
                                        onChange={(e) => setAdditionalInfo(prev => ({ ...prev, rules: e.target.value }))}
                                        placeholder="Dress code, equipment usage rules, etc."
                                        className="border-green-200 focus:border-emerald-500"
                                        rows={4}
                                    />
                            </div>

                            <div className="space-y-2">
                                    <Label htmlFor="policies">Membership Policies</Label>
                                    <Textarea
                                        id="policies"
                                        name="policies"
                                        value={additionalInfo.policies}
                                        onChange={(e) => setAdditionalInfo(prev => ({ ...prev, policies: e.target.value }))}
                                        placeholder="Cancellation policy, refund policy, etc."
                                        className="border-green-200 focus:border-emerald-500"
                                        rows={4}
                                    />
                            </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                        <Label htmlFor="emergency">Emergency Contact</Label>
                                    <Input
                                            id="emergency"
                                            name="emergency"
                                            value={additionalInfo.emergency}
                                            onChange={(e) => setAdditionalInfo(prev => ({ ...prev, emergency: e.target.value }))}
                                            placeholder="Emergency phone number"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                        <Label htmlFor="manager">Branch Manager</Label>
                                    <Input
                                            id="manager"
                                            name="manager"
                                            value={additionalInfo.manager}
                                            onChange={(e) => setAdditionalInfo(prev => ({ ...prev, manager: e.target.value }))}
                                            placeholder="Manager's name"
                                        className="border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                                <div className="space-y-2">
                                    <Label htmlFor="certifications">Certifications & Awards</Label>
                                    <Textarea
                                        id="certifications"
                                        name="certifications"
                                        value={additionalInfo.certifications}
                                        onChange={(e) => setAdditionalInfo(prev => ({ ...prev, certifications: e.target.value }))}
                                        placeholder="ISO certifications, awards, recognitions..."
                                        className="border-green-200 focus:border-emerald-500"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nearby">Nearby Landmarks</Label>
                                    <Textarea
                                        id="nearby"
                                        name="nearby"
                                        value={additionalInfo.nearby}
                                        onChange={(e) => setAdditionalInfo(prev => ({ ...prev, nearby: e.target.value }))}
                                        placeholder="Metro station, bus stop, mall, etc."
                                        className="border-green-200 focus:border-emerald-500"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Hidden inputs for ALL form data - moved outside tabs to ensure they're always included regardless of active tab */}
                    <input type="hidden" name="facilities" value={JSON.stringify(facilities)} />
                    <input
                        type="hidden"
                        name="amenities"
                                value={JSON.stringify([
                                    'Locker Room', 'Shower Facilities', 'Parking', 'WiFi',
                                    'Personal Training', 'Group Classes', 'Nutrition Counseling',
                                    'Sauna', 'Swimming Pool', 'Cafeteria', 'Child Care', 'Massage'
                                ].filter(a => {
                                    const key = a.toLowerCase().replace(/\s+/g, '');
                                    return amenitiesSelected[key] === true;
                                }))}
                    />

                    {/* Hidden inputs for basic information fields */}
                    <input type="hidden" name="branchName" value={basicInfo.branchName} />
                    <input type="hidden" name="branchCode" value={basicInfo.branchCode} />
                    <input type="hidden" name="description" value={basicInfo.description} />
                    <input type="hidden" name="established" value={basicInfo.established} />
                    <input type="hidden" name="capacity" value={basicInfo.capacity} />
                    <input type="hidden" name="address" value={basicInfo.address} />
                    <input type="hidden" name="email" value={basicInfo.email} />
                    <input type="hidden" name="phone" value={basicInfo.phone} />
                    <input type="hidden" name="whatsapp" value={basicInfo.whatsapp} />
                    <input type="hidden" name="website" value={basicInfo.website} />
                    <input type="hidden" name="socialMedia" value={basicInfo.socialMedia} />

                    {/* Hidden inputs for additional information fields */}
                    <input type="hidden" name="rules" value={additionalInfo.rules} />
                    <input type="hidden" name="policies" value={additionalInfo.policies} />
                    <input type="hidden" name="emergency" value={additionalInfo.emergency} />
                    <input type="hidden" name="manager" value={additionalInfo.manager} />
                    <input type="hidden" name="certifications" value={additionalInfo.certifications} />
                    <input type="hidden" name="nearby" value={additionalInfo.nearby} />
                    <input type="hidden" name="specialFeatures" value={additionalInfo.specialFeatures} />
                    <input type="hidden" name="holidayHours" value={additionalInfo.holidayHours} />
                    <input type="hidden" name="peakHours" value={additionalInfo.peakHours} />

                    {/* Hidden inputs for operating hours */}
                    <input type="hidden" name="mondayOpen" value={operatingHours.monday?.open || ''} />
                    <input type="hidden" name="mondayClose" value={operatingHours.monday?.close || ''} />
                    <input type="hidden" name="mondayClosed" value={operatingHours.monday?.closed ? 'true' : 'false'} />
                    <input type="hidden" name="tuesdayOpen" value={operatingHours.tuesday?.open || ''} />
                    <input type="hidden" name="tuesdayClose" value={operatingHours.tuesday?.close || ''} />
                    <input type="hidden" name="tuesdayClosed" value={operatingHours.tuesday?.closed ? 'true' : 'false'} />
                    <input type="hidden" name="wednesdayOpen" value={operatingHours.wednesday?.open || ''} />
                    <input type="hidden" name="wednesdayClose" value={operatingHours.wednesday?.close || ''} />
                    <input type="hidden" name="wednesdayClosed" value={operatingHours.wednesday?.closed ? 'true' : 'false'} />
                    <input type="hidden" name="thursdayOpen" value={operatingHours.thursday?.open || ''} />
                    <input type="hidden" name="thursdayClose" value={operatingHours.thursday?.close || ''} />
                    <input type="hidden" name="thursdayClosed" value={operatingHours.thursday?.closed ? 'true' : 'false'} />
                    <input type="hidden" name="fridayOpen" value={operatingHours.friday?.open || ''} />
                    <input type="hidden" name="fridayClose" value={operatingHours.friday?.close || ''} />
                    <input type="hidden" name="fridayClosed" value={operatingHours.friday?.closed ? 'true' : 'false'} />
                    <input type="hidden" name="saturdayOpen" value={operatingHours.saturday?.open || ''} />
                    <input type="hidden" name="saturdayClose" value={operatingHours.saturday?.close || ''} />
                    <input type="hidden" name="saturdayClosed" value={operatingHours.saturday?.closed ? 'true' : 'false'} />
                    <input type="hidden" name="sundayOpen" value={operatingHours.sunday?.open || ''} />
                    <input type="hidden" name="sundayClose" value={operatingHours.sunday?.close || ''} />
                    <input type="hidden" name="sundayClosed" value={operatingHours.sunday?.closed ? 'true' : 'false'} />

                    <div className="flex gap-4 mt-8 p-6 bg-linear-to-r from-gray-50 to-emerald-50 rounded-lg border border-emerald-100">
                        <Button
                            type="submit"
                            disabled={isSaving || !branchId}
                            className="bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save All Information'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 shadow-md hover:shadow-lg transition-all duration-200"
                            onClick={() => router.push('/branch/viewalldetail')}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            View All Details
                        </Button>
            </div>
        </div>
        </form>

        <SuccessModal
            isOpen={successModal.isOpen}
            onClose={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
            title={successModal.title}
            message={successModal.message}
        />
        </>
    )
}
