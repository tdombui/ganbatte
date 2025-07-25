import { NextResponse } from 'next/server'
import { ParsedJob } from '@/types/job'
import { openai } from '@/lib/openai'
import { validateAddress } from '@/lib/validateAddress'
import { normalizeDeadline } from '@/lib/normalizeDeadline'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        console.log('🔍 ParseJob: Starting request...')
        const { text, history, overrideField } = await req.json()

        console.log('🔍 ParseJob request:', { text, overrideField, historyLength: history?.length || 0 })

        // Get customer's default address for context
        let customerDefaultAddress: string | null = null
        try {
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()
            
            if (user) {
                const { data: customer } = await supabase
                    .from('customers')
                    .select('default_address')
                    .eq('id', user.id)
                    .single()
                
                customerDefaultAddress = customer?.default_address || null
                console.log('🔍 Customer default address:', customerDefaultAddress)
            }
        } catch (error) {
            console.log('🔍 Could not fetch customer default address:', error)
            // Continue without default address - don't fail the entire request
        }

        // If we're clarifying a specific field, we need to preserve existing job data
        const existingJobData: Partial<ParsedJob> = {}
        
        // Try to extract existing job data from history
        if (overrideField && history) {
            console.log('🔍 ParseJob: Processing override field:', overrideField)
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

        console.log('🔍 ParseJob: Building prompt...')
        const defaultAddressContext = customerDefaultAddress 
            ? `\nCUSTOMER CONTEXT: The customer has set their default address as: "${customerDefaultAddress}". When they mention "my shop", "the shop", "my place", "here", or similar references, use this default address.`
            : ''

        const prompt = `
You're an assistant for a parts delivery service called Ganbatte. When a customer sends a message, your job is to extract these fields and return them as JSON only — no backticks, no markdown, no explanations.

Here is the conversation history:
${history}

Most recent message:
${text}${defaultAddressContext}

${overrideField ? `IMPORTANT: The user is clarifying the ${overrideField} field. Please extract ONLY the ${overrideField} from their message. Keep other fields as they were previously discussed.` : ''}

EXTRACTION GUIDELINES:
- parts: Extract any items, parts, or things being delivered (e.g., "wheels", "engine parts", "documents")
- pickup: Extract the pickup address or location (can be coordinates like "40.7128, -74.0060" or street addresses)
- dropoff: Extract the delivery address or location (can be coordinates like "40.7128, -74.0060" or street addresses)
- deadline: Extract ANY time reference, including natural language like "next tuesday", "tomorrow", "by 5pm", "asap", "urgent", etc. Keep the original text as-is.

${customerDefaultAddress ? `ADDRESS RESOLUTION: If the customer mentions "my shop", "the shop", "my place", "here", or similar references, use their default address: "${customerDefaultAddress}"` : ''}

COORDINATE HANDLING: If the customer provides GPS coordinates in any format (e.g., "40.7128, -74.0060", "34.0522, -118.2437", "33°11'58.5\"N 117°22'27.6\"W"), extract them exactly as provided. Do not try to convert coordinates to addresses.

Return a JSON object with:
{
  "parts": [],
  "pickup": "",
  "dropoff": "",
  "deadline": ""
}

Examples of deadline extraction:
- "next tues by 2pm" → deadline: "next tues by 2pm"
- "tomorrow at 3pm" → deadline: "tomorrow at 3pm" 
- "as soon as possible" → deadline: "as soon as possible"
- "by Friday" → deadline: "by Friday"
- "urgent delivery" → deadline: "urgent delivery"

Examples of coordinate extraction:
- "pickup at 40.7128, -74.0060" → pickup: "40.7128, -74.0060"
- "deliver to 34.0522, -118.2437" → dropoff: "34.0522, -118.2437"
- "pickup from 33°11'58.5\"N 117°22'27.6\"W" → pickup: "33°11'58.5\"N 117°22'27.6\"W"
`

        console.log('🔍 ParseJob: Calling OpenAI...')
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
        })

        console.log('🔍 ParseJob: OpenAI response received')
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
        console.log('🔍 ParseJob: Validating addresses...')
        const pickupCheck = await validateAddress(parsed.pickup)
        const dropoffCheck = await validateAddress(parsed.dropoff)

        console.log('🔍 Address validation results:', {
            pickup: { address: parsed.pickup, valid: pickupCheck.valid },
            dropoff: { address: parsed.dropoff, valid: dropoffCheck.valid }
        })

        // Normalize deadline
        console.log('🔍 ParseJob: Normalizing deadline...')
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
