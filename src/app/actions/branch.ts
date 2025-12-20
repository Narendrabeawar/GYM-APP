'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type ActionState = {
    message?: string
    error?: string
    success?: boolean
}

export async function createBranch(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const email = formData.get('email') as string
    const branchName = formData.get('branchName') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const gymId = formData.get('gymId') as string
    
    // Manager name only - email and phone will be branch's
    const managerName = formData.get('managerName') as string

    if (!email || !branchName || !phone || !gymId || !managerName) {
        return { error: 'All fields including Manager Name are required' }
    }

    const supabase = createAdminClient()

    try {
        // 1. Create the Branch record with manager name
        const { data: branch, error: branchError } = await supabase
            .from('branches')
            .insert({
                name: branchName,
                email: email,
                phone: phone,
                address: address,
                gym_id: gymId,
                manager_name: managerName,
                status: 'active'
            })
            .select()
            .single()

        if (branchError) {
            console.error('Error creating branch:', branchError)
            return { error: 'Failed to create branch record: ' + branchError.message }
        }

        // Fetch Gym Name to include in metadata
        const { data: gym } = await supabase.from('gyms').select('name').eq('id', gymId).single()
        const gymName = gym?.name || 'My Gym'

        // 2. Create the Branch Manager User in Auth using branch email
        const { data: authData, error: userError } = await supabase.auth.admin.createUser({
            email: email, // Using branch email for manager login
            password: 'gymbranch123',
            email_confirm: true,
            user_metadata: {
                role: 'branch_admin',
                full_name: managerName,
                gym_id: gymId,
                branch_id: branch.id,
                branch_name: branchName,
                gym_name: gymName,
                force_password_change: true
            }
        })

        if (userError) {
            // Rollback: delete the branch if user creation fails
            await supabase.from('branches').delete().eq('id', branch.id)
            console.error('Error creating branch manager user:', userError)
            return { error: userError.message }
        }

        // 3. Create/Update Profile entry for the manager
        if (authData?.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    email: email, // Branch email
                    full_name: managerName,
                    phone: phone, // Branch phone
                    role: 'branch_admin',
                    gym_id: gymId,
                    branch_id: branch.id,
                    updated_at: new Date().toISOString()
                })

            if (profileError) {
                console.error('Error creating manager profile:', profileError)
                // Continue anyway - profile might be created by trigger
            }
        }

        revalidatePath('/gym/listed-branches')
        return {
            success: true,
            message: `Branch "${branchName}" created successfully with manager "${managerName}". Login: ${email}, Password: "gymbranch123"`
        }
    } catch (err) {
        console.error('Unexpected error:', err)
        return { error: 'Something went wrong' }
    }
}

export async function deleteBranch(branchId: string): Promise<ActionState> {
    if (!branchId) return { error: 'Branch ID is required' }

    const supabase = createAdminClient()

    try {
        // 1. Get all profiles associated with this branch to delete their auth accounts
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('branch_id', branchId)

        if (profileError) {
            console.error('Error fetching branch profiles:', profileError)
            return { error: 'Failed to fetch branch staff details' }
        }

        // 2. Delete each auth user
        if (profiles && profiles.length > 0) {
            for (const profile of profiles) {
                await supabase.auth.admin.deleteUser(profile.id)
            }
        }

        // 3. Delete the branch record (this will automatically clean up remaining profile entries via trigger/cascade if set)
        const { error: branchError } = await supabase
            .from('branches')
            .delete()
            .eq('id', branchId)

        if (branchError) {
            console.error('Error deleting branch record:', branchError)
            return { error: branchError.message }
        }

        revalidatePath('/gym/listed-branches')
        return { success: true, message: 'Branch and all associated staff deleted successfully' }
    } catch (err) {
        console.error('Unexpected error during branch deletion:', err)
        return { error: 'Failed to delete branch' }
    }
}

export type BranchSettings = {
    // Basic Information
    branchName: string
    branchCode: string
    description: string
    established_year: string
    member_capacity: string
    address: string
    email: string
    phone: string
    whatsapp: string
    website: string
    social_media: string

    // Operating Hours
    operating_hours: Record<string, { open: string; close: string; closed: boolean }>

    // Facilities & Amenities
    facilities: string[]
    amenities: string[]
    special_features: string

    // Gallery (handled separately for file uploads)
    // images: string[]

    // Additional Information
    rules: string
    policies: string
    emergency_contact: string
    manager_name: string
    certifications: string
    nearby_landmarks: string
}

export async function saveBranchSettings(branchId: string, formData: FormData, uploadedImages: string[] = []): Promise<ActionState> {
    if (!branchId) return { error: 'Branch ID is required' }

    const supabase = createAdminClient()

    try {
        const getString = (key: string, def = '') => {
            const v = formData.get(key)
            return v === null ? def : String(v)
        }
        const getBool = (key: string) => {
            const v = formData.get(key)
            return v === 'on' || v === 'true'
        }
        const parseJSON = (key: string) => {
            const v = formData.get(key)
            if (!v) return []
            try {
                return JSON.parse(String(v))
            } catch {
                return []
            }
        }

        const branchData: Partial<BranchSettings> = {
            // Basic Information
            branchName: getString('branchName'),
            branchCode: getString('branchCode'),
            description: getString('description'),
            established_year: getString('established'),
            member_capacity: getString('capacity'),
            address: getString('address'),
            email: getString('email'),
            phone: getString('phone'),
            whatsapp: getString('whatsapp'),
            website: getString('website'),
            social_media: getString('socialMedia'),

            // Operating Hours - build JSON object from form data
            operating_hours: (() => {
                const mondayOpen = getString('mondayOpen');
                const mondayClose = getString('mondayClose');

                const hours = {
                monday: {
                    open: getString('mondayOpen'),
                    close: getString('mondayClose'),
                    closed: getBool('mondayClosed')
                },
                tuesday: {
                    open: getString('tuesdayOpen'),
                    close: getString('tuesdayClose'),
                    closed: getBool('tuesdayClosed')
                },
                wednesday: {
                    open: getString('wednesdayOpen'),
                    close: getString('wednesdayClose'),
                    closed: getBool('wednesdayClosed')
                },
                thursday: {
                    open: getString('thursdayOpen'),
                    close: getString('thursdayClose'),
                    closed: getBool('thursdayClosed')
                },
                friday: {
                    open: getString('fridayOpen'),
                    close: getString('fridayClose'),
                    closed: getBool('fridayClosed')
                },
                saturday: {
                    open: getString('saturdayOpen'),
                    close: getString('saturdayClose'),
                    closed: getBool('saturdayClosed')
                },
                sunday: {
                    open: getString('sundayOpen'),
                    close: getString('sundayClose'),
                    closed: getBool('sundayClosed')
                }
            };
            return hours;
            })(),

            // Facilities & Amenities
            facilities: parseJSON('facilities'),
            amenities: parseJSON('amenities'),

            // Additional Information
            rules: getString('rules'),
            policies: getString('policies'),
            emergency_contact: getString('emergency'),
            manager_name: getString('manager'),
            certifications: getString('certifications'),
            nearby_landmarks: getString('nearby'),
        }

        // Handle special fields that need processing
        const holidayHours = formData.get('holidayHours') as string
        const peakHours = formData.get('peakHours') as string
        const specialFeatures = formData.get('specialFeatures') as string

        // Build payload for update
        const updatePayload: Record<string, unknown> = {
            name: branchData.branchName,
            branch_code: branchData.branchCode,
            description: branchData.description,
            established_year: branchData.established_year ? parseInt(branchData.established_year) : null,
            member_capacity: branchData.member_capacity ? parseInt(branchData.member_capacity) : null,
            address: branchData.address,
            phone: branchData.phone,
            email: branchData.email,
            website: branchData.website,
            social_media: branchData.social_media,
            whatsapp: branchData.whatsapp,
            operating_hours: branchData.operating_hours,
            holiday_hours: holidayHours,
            peak_hours: peakHours,
            facilities: branchData.facilities,
            amenities: branchData.amenities,
            special_features: specialFeatures,
            images: uploadedImages,
            rules: branchData.rules,
            policies: branchData.policies,
            emergency_contact: branchData.emergency_contact,
            manager_name: branchData.manager_name,
            certifications: branchData.certifications,
            nearby_landmarks: branchData.nearby_landmarks,
            updated_at: new Date().toISOString()
        }

        // Try to update; if the database schema is missing columns we will remove them and retry.
        const maxRetries = 5
        let attempt = 0
        let lastError: unknown = null

        while (attempt < maxRetries) {
            const { error } = await supabase
                .from('branches')
                .update(updatePayload)
                .eq('id', branchId)

            if (!error) {
                lastError = null
                break
            }

            lastError = error

            // Detect missing column name from common Postgres / Supabase messages
            const msg = String(error.message || '')
            const singleQuoteMatch = msg.match(/Could not find the '([^']+)' column/i)
            const doubleQuoteMatch = msg.match(/column \"([^\"]+)\" does not exist/i)
            const missingCol = singleQuoteMatch ? singleQuoteMatch[1] : doubleQuoteMatch ? doubleQuoteMatch[1] : null

            if (missingCol && Object.prototype.hasOwnProperty.call(updatePayload, missingCol)) {
                // Remove the problematic column and retry
                delete updatePayload[missingCol]
                attempt++
                continue
            }

            // If we couldn't parse a missing column or payload doesn't contain it, stop retrying
            break
        }

        if (lastError) {
            console.error('Error updating branch settings after retries:', lastError)
            const lastErrorMessage =
                lastError && typeof lastError === 'object' && 'message' in lastError
                    ? String((lastError as { message?: unknown }).message)
                    : String(lastError)
            return { error: 'Failed to save branch settings: ' + lastErrorMessage }
        }

        revalidatePath('/branch/settings')
        return { success: true, message: 'Branch information saved successfully' }
    } catch (err) {
        console.error('Unexpected error saving branch settings:', err)
        return { error: 'Something went wrong while saving' }
    }
}

export async function getBranchSettings(branchId: string) {
    if (!branchId) return null

    const supabase = createAdminClient()

    try {
        const { data: branch, error } = await supabase
            .from('branches')
            .select('*')
            .eq('id', branchId)
            .single()

        if (error) {
            console.error('Error fetching branch settings:', error)
            return null
        }

        return branch
    } catch (err) {
        console.error('Unexpected error fetching branch settings:', err)
        return null
    }
}