// components/About.tsx
export default function About() {
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
                <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-2xl">What is Ganbatte?</h2>
                    <p className="text-gray-100 text-lg drop-shadow-lg">
                        Ganbatte is a high-performance last-mile logistics solution for mission-critical payloads across automotive, aerospace, aviation, marine, and manufacturing.
                    </p>
                    <p className="text-gray-100 text-lg drop-shadow-lg">
                        We operate throughout Southern California, delivering ultra-responsive service powered by AI-driven dispatch and route optimization—with pro drivers behind the wheel.                </p>

                    <p className="text-gray-100 text-lg drop-shadow-lg">
                        Keep your parts moving and projects on track.
                    </p>
                    <p className="text-md text-gray-200 drop-shadow-lg"> <i>Ganbatte</i> (頑張って) means <i>do your best.</i> </p>
                    {/* <p className="text-sm text-gray-400">We always aim for 1st place. We drive to win.</p> */}
                </div>
            </div>
        </section>
    )
}
