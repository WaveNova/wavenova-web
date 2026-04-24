const STEPS = [
  {
    number: "01",
    title: "Choose a Project",
    description:
      "Browse our curated portfolio of vetted grassroots projects. Each is handpicked, on-the-ground, and measurable. We scout every partner personally.",
    icon: "🌊",
  },
  {
    number: "02",
    title: "See Your Impact",
    description:
      "Track exactly where your money goes. Our real-time dashboard shows KG collected, workers employed, and funds allocated — down to every dollar.",
    icon: "📊",
  },
  {
    number: "03",
    title: "Watch It Grow",
    description:
      "Receive photo updates, monthly impact emails, and see your cumulative contribution grow over time as stations expand across South Lombok.",
    icon: "🌱",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2
            className="font-[var(--font-dm-serif)] text-4xl mb-2"
            style={{ color: "#1A7A8A" }}
          >
            How It Works
          </h2>
          <p className="text-[#6B7280] text-lg">Three steps. Full transparency. Real impact.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-12 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-[#D4F0F5] z-0" />

          {STEPS.map((step, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center px-4">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl mb-5 shadow-sm"
                style={{ background: "#EDF9FB" }}
              >
                {step.icon}
              </div>
              <div
                className="text-xs font-bold tracking-widest mb-2"
                style={{ color: "#24B5CB" }}
              >
                STEP {step.number}
              </div>
              <h3 className="font-bold text-xl text-[#1F2937] mb-3">{step.title}</h3>
              <p className="text-[#6B7280] text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Differentiation callout */}
        <div
          className="mt-14 rounded-2xl p-6 border-l-4"
          style={{ background: "#EDF9FB", borderLeftColor: "#24B5CB" }}
        >
          <p className="text-[#1A7A8A] font-medium text-base leading-relaxed">
            <strong>Not a GoFundMe. Not a grant-maker.</strong> A full-service impact partner that creates content,
            tracks every dollar, and stays deeply involved with a focused portfolio of grassroots projects
            in South Lombok, Indonesia.
          </p>
        </div>
      </div>
    </section>
  );
}
