export async function validateAddress(address: string): Promise<{ valid: boolean, resolvedAddress?: string }> {
    const isVague = !address ||
        address.trim().length < 8 ||
        /\b(my shop|my place|home|garage|work|spot|the shop|my guy|pickup|dropoff|business|store|VF)\b/i.test(address) ||
        /^[^0-9]*$/.test(address) || // no street number
        /^[a-zA-Z\s]+,\s*[a-zA-Z\s]+$/.test(address)

    if (isVague) return { valid: false }

    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`)
    const data = await res.json()

    if (data.status === 'OK' && data.results.length > 0) {
        const resolvedAddress = data.results[0].formatted_address
        return { valid: true, resolvedAddress }
    } else {
        return { valid: false }
    }
}
