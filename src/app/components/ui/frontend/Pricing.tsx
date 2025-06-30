// components/Pricing.tsx
export default function Pricing() {
    return (
        <section className="w-full max-w-6xl mx-auto p-8 md:p-12 rounded-xl relative overflow-hidden">
            <div 
                className="w-full h-full p-8 md:p-12 rounded-xl relative"
                style={{
                    background: `
                        linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                        url('/noise.png')
                    `,
                    backgroundBlendMode: 'overlay',
                    backgroundSize: '100% 100%, 200px 200px'
                }}
            >
                <div className="max-w-4xl mx-auto text-center relative z-10 font-sans">


                    <div className="grid md:grid-cols-3 gap-6">
                        <PriceCard
                            title="Base Rate"
                            price="$30"
                            description="Flat fee per delivery"
                        />
                        <PriceCard
                            title="Per Mile"
                            price="$1.25"
                            description="Calculated by optimized route"
                        />
                        <PriceCard
                            title="Per Item"
                            price="$1 per extra lb"
                            description="First 50lbs are free"
                        />

                        <PriceCard
                            title="Same Day Delivery"
                            price="$60"
                            description="Priority routing for urgent jobs"
                        />
                        <PriceCard
                            title="After Hours / Weekend"
                            price="$60"
                            description="Deliveries after standard hours"
                        />
                        <PriceCard
                            title="Discounts"
                            price="–25%"
                            description="For jobs scheduled 24h+ in advance"
                        />
                    </div>
                    <p className="text-sm text-gray-200 mt-6 drop-shadow-lg">Need bulk or recurring delivery support? <a href="mailto:team@ganbatte.run" className="underline">Contact us</a>.</p>
                </div>
            </div>
        </section>
    )
}

// Make Payload Moves Section
export function MakePayloadMoves() {
    const payloadImages = [
        { src: '/payloads/brake.webp', alt: 'Brake System' },
        { src: '/payloads/bumper.webp', alt: 'Bumper' },
        { src: '/payloads/coilover.webp', alt: 'Coilover Suspension' },
        { src: '/payloads/tire.webp', alt: 'Tire' },
        { src: '/payloads/turbo.webp', alt: 'Turbocharger' },
        { src: '/payloads/wheel.webp', alt: 'Wheel' }
    ];

    return (
        <section className="w-full max-w-6xl mx-auto p-8 md:p-12 rounded-xl relative overflow-hidden mt-8">
            <div 
                className="w-full h-full p-8 md:p-12 rounded-xl relative"
                style={{
                    background: `
                        linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                        url('/noise.png')
                    `,
                    backgroundBlendMode: 'overlay',
                    backgroundSize: '100% 100%, 200px 200px'
                }}
            >
                <div className="max-w-4xl mx-auto text-center relative z-10 font-sans">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 drop-shadow-2xl">
                        Make Payload Moves
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {payloadImages.map((image, index) => (
                            <div 
                                key={index}
                                className="bg-black/80 backdrop-blur-sm border border-white/20 p-4 rounded-lg hover:bg-black/65 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            >
                                <img 
                                    src={image.src} 
                                    alt={image.alt}
                                    className="w-full h-48 object-cover rounded-md mb-3"
                                />
                                <h3 className="text-lg font-semibold text-white drop-shadow-lg">
                                    {image.alt}
                                </h3>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

function PriceCard({ title, price, description }: { title: string, price: string, description: string }) {
    return (
        <div className="bg-black/80 backdrop-blur-sm border border-white/20 p-6 rounded-lg text-left hover:bg-black/65 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <h3 className="text-xl font-semibold mb-2 text-white drop-shadow-lg">{title}</h3>
            <p className="text-3xl font-bold text-white drop-shadow-2xl">{price}</p>
            <p className="text-sm text-gray-200 mt-2 drop-shadow-lg">{description}</p>
        </div>
    )
}
