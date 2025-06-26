import { NextResponse } from 'next/server'
import { ParsedJob } from '@/types/job'
import { openai } from '@/lib/openai'
import { validateAddress } from '@/lib/validateAddress'
import { normalizeDeadline } from '@/lib/normalizeDeadline'

export async function POST(req: Request) {
    try {
        const { text, history, overrideField } = await req.json()

        console.log('🔍 ParseJob request:', { text, overrideField, historyLength: history?.length || 0 })

        // If we're clarifying a specific field, we need to preserve existing job data
        const existingJobData: Partial<ParsedJob> = {}
        
        // Try to extract existing job data from history
        if (overrideField && history) {
            const historyLines = history.split('\n')
            for (let i = historyLines.length - 1; i >= 0; i--) {
                const line = historyLines[i]
                if (line.includes('ai:Got it! You need:')) {
                    // Found the job summary, extract existing data
                    const summaryStart = historyLines.indexOf(line)
                    if (summaryStart > 0) {
                        const aiMessage = historyLines[summaryStart]
                        console.log('🔍 Found existing job summary:', aiMessage)
                        
                        // Extract pickup and dropoff from the summary
                        const pickupMatch = aiMessage.match(/📌 Picked up from: (.+?)(?=\n|$)/)
                        const dropoffMatch = aiMessage.match(/📌 Delivered to: (.+?)(?=\n|$)/)
                        
                        if (pickupMatch && pickupMatch[1] !== '[pickup missing]') {
                            Object.assign(existingJobData, { pickup: pickupMatch[1].trim() })
                        }
                        if (dropoffMatch && dropoffMatch[1] !== '[dropoff missing]') {
                            Object.assign(existingJobData, { dropoff: dropoffMatch[1].trim() })
                        }
                        break
                    }
                }
            }
        }

        const prompt = `
You're an assistant for a parts delivery service called Ganbatte. When a customer sends a message, your job is to extract these fields and return them as JSON only — no backticks, no markdown, no explanations.

Here is the conversation history:
${history}

Most recent message:
${text}

${overrideField ? `IMPORTANT: The user is clarifying the ${overrideField} field. Please extract ONLY the ${overrideField} from their message. Keep other fields as they were previously discussed.` : ''}

Return a JSON object with:
{
  "parts": [],
  "pickup": "",
  "dropoff": "",
  "deadline": ""
}
`

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
        })

        const content = completion.choices[0].message.content || ''
        const cleanJson = content
            .replace(/^```json\s*/, '')
            .replace(/^```\s*/, '')
            .replace(/\s*```$/, '')
            .trim()

        console.log('✅ Cleaned AI output:', cleanJson)
        const parsed: ParsedJob = JSON.parse(cleanJson)

        // Merge with existing job data for field clarifications
        if (overrideField) {
            const mergedJob = { ...existingJobData, ...parsed }
            console.log('🔍 Merged job data:', { existing: existingJobData, new: parsed, merged: mergedJob })
            Object.assign(parsed, mergedJob)
        }

        console.log('🔍 Final parsed job data:', parsed)

        // Validate pickup and dropoff
        const pickupCheck = await validateAddress(parsed.pickup)
        const dropoffCheck = await validateAddress(parsed.dropoff)

        console.log('🔍 Address validation results:', {
            pickup: { address: parsed.pickup, valid: pickupCheck.valid },
            dropoff: { address: parsed.dropoff, valid: dropoffCheck.valid }
        })

        // Normalize deadline
        const normalized = normalizeDeadline(parsed.deadline ?? '')
        parsed.deadline = normalized.iso
        parsed.deadlineDisplay = normalized.display

        // Request clarification for invalid fields
        if (!pickupCheck.valid) {
            console.log('❌ Pickup validation failed, requesting clarification')
            return NextResponse.json({
                job: parsed,
                needsClarification: true,
                message: `Can you clarify the **pickup location**?`
            })
        }

        if (!dropoffCheck.valid) {
            console.log('❌ Dropoff validation failed, requesting clarification')
            return NextResponse.json({
                job: parsed,
                needsClarification: true,
                message: `Can you clarify the **dropoff location**?`
            })
        }

        if (!normalized.iso) {
            console.log('❌ Deadline validation failed, requesting clarification')
            return NextResponse.json({
                job: parsed,
                needsClarification: true,
                message: `When do you need this by? You can either:\n\n1. Type your deadline (e.g., "June 25, 5PM")\n2. Use the calendar below to select date and time`
            })
        }

        console.log('✅ All validations passed, returning job')
        return NextResponse.json({ job: parsed })

    } catch (err) {
        console.error('🔥 /api/parseJob error:', err)
        return NextResponse.json({ error: 'Failed to parse job' }, { status: 500 })
    }
}
