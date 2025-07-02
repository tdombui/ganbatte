import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        
        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get the customer's default address
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('default_address')
            .eq('id', user.id)
            .single()

        if (customerError) {
            console.error('Error fetching customer default address:', customerError)
            return NextResponse.json({ error: 'Failed to fetch customer data' }, { status: 500 })
        }

        return NextResponse.json({ 
            default_address: customer?.default_address || null 
        })

    } catch (error) {
        console.error('Error in getCustomerDefaultAddress:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 