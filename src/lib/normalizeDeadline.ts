import { parseDate } from 'chrono-node'

export function normalizeDeadline(raw: string): {
    iso: string | undefined
    display: string | undefined
} {
    if (!raw || raw.trim().length === 0) {
        return { iso: undefined, display: undefined }
    }

    console.log('🔍 normalizeDeadline input:', raw)

    // Clean up unnecessary leading words
    const cleaned = raw
        .toLowerCase()
        .replace(/^(by|at|on)\s+/, '')
        .trim()

    console.log('🔍 cleaned input:', cleaned)
    console.log('🔍 includes "next":', cleaned.includes('next'))

    // Handle "next" day references more explicitly
    const processedInput = cleaned
    if (cleaned.includes('next ')) {
        try {
            console.log('🔍 Processing "next" pattern:', cleaned)
            // Replace "next" with a more explicit reference
            const dayMatch = cleaned.match(/next\s+(\w+)/)
            console.log('🔍 Day match:', dayMatch)
            if (dayMatch) {
                const dayName = dayMatch[1]
                console.log('🔍 Day name:', dayName)
                const currentDate = new Date()
                console.log('🔍 Current date:', currentDate)
                const targetDay = getNextDayOfWeek(dayName, currentDate)
                console.log('🔍 Target day:', targetDay)
                
                // Extract time if present - look for time patterns anywhere in the string
                const timeMatch = cleaned.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
                console.log('🔍 Time match:', timeMatch)
                if (timeMatch) {
                    const hour = parseInt(timeMatch[1])
                    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0
                    const isPM = timeMatch[3].toLowerCase() === 'pm'
                    
                    console.log('🔍 Parsed time:', { hour, minute, isPM })
                    
                    targetDay.setHours(isPM && hour !== 12 ? hour + 12 : hour === 12 && !isPM ? 0 : hour, minute, 0, 0)
                    
                    console.log('🔍 manually parsed date:', targetDay)
                    
                    const display = targetDay.toLocaleString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                        timeZoneName: 'short',
                    })

                    console.log('🔍 Manual parsing result:', { iso: targetDay.toISOString(), display })
                    return {
                        iso: targetDay.toISOString(),
                        display,
                    }
                } else {
                    // No time specified, use default time (end of day)
                    targetDay.setHours(23, 59, 0, 0)
                    
                    console.log('🔍 manually parsed date (no time):', targetDay)
                    
                    const display = targetDay.toLocaleString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                        timeZoneName: 'short',
                    })

                    console.log('🔍 Manual parsing result (no time):', { iso: targetDay.toISOString(), display })
                    return {
                        iso: targetDay.toISOString(),
                        display,
                    }
                }
            }
        } catch (error) {
            console.error('🔍 Error in manual date parsing, falling back to chrono-node:', error)
        }
    }

    console.log('🔍 Falling back to chrono-node parsing')
    const parsedDate = parseDate(processedInput, new Date(), { forwardDate: true })

    console.log('🔍 chrono-node parsed date:', parsedDate)

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

    console.log('🔍 final display:', display)

    return {
        iso: parsedDate.toISOString(),
        display,
    }
}

function getNextDayOfWeek(dayName: string, fromDate: Date): Date {
    // Map abbreviations to day indices
    const dayMap: { [key: string]: number } = {
        'sunday': 0, 'sun': 0,
        'monday': 1, 'mon': 1,
        'tuesday': 2, 'tues': 2, 'tue': 2,
        'wednesday': 3, 'wed': 3,
        'thursday': 4, 'thurs': 4, 'thu': 4,
        'friday': 5, 'fri': 5,
        'saturday': 6, 'sat': 6
    }
    
    const targetDayIndex = dayMap[dayName.toLowerCase()]
    
    if (targetDayIndex === undefined) {
        throw new Error(`Invalid day name: ${dayName}`)
    }
    
    const currentDayIndex = fromDate.getDay()
    let daysToAdd = targetDayIndex - currentDayIndex
    
    // If the target day is today or earlier this week, add 7 days to get next week
    if (daysToAdd <= 0) {
        daysToAdd += 7
    }
    
    const result = new Date(fromDate)
    result.setDate(fromDate.getDate() + daysToAdd)
    return result
}
