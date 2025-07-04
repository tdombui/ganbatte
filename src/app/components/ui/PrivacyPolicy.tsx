'use client'

import React, { useState } from 'react'

export default function PrivacyPolicy() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-gray-300 hover:text-white transition-colors underline text-sm"
            >
                Privacy Policy
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-950 text-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-neutral-700">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Privacy Policy for Ganbatte</h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-white text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="prose prose-invert max-w-none">
                                <p className="text-gray-300 mb-4">
                                    <strong>Effective Date:</strong> January 2025
                                </p>

                                <p className="text-gray-300 mb-6">
                                    Ganbatte ("we," "us," or "our") values your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our services through our website or mobile application (the "Platform").
                                </p>

                                <h3 className="text-xl font-semibold mb-3">1. Information We Collect</h3>
                                <p className="text-gray-300 mb-3">We collect the following types of personal information:</p>
                                <ul className="list-disc list-inside text-gray-300 mb-6 space-y-1">
                                    <li>Name</li>
                                    <li>Phone number</li>
                                    <li>Email address</li>
                                    <li>Delivery, mailing, and billing addresses</li>
                                    <li>SMS preferences</li>
                                    <li>Payment information (processed via third-party providers)</li>
                                    <li>Job-related photos (uploaded during service requests)</li>
                                    <li>Communication and chat history with our AI agent or team</li>
                                </ul>

                                <h3 className="text-xl font-semibold mb-3">2. How We Use Your Information</h3>
                                <p className="text-gray-300 mb-3">We use your personal information to:</p>
                                <ul className="list-disc list-inside text-gray-300 mb-6 space-y-1">
                                    <li>Provide and fulfill our logistics and delivery services</li>
                                    <li>Communicate with you via SMS and email</li>
                                    <li>Verify your identity and payment method</li>
                                    <li>Improve and optimize the Platform</li>
                                    <li>Comply with legal obligations</li>
                                </ul>

                                <h3 className="text-xl font-semibold mb-3">3. Data Storage and Retention</h3>
                                <p className="text-gray-300 mb-6">
                                    We store delivery addresses and chat messages to support service operations. Your data is retained for as long as necessary to fulfill the purposes outlined in this Privacy Policy unless a longer retention period is required by law.
                                </p>

                                <h3 className="text-xl font-semibold mb-3">4. Cookies and Tracking</h3>
                                <p className="text-gray-300 mb-6">
                                    We currently do not use cookies or other tracking technologies. This may change as our services scale, in which case this policy will be updated accordingly.
                                </p>

                                <h3 className="text-xl font-semibold mb-3">5. Third-Party Services</h3>
                                <p className="text-gray-300 mb-3">We use the following third-party services, which may access your information as necessary to provide their respective services:</p>
                                <ul className="list-disc list-inside text-gray-300 mb-6 space-y-1">
                                    <li><strong>Supabase</strong> – for backend data storage</li>
                                    <li><strong>OpenAI</strong> – for AI chat parsing and assistance</li>
                                    <li><strong>Cloudinary</strong> – for image hosting and delivery</li>
                                    <li><strong>Google Maps</strong> – for routing and map services</li>
                                    <li><strong>Twilio</strong> – for SMS communication</li>
                                    <li><strong>Resend</strong> – for transactional emails</li>
                                    <li><strong>Zoho</strong> – for business email communication</li>
                                </ul>
                                <p className="text-gray-300 mb-6">
                                    We are not responsible for the privacy practices of these providers but strive to work with reputable and compliant vendors.
                                </p>

                                <h3 className="text-xl font-semibold mb-3">6. Data Security</h3>
                                <p className="text-gray-300 mb-6">
                                    We implement reasonable technical and organizational measures to protect your personal data. However, no method of transmission or storage is 100% secure.
                                </p>

                                <h3 className="text-xl font-semibold mb-3">7. Children's Privacy</h3>
                                <p className="text-gray-300 mb-6">
                                    Our services are intended for adults only. We do not knowingly collect data from individuals under 18 years old.
                                </p>

                                <h3 className="text-xl font-semibold mb-3">8. Your Rights and Choices</h3>
                                <p className="text-gray-300 mb-3">You may:</p>
                                <ul className="list-disc list-inside text-gray-300 mb-6 space-y-1">
                                    <li>Access, update, or delete your personal information</li>
                                    <li>Opt out of SMS and email communications</li>
                                    <li>Contact us with questions or to exercise your data rights</li>
                                </ul>

                                <h3 className="text-xl font-semibold mb-3">9. Contact Us</h3>
                                <p className="text-gray-300 mb-3">For privacy-related inquiries, please reach out via:</p>
                                <ul className="list-disc list-inside text-gray-300 mb-6 space-y-1">
                                    <li><strong>Email:</strong> team@ganbatte.run</li>
                                    <li><strong>Contact Form:</strong> Available through our platform</li>
                                </ul>

                                <p className="text-gray-300 text-sm">
                                    We reserve the right to modify this Privacy Policy at any time. Updates will be posted on this page with the new effective date.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
} 