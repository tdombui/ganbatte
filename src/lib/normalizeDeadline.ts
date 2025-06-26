import { parseDate } from 'chrono-node'

export function normalizeDeadline(raw: string): {
    iso: string | undefined
    display: string | undefined
} {
    if (!raw || raw.trim().length === 0) {
        return { iso: undefined, display: undefined }
    }

    // Clean up unnecessary leading words
    const cleaned = raw
        .toLowerCase()
        .replace(/^(by|at|on)\s+/, '')
        .trim()

    const parsedDate = parseDate(cleaned, new Date(), { forwardDate: true })

    if (!parsedDate) {
        return { iso: undefined, display: undefined }
    }

    // Format in a user-friendly way
    const display = parsedDate.toLocaleString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short',
    })

    return {
        iso: parsedDate.toISOString(),
        display,
    }
}
