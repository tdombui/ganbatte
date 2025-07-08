import { Resend } from 'resend'

// Make RESEND_API_KEY optional for now
const resendApiKey = process.env.RESEND_API_KEY

export const resend = resendApiKey ? new Resend(resendApiKey) : null

export interface SendInvoiceEmailParams {
  to: string
  invoiceNumber: string
  amount: number
  currency: string
  jobId: string
  pickup: string
  dropoff: string
  checkoutUrl: string
  dueDate?: string
  notes?: string
}

export const sendInvoiceEmail = async ({
  to,
  invoiceNumber,
  amount,
  currency,
  jobId,
  pickup,
  dropoff,
  checkoutUrl,
  dueDate,
  notes,
}: SendInvoiceEmailParams) => {
  // If resend is not configured, skip email sending
  if (!resend) {
    console.log('RESEND_API_KEY not configured, skipping email send')
    return null
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Ganbatte <invoices@ganbatte.com>',
      to: [to],
      subject: `Invoice #${invoiceNumber} - Ganbatte Delivery`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice #${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .invoice-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .amount { font-size: 24px; font-weight: bold; color: #10b981; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ganbatte Delivery</h1>
              <h2>Invoice #${invoiceNumber}</h2>
            </div>
            
            <div class="content">
              <p>Hello,</p>
              
              <p>Your invoice for job #${jobId} is ready for payment.</p>
              
              <div class="invoice-details">
                <h3>Job Details:</h3>
                <p><strong>Pickup:</strong> ${pickup}</p>
                <p><strong>Dropoff:</strong> ${dropoff}</p>
                ${dueDate ? `<p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
                ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
                
                <div class="amount">
                  Amount: ${currency.toUpperCase()} ${amount.toFixed(2)}
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${checkoutUrl}" class="button">
                  Pay Now
                </a>
              </div>
              
              <p>If you have any questions, please don't hesitate to contact us.</p>
              
              <p>Thank you for choosing Ganbatte!</p>
            </div>
            
            <div class="footer">
              <p>Ganbatte Delivery<br>
              1305 S Marine St, Santa Ana, CA 92704<br>
              invoices@ganbatte.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Error sending email:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to send invoice email:', error)
    throw error
  }
} 