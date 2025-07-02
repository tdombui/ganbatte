export async function validateAddress(address: string): Promise<{ valid: boolean, resolvedAddress?: string }> {
    // Check if address is coordinates (decimal degrees format: lat, lng)
    const decimalCoordinatePattern = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/
    if (decimalCoordinatePattern.test(address.trim())) {
        console.log('✅ Address validation passed - decimal coordinates detected:', address)
        return { valid: true, resolvedAddress: address.trim() }
    }

    // Check if address is coordinates (DMS format: degrees°minutes'seconds"N/S longitude°minutes'seconds"E/W)
    const dmsCoordinatePattern = /^(\d+)°(\d+)'(\d+\.?\d*)"([NS])\s+(\d+)°(\d+)'(\d+\.?\d*)"([EW])$/i
    const dmsMatch = address.trim().match(dmsCoordinatePattern)
    if (dmsMatch) {
        console.log('✅ Address validation passed - DMS coordinates detected:', address)
        return { valid: true, resolvedAddress: address.trim() }
    }

    // Check if address is too vague
    const isVague = !address ||
        address.trim().length < 5 || // Reduced from 8 to 5
        /\b(my shop|my place|home|garage|work|spot|the shop|my guy|pickup|dropoff|business|store|VF)\b/i.test(address) ||
        /^[^0-9]*$/.test(address) || // no street number
        /^[a-zA-Z\s]+,\s*[a-zA-Z\s]+$/.test(address) // Just city, state format

    if (isVague) {
        console.log('❌ Address validation failed - too vague:', address)
        return { valid: false }
    }

    // California center coordinates for biasing
    const californiaCenter = '36.7783,-119.4179'
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&location=${californiaCenter}&key=${process.env.GOOGLE_MAPS_API_KEY}`)
    const data = await res.json()

    console.log('🔍 Geocoding result for:', address, 'Status:', data.status, 'Results:', data.results?.length || 0)

    if (data.status === 'OK' && data.results.length > 0) {
        const resolvedAddress = data.results[0].formatted_address
        console.log('✅ Address validated:', address, '→', resolvedAddress)
        return { valid: true, resolvedAddress }
    } else {
        console.log('❌ Geocoding failed for:', address, 'Status:', data.status, 'Error:', data.error_message || 'No results')
        return { valid: false }
    }
}
