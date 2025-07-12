'use client'

import UnifiedNavbar from '../components/nav/UnifiedNavbar'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <UnifiedNavbar />
            <div className="max-w-4xl mx-auto px-4 py-8 mt-16">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
                    <p className="text-gray-300 text-lg">
                        <strong>Last updated:</strong> June 23, 2025
                    </p>
                </div>

                <div className="prose prose-invert max-w-none">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mb-8">
                        <p className="text-gray-300 text-sm">
                                                         <strong>Company:</strong> Zukujet<br/>
                            <strong>Address:</strong> 201 E Center St, Anaheim, CA 92805<br/>
                            <strong>Phone:</strong> (877) 684-5729
                            <br/>
                            <strong>Email:</strong> support@zukujet.com
                        </p>
                    </div>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Agreement to Our Legal Terms</h2>
                        <p className="text-gray-300 mb-4">
                                                         We are Zukujet (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;), a company registered in California, United States at 201 E Center St, Anaheim, CA 92805.
                        </p>
                        <p className="text-gray-300 mb-4">
                             We operate the website https://zukujet.com (the &ldquo;Site&rdquo;), the mobile application Zukujet (the &ldquo;App&rdquo;), as well as any other related products and services that refer or link to these legal terms (the &ldquo;Legal Terms&rdquo;) (collectively, the &ldquo;Services&rdquo;).
                        </p>
                        <p className="text-gray-300 mb-6">
                            Last-mile logistics for mission-critical payloads in automotive, aerospace, aviation, marine, and manufacturing. Move payloads by text. AI handles the rest.
                        </p>
                        <p className="text-gray-300 mb-6">
                             These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity (&ldquo;you&rdquo;), and Zukujet, concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Table of Contents</h2>
                        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <a href="#services" className="text-lime-400 hover:text-white transition-colors block py-1">1. Our Services</a>
                                <a href="#intellectual-property" className="text-lime-400 hover:text-white transition-colors block py-1">2. Intellectual Property Rights</a>
                                <a href="#user-representations" className="text-lime-400 hover:text-white transition-colors block py-1">3. User Representations</a>
                                <a href="#user-registration" className="text-lime-400 hover:text-white transition-colors block py-1">4. User Registration</a>
                                <a href="#purchases-payment" className="text-lime-400 hover:text-white transition-colors block py-1">5. Purchases and Payment</a>
                                <a href="#subscriptions" className="text-lime-400 hover:text-white transition-colors block py-1">6. Subscriptions</a>
                                <a href="#prohibited-activities" className="text-lime-400 hover:text-white transition-colors block py-1">7. Prohibited Activities</a>
                                <a href="#user-contributions" className="text-lime-400 hover:text-white transition-colors block py-1">8. User Generated Contributions</a>
                                <a href="#contribution-license" className="text-lime-400 hover:text-white transition-colors block py-1">9. Contribution License</a>
                                <a href="#mobile-license" className="text-lime-400 hover:text-white transition-colors block py-1">10. Mobile Application License</a>
                                <a href="#services-management" className="text-lime-400 hover:text-white transition-colors block py-1">11. Services Management</a>
                                <a href="#privacy-policy" className="text-lime-400 hover:text-white transition-colors block py-1">12. Privacy Policy</a>
                                <a href="#copyright-infringements" className="text-lime-400 hover:text-white transition-colors block py-1">13. Copyright Infringements</a>
                                <a href="#term-termination" className="text-lime-400 hover:text-white transition-colors block py-1">14. Term and Termination</a>
                                <a href="#modifications-interruptions" className="text-lime-400 hover:text-white transition-colors block py-1">15. Modifications and Interruptions</a>
                                <a href="#governing-law" className="text-lime-400 hover:text-white transition-colors block py-1">16. Governing Law</a>
                                <a href="#dispute-resolution" className="text-lime-400 hover:text-white transition-colors block py-1">17. Dispute Resolution</a>
                                <a href="#corrections" className="text-lime-400 hover:text-white transition-colors block py-1">18. Corrections</a>
                                <a href="#disclaimer" className="text-lime-400 hover:text-white transition-colors block py-1">19. Disclaimer</a>
                                <a href="#limitations-liability" className="text-lime-400 hover:text-white transition-colors block py-1">20. Limitations of Liability</a>
                                <a href="#indemnification" className="text-lime-400 hover:text-white transition-colors block py-1">21. Indemnification</a>
                                <a href="#user-data" className="text-lime-400 hover:text-white transition-colors block py-1">22. User Data</a>
                                <a href="#electronic-communications" className="text-lime-400 hover:text-white transition-colors block py-1">23. Electronic Communications</a>
                                <a href="#sms-messaging" className="text-lime-400 hover:text-white transition-colors block py-1">24. SMS Text Messaging</a>
                                <a href="#california-users" className="text-lime-400 hover:text-white transition-colors block py-1">25. California Users and Residents</a>
                                <a href="#miscellaneous" className="text-lime-400 hover:text-white transition-colors block py-1">26. Miscellaneous</a>
                                <a href="#contact-us" className="text-lime-400 hover:text-white transition-colors block py-1">27. Contact Us</a>
                            </div>
                        </div>
                    </section>

                    <section id="services" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">1. Our Services</h2>
                        <p className="text-gray-300 mb-6">
                            The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.
                        </p>
                        <p className="text-gray-300 mb-6">
                            The Services are not tailored to comply with industry-specific regulations (Health Insurance Portability and Accountability Act (HIPAA), Federal Information Security Management Act (FISMA), etc.), so if your interactions would be subjected to such laws, you may not use the Services. You may not use the Services in a way that would violate the Gramm-Leach-Bliley Act (GLBA).
                        </p>
                    </section>

                    <section id="intellectual-property" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">2. Intellectual Property Rights</h2>
                        <h3 className="text-lg font-semibold mb-2">Our Intellectual Property</h3>
                        <p className="text-gray-300 mb-4">
                            We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the &ldquo;Content&rdquo;), as well as the trademarks, service marks, and logos contained therein (the &ldquo;Marks&rdquo;).
                        </p>
                        <p className="text-gray-300 mb-6">
                            Our Content and Marks are protected by copyright and trademark laws (and various other intellectual property rights and unfair competition laws) and treaties in the United States and around the world.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">3. User Representations</h2>
                        <p className="text-gray-300 mb-4">
                            By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Legal Terms; (4) you are not a minor in the jurisdiction in which you reside; (5) you will not access the Services through automated or non-human means, whether through a bot, script or otherwise; (6) you will not use the Services for any illegal or unauthorized purpose; and (7) your use of the Services will not violate any applicable law or regulation.
                        </p>
                    </section>

                    <section id="user-registration" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">4. User Registration</h2>
                        <p className="text-gray-300 mb-6">
                            You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
                        </p>
                    </section>

                    <section id="purchases-payment" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">5. Purchases and Payment</h2>
                        <p className="text-gray-300 mb-3">We accept the following forms of payment:</p>
                        <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1 ml-4">
                            <li>Visa</li>
                            <li>Mastercard</li>
                            <li>American Express</li>
                            <li>Discover</li>
                            <li>PayPal</li>
                        </ul>
                        <p className="text-gray-300 mb-6">
                            You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. You further agree to promptly update account and payment information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed. Sales tax will be added to the price of purchases as deemed required by us. We may change prices at any time. All payments shall be in US dollars.
                        </p>
                    </section>

                    <section id="subscriptions" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">6. Subscriptions</h2>
                        <h3 className="text-lg font-semibold mb-2">Cancellation</h3>
                        <p className="text-gray-300 mb-4">
                            You can cancel your subscription at any time by logging into your account. Your cancellation will take effect at the end of the current paid term. If you have any questions or are unsatisfied with our Services, please email us at support@zukujet.com.
                        </p>
                        <h3 className="text-lg font-semibold mb-2">Fee Changes</h3>
                        <p className="text-gray-300 mb-6">
                            We may, from time to time, make changes to the subscription fee and will communicate any price changes to you in accordance with applicable law.
                        </p>
                    </section>

                    <section id="prohibited-activities" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">7. Prohibited Activities</h2>
                        <p className="text-gray-300 mb-4">
                            You may not access or use the Services for any purpose other than that for which we make the Services available. The Services may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
                        </p>
                        <p className="text-gray-300 mb-3">As a user of the Services, you agree not to:</p>
                        <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2 ml-4">
                            <li>Systematically retrieve data or other content from the Services to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
                            <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
                            <li>Circumvent, disable, or otherwise interfere with security-related features of the Services.</li>
                            <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.</li>
                            <li>Use any information obtained from the Services in order to harass, abuse, or harm another person.</li>
                            <li>Make improper use of our support services or submit false reports of abuse or misconduct.</li>
                            <li>Use the Services in a manner inconsistent with any applicable laws or regulations.</li>
                        </ul>
                    </section>

                    <section id="user-contributions" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">8. User Generated Contributions</h2>
                        <p className="text-gray-300 mb-6">
                            The Services may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Services, including but not limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material (collectively, &ldquo;Contributions&rdquo;).
                        </p>
                    </section>

                    <section id="contribution-license" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">9. Contribution License</h2>
                        <p className="text-gray-300 mb-6">
                            By posting your Contributions to any part of the Services, you automatically grant, and you represent and warrant that you have the right to grant, to us an unrestricted, unlimited, irrevocable, perpetual, non-exclusive, transferable, royalty-free, fully-paid, worldwide right, and license to host, use, copy, reproduce, disclose, sell, resell, publish, broadcast, retitle, archive, store, cache, publicly perform, publicly display, reformat, translate, transmit, excerpt (in whole or in part), and distribute such Contributions.
                        </p>
                    </section>

                    <section id="mobile-license" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">10. Mobile Application License</h2>
                        <h3 className="text-lg font-semibold mb-2">Use License</h3>
                        <p className="text-gray-300 mb-6">
                            If you access the Services via the App, then we grant you a revocable, non-exclusive, non-transferable, limited right to install and use the App on wireless electronic devices owned or controlled by you, and to access and use the App on such devices strictly in accordance with the terms and conditions of this mobile application license contained in these Legal Terms.
                        </p>
                    </section>

                    <section id="services-management" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">11. Services Management</h2>
                        <p className="text-gray-300 mb-6">
                            We reserve the right, but not the obligation, to: (1) monitor the Services for violations of these Legal Terms; (2) take appropriate legal action against anyone who, in our sole discretion, violates the law or these Legal Terms, including without limitation, reporting such user to law enforcement authorities; (3) in our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or any portion thereof; (4) in our sole discretion and without limitation, notice, or liability, to remove from the Services or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and (5) otherwise manage the Services in a manner designed to protect our rights and property and to facilitate the proper functioning of the Services.
                        </p>
                    </section>

                    <section id="privacy-policy" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">12. Privacy Policy</h2>
                        <p className="text-gray-300 mb-6">
                            We care about data privacy and security. Please review our Privacy Policy: https://zukujet.com/privacy. By using the Services, you agree to be bound by our Privacy Policy, which is incorporated into these Legal Terms. Please be advised the Services are hosted in the United States. If you access the Services from any other region of the world with laws or other requirements governing personal data collection, use, or disclosure that differ from applicable laws in the United States, then through your continued use of the Services, you are transferring your data to the United States, and you expressly consent to have your data transferred to and processed in the United States.
                        </p>
                    </section>

                    <section id="copyright-infringements" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">13. Copyright Infringements</h2>
                        <p className="text-gray-300 mb-6">
                            We respect the intellectual property rights of others. If you believe that any material available on or through the Services infringes upon any copyright you own or control, please immediately notify us using the contact information provided below (a &ldquo;Notification&rdquo;). A copy of your Notification will be sent to the person who posted or stored the material addressed in the Notification. Please be advised that pursuant to applicable law you may be held liable for damages if you make material misrepresentations in a Notification. Thus, if you are not sure that material located on or linked to by the Services infringes your copyright, you should consider first contacting an attorney.
                        </p>
                    </section>

                    <section id="term-termination" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">14. Term and Termination</h2>
                        <p className="text-gray-300 mb-6">
                            These Legal Terms shall remain in full force and effect while you use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE LEGAL TERMS OR OF ANY APPLICABLE LAW OR REGULATION.
                        </p>
                    </section>

                    <section id="modifications-interruptions" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">15. Modifications and Interruptions</h2>
                        <p className="text-gray-300 mb-6">
                            We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Services. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Services.
                        </p>
                    </section>

                    <section id="governing-law" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">16. Governing Law</h2>
                        <p className="text-gray-300 mb-6">
                            These Legal Terms and your use of the Services are governed by and construed in accordance with the laws of the State of California applicable to agreements made and to be entirely performed within the State of California, without regard to its conflict of law principles.
                        </p>
                    </section>

                    <section id="dispute-resolution" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">17. Dispute Resolution</h2>
                        <h3 className="text-lg font-semibold mb-2">Informal Negotiations</h3>
                        <p className="text-gray-300 mb-4">
                            To expedite resolution and control the cost of any dispute, controversy, or claim related to these Legal Terms (each a &ldquo;Dispute&rdquo; and collectively, the &ldquo;Disputes&rdquo;) brought by either you or us (individually, a &ldquo;Party&rdquo; and collectively, the &ldquo;Parties&rdquo;), the Parties agree to first attempt to negotiate any Dispute (except those Disputes expressly provided below) informally for at least thirty (30) days before initiating arbitration.
                        </p>
                        <h3 className="text-lg font-semibold mb-2">Binding Arbitration</h3>
                        <p className="text-gray-300 mb-6">
                            If the Parties are unable to resolve a Dispute through informal negotiations, the Dispute (except those Disputes expressly excluded below) will be finally and exclusively resolved by binding arbitration. YOU UNDERSTAND THAT WITHOUT THIS PROVISION, YOU WOULD HAVE THE RIGHT TO SUE IN COURT AND HAVE A JURY TRIAL.
                        </p>
                    </section>

                    <section id="corrections" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">18. Corrections</h2>
                        <p className="text-gray-300 mb-6">
                            There may be information on the Services that contains typographical errors, inaccuracies, or omissions, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Services at any time, without prior notice.
                        </p>
                    </section>

                    <section id="disclaimer" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">19. Disclaimer</h2>
                        <p className="text-gray-300 mb-6">
                            THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                        </p>
                    </section>

                    <section id="limitations-liability" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">20. Limitations of Liability</h2>
                        <p className="text-gray-300 mb-6">
                            IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                        </p>
                    </section>

                    <section id="indemnification" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">21. Indemnification</h2>
                        <p className="text-gray-300 mb-6">
                            You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys&apos; fees and expenses, made by any third party due to or arising out of: (1) your Contributions; (2) use of the Services; (3) breach of these Legal Terms; (4) any breach of your representations and warranties set forth in these Legal Terms; (5) your violation of the rights of a third party, including but not limited to intellectual property rights; or (6) any overt harmful act toward any other user of the Services with whom you connected via the Services.
                        </p>
                    </section>

                    <section id="user-data" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">22. User Data</h2>
                        <p className="text-gray-300 mb-6">
                            We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services, as well as data relating to your use of the Services. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Services. You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data.
                        </p>
                    </section>

                    <section id="electronic-communications" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">23. Electronic Communications, Transactions, and Signatures</h2>
                        <p className="text-gray-300 mb-6">
                            Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email and on the Services, satisfy any legal requirement that such communication be in writing. YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SERVICES.
                        </p>
                    </section>

                    <section id="sms-messaging" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">24. SMS Text Messaging</h2>
                        <h3 className="text-lg font-semibold mb-2">Program Description</h3>
                        <p className="text-gray-300 mb-4">
                            By opting into any Twilio text messaging program, you expressly consent to receive text messages (SMS) to your mobile number. Twilio text messages may include: responses to inquiries.
                        </p>
                        <h3 className="text-lg font-semibold mb-2">Opting Out</h3>
                        <p className="text-gray-300 mb-4">
                            If at any time you wish to stop receiving SMS messages from us, simply reply to the text with &ldquo;STOP.&rdquo; You may receive an SMS message confirming your opt out.
                        </p>
                        <h3 className="text-lg font-semibold mb-2">Message and Data Rates</h3>
                        <p className="text-gray-300 mb-4">
                            Please be aware that message and data rates may apply to any SMS messages sent or received. The rates are determined by your carrier and the specifics of your mobile plan.
                        </p>
                        <h3 className="text-lg font-semibold mb-2">Support</h3>
                        <p className="text-gray-300 mb-6">
                            If you have any questions or need assistance regarding our SMS communications, please email us at support@zukujet.com or call at (877) 684-5729.
                        </p>
                    </section>

                    <section id="california-users" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">25. California Users and Residents</h2>
                        <p className="text-gray-300 mb-6">
                            If any complaint with us is not satisfactorily resolved, you can contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112, Sacramento, California 95834 or by telephone at (800) 952-5210 or (916) 445-1254.
                        </p>
                    </section>

                    <section id="miscellaneous" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">26. Miscellaneous</h2>
                        <p className="text-gray-300 mb-6">
                            These Legal Terms and any policies or operating rules posted by us on the Services or in respect to the Services constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Legal Terms shall not operate as a waiver of such right or provision. These Legal Terms operate to the fullest extent permissible by law.
                        </p>
                    </section>

                    <section id="contact-us" className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">27. Contact Us</h2>
                        <p className="text-gray-300 mb-4">
                            In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:
                        </p>
                        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mb-6">
                            <p className="text-gray-300">
                                                                 <strong>Zukujet</strong><br/>
                                201 E Center St<br/>
                                Anaheim, CA 92805<br/>
                                United States<br/>
                                <strong>Phone:</strong> (877) 684-5729
                                <br/>
                                <strong>Email:</strong> support@zukujet.com
                            </p>
                        </div>
                    </section>

                    <div className="border-t border-neutral-700 pt-6">
                        <p className="text-gray-300 text-sm">
                            We reserve the right to modify these Terms of Service at any time. Updates will be posted on this page with the new effective date.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
} 