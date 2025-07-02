// Business configuration
export const HQ_ADDRESS = '1305 S Marine St, Santa Ana, CA 92704'
export const HQ_COORDINATES = { lat: 33.6846, lng: -117.8265 } // Approximate coordinates for Santa Ana

// Pricing configuration
export const PRICING = {
    baseRate: 30,
    perMile: 1.25,
    partRate: 5,
    advanceBookingDiscount: 0.25, // 25% discount for 24+ hour advance bookings
    advanceBookingHours: 24
}

// Business hours and other settings can be added here
export const BUSINESS_HOURS = {
    start: '8:00 AM',
    end: '6:00 PM',
    timezone: 'America/Los_Angeles'
} 