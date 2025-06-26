import { NextResponse } from 'next/server'
import { ParsedJob } from '@/types/job'
import { openai } from '@/lib/openai'
import { validateAddress } from '@/lib/validateAddress'
import { normalizeDeadline } from '@/lib/normalizeDeadline'

export async function POST(req: Request) {
    try {
        const { text, history } = await req.json()

        const prompt = `
You're an assistant for a parts delivery service called Ganbatte. When a customer sends a message, your job is to extract these fields and return them as JSON only — no backticks, no markdown, no explanations.

Here is the conversation history:
${history}

Most recent message:
${text}

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

        // Validate pickup and dropoff
        const pickupCheck = await validateAddress(parsed.pickup)
        const dropoffCheck = await validateAddress(parsed.dropoff)

        // Normalize deadline
        const normalized = normalizeDeadline(parsed.deadline ?? '')
        parsed.deadline = normalized.iso
        parsed.deadlineDisplay = normalized.display

        // Request clarification for invalid fields
        if (!pickupCheck.valid) {
            return NextResponse.json({
                job: parsed,
                needsClarification: true,
                message: `Can you clarify the **pickup location**?`
            })
        }

        if (!dropoffCheck.valid) {
            return NextResponse.json({
                job: parsed,
                needsClarification: true,
                message: `Can you clarify the **dropoff location**?`
            })
        }

        if (!normalized.iso) {
            return NextResponse.json({
                job: parsed,
                needsClarification: true,
                message: `When do you need this by? You can either:\n\n1. Type your deadline (e.g., "June 25, 5PM")\n2. Use the calendar below to select date and time`
            })
        }

        return NextResponse.json({ job: parsed })

    } catch (err) {
        console.error('🔥 /api/parseJob error:', err)
        return NextResponse.json({ error: 'Failed to parse job' }, { status: 500 })
    }
}
