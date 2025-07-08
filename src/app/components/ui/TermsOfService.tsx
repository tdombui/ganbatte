'use client'

import React, { useState } from 'react'

export default function TermsOfService() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-gray-300 hover:text-white transition-colors underline text-sm"
            >
                Terms of Service
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-950 text-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-neutral-700">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Terms of Service for Ganbatte</h2>
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
                                    Welcome to Ganbatte (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). These Terms of Service (&quot;Terms&quot;) govern your use of our mission-critical logistics and local parts delivery services available through our platform (the &quot;Service&quot;). By using our Service, you agree to these Terms.
                                </p>

                                <h3 className="text-xl font-semibold mb-3">1. Description of Services</h3>
                                <p className="text-gray-300 mb-3">
                                    Ganbatte provides local logistics services focused on the delivery of mission-critical payloads, including but not limited to automotive, aerospace, and manufacturing parts.
                                </p>
                                <p className="text-gray-300 mb-3">Services include:</p>
                                <ul className="list-disc list-inside text-gray-300 mb-6 space-y-1">
                                    <li>Same-day and scheduled delivery of parts</li>
                                    <li>AI-assisted booking via SMS or chat</li>
                                    <li>Job tracking and management</li>
                                </ul>

                                <h3 className="text-xl font-semibold mb-3">2. Scheduling, Cancellations, and Refunds</h3>
                                <ul className="list-disc list-inside text-gray-300 mb-6 space-y-1">
                                    <li><strong>Scheduling:</strong> Jobs may be scheduled via our AI agent (chat/text) or job creation interface. Delivery times can be edited in the job overview page.</li>
                                    <li><strong>Cancellations:</strong> You may cancel a job any time before your selected deadline, provided the job has not been initiated or picked up.</li>
                                    <li><strong>Refunds:</strong> Full refunds will be provided only if a job is cancelled <em>before</em> delivery has started. No refunds will be issued for completed or in-progress deliveries.</li>
                                </ul>

                                <h3 className="text-xl font-semibold mb-3">3. User Responsibilities</h3>
                                <p className="text-gray-300 mb-3">By using our platform, you agree to:</p>
                                <ul className="list-disc list-inside text-gray-300 mb-6 space-y-1">
                                    <li>Provide accurate and complete delivery details, addresses, and descriptions</li>
                                    <li>Pay all applicable delivery and service fees</li>
                                    <li>Refrain from booking delivery of any prohibited or illegal items (see Section 5)</li>
                                </ul>

                                <h3 className="text-xl font-semibold mb-3">4. Liability Disclaimer</h3>
                                <p className="text-gray-300 mb-3">Ganbatte is not liable for:</p>
                                <ul className="list-disc list-inside text-gray-300 mb-6 space-y-1">
                                    <li>Damaged goods, unless due to proven negligence by Ganbatte staff (note: photo documentation is performed at pickup)</li>
                                    <li>Delays caused by weather, road conditions, or unforeseen circumstances</li>
                                    <li>Any loss of revenue, profits, or indirect damages resulting from delivery outcomes</li>
                                </ul>

                                <h3 className="text-xl font-semibold mb-3">5. Prohibited Items</h3>
                                <p className="text-gray-300 mb-3">You may not request delivery of:</p>
                                <ul className="list-disc list-inside text-gray-300 mb-6 space-y-1">
                                    <li>Weapons or firearm components</li>
                                    <li>Illegal drugs or controlled substances</li>
                                    <li>Hazardous materials or unauthorized chemicals</li>
                                    <li>Perishable food or beverages</li>
                                </ul>
                                <p className="text-gray-300 mb-6">
                                    Ganbatte reserves the right to refuse or cancel any job that violates these restrictions.
                                </p>

                                <h3 className="text-xl font-semibold mb-3">6. Modification of Services</h3>
                                <p className="text-gray-300 mb-6">
                                    We reserve the right to modify or discontinue any part of our services at any time. Changes to features, pricing, or terms will be communicated in advance.
                                </p>

                                <h3 className="text-xl font-semibold mb-3">7. Termination</h3>
                                <p className="text-gray-300 mb-6">
                                    We may suspend or terminate access to our service at our discretion if you violate these Terms or any applicable laws.
                                </p>

                                <h3 className="text-xl font-semibold mb-3">8. Governing Law</h3>
                                <p className="text-gray-300 mb-6">
                                    These Terms shall be governed by and construed in accordance with the laws of the State of California, USA.
                                </p>

                                <h3 className="text-xl font-semibold mb-3">9. Contact Us</h3>
                                <p className="text-gray-300 mb-3">If you have any questions or concerns about these Terms, you may contact us via:</p>
                                <ul className="list-disc list-inside text-gray-300 mb-6 space-y-1">
                                    <li><strong>Email:</strong> team@ganbattepm.com</li>
                                    <li><strong>Contact Form:</strong> Available through our platform</li>
                                </ul>

                                <p className="text-gray-300 text-sm">
                                    By using Ganbatte, you agree to these Terms in full.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
} 