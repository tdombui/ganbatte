// components/Pricing.tsx
export default function Pricing() {
    return (
        <section className="py-20 px-6 bg-black text-white">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
                <p className="text-gray-400 mb-10">Built for mission-critical, speciality jobs. No hidden fees, no surprises.</p>

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
                <p className="text-sm text-gray-500 mt-6">Need bulk or recurring delivery support? <a href="mailto:team@ganbatte.run" className="underline">Contact us</a>.</p>
            </div>
        </section>
    )
}

function PriceCard({ title, price, description }: { title: string, price: string, description: string }) {
    return (
        <div className="bg-neutral-800 bg-opacity-5 border border-white/10 p-6 rounded-lg text-left">
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-3xl font-bold">{price}</p>
            <p className="text-sm text-gray-400 mt-2">{description}</p>
        </div>
    )
}
