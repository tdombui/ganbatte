// lib/formatDeadline.ts
import { format, parseISO, isValid } from 'date-fns'

export function formatDeadline(isoDate: string): string {
    if (!isoDate) return 'Not specified'
    try {
        const date = parseISO(isoDate)
        if (!isValid(date)) {
            return isoDate; // Return original if not a valid date
        }
        // Format: by Friday, Jun 27, 10:00 AM PDT
        return `by ${format(date, "EEEE, MMM d, h:mm a zzz")}`
    } catch (error) {
        console.error("Error formatting date:", error)
        return isoDate // return original string if formatting fails
    }
}
