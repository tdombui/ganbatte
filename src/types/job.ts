export interface JobLeg {
    part: string;
    pickup: string
    dropoff: string
    pickup_validated?: boolean
    dropoff_validated?: boolean
    pickup_lat: number | null
    pickup_lng: number | null
    dropoff_lat: number | null
    dropoff_lng: number | null
}

export interface DraftJob {
    sessionId: string
    parts: string[]
    deadline: string | null | undefined
    deadlineDisplay: string | null | undefined
    legs: JobLeg[]
    status: 'in_progress' | 'ready_to_submit'
}

export interface ParsedJob {
    id: string;
    parts: string[]
    pickup: string
    dropoff: string
    deadline?: string
    deadlineDisplay?: string
    status?: string
    photo_urls?: string[]
    payment_status?: string
    payment_amount?: number
    stripe_payment_intent_id?: string
    stripe_payment_link_id?: string
    paid_at?: string
}