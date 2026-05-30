import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const syncWithLaravel = async (supabaseToken, payload) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseToken}`,
            },
            body: JSON.stringify(payload),
        })
        if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            return { error: data.error || `Server error (${res.status})` }
        }
        return res.json()
    } catch {
        return { error: 'Cannot reach server. Check your connection.' }
    }
}

export const checkEmail = async (email) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/check-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        })
        if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            return { error: data.error || `Server error (${res.status})` }
        }
        return res.json()
    } catch {
        return { error: 'Cannot reach server. Check your connection.' }
    }
}

export const checkIfProfileExists = async (token) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/check-profile`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        })
        if (!res.ok) return { hasProfile: false }
        const data = await res.json()
        return { hasProfile: data.has_profile ?? false }
    } catch {
        return { hasProfile: false }
    }
}