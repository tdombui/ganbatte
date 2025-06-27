// components/About.tsx
export default function About() {
    return (
        <section className="py-12 md:py-20 px-6 bg-black text-white font-sans">
            <div className="max-w-3xl mx-auto text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">What is Ganbatte?</h2>
                <p className="text-gray-300 text-lg">
                    Ganbatte is a high-performance last-mile logistics solution for mission-critical payloads across automotive, aerospace, aviation, marine, and manufacturing.
                </p>
                <p className="text-gray-300 text-lg">
                    We operate throughout Southern California, delivering ultra-responsive service powered by AI-driven dispatch and route optimization—with pro drivers behind the wheel.                </p>

                <p className="text-gray-300 text-lg">
                    Keep your parts moving and projects on track.
                </p>
                <p className="text-md text-gray-400"> <i>Ganbatte</i> (頑張って) means <i>do your best.</i> </p>
                {/* <p className="text-sm text-gray-400">We always aim for 1st place. We drive to win.</p> */}
            </div>
        </section>
    )
}
