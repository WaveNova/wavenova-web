const STORIES = [
  {
    title: "Chapter 1: The Blue Loop — Where It All Started",
    category: "Station Startups",
    time: "8 min read",
    image: "https://images.unsplash.com/photo-1582721478779-0ae163c05a60?w=800&q=70",
    featured: true,
  },
  {
    title: "The Economics of Waste: 2,000 IDR per KG",
    category: "The Economics",
    time: "5 min read",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=70",
  },
  {
    title: "Meet Eco Mawun: The Team Behind Two New Stations",
    category: "Local Heroes",
    time: "6 min read",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=70",
  },
  {
    title: "Reality Check: What We Still Need to Scale",
    category: "Reality Checks",
    time: "4 min read",
    image: "https://images.unsplash.com/photo-1473625247510-8ceb1760943f?w=600&q=70",
  },
];

const CATEGORY_COLORS: Record<string, { backgroundColor: string; color: string }> = {
  "Station Startups": { backgroundColor: "#EDF9FB", color: "#1A7A8A" },
  "The Economics": { backgroundColor: "#FEF3C7", color: "#92400E" },
  "Local Heroes": { backgroundColor: "#D1FAE5", color: "#065F46" },
  "Reality Checks": { backgroundColor: "#FEE2E2", color: "#991B1B" },
};

export default function Stories() {
  const featured = STORIES[0];
  const rest = STORIES.slice(1);

  return (
    <section id="stories" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2
            className="font-[var(--font-dm-serif)] text-4xl mb-2"
            style={{ color: "#1A7A8A" }}
          >
            Behind the Wave
          </h2>
          <p className="text-[#6B7280] text-lg">The stories behind the impact.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Featured large card */}
          <div className="md:row-span-2 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] group cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-shadow">
            <div className="relative h-64 md:h-72 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featured.image}
                alt={featured.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium inline-block mb-2"
                  style={
                    CATEGORY_COLORS[featured.category] || {
                      backgroundColor: "#EDF9FB",
                      color: "#1A7A8A",
                    }
                  }
                >
                  {featured.category}
                </span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-xl text-[#1F2937] mb-2 leading-snug">
                {featured.title}
              </h3>
              <p className="text-[#6B7280] text-sm">{featured.time}</p>
              <a
                href="/stories"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: "#24B5CB" }}
              >
                Read Story →
              </a>
            </div>
          </div>

          {/* Smaller cards */}
          {rest.map((story, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] group cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-shadow flex"
            >
              <div className="relative w-32 flex-shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 flex flex-col justify-between">
                <div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium inline-block mb-2"
                    style={
                      CATEGORY_COLORS[story.category] || {
                        backgroundColor: "#EDF9FB",
                        color: "#1A7A8A",
                      }
                    }
                  >
                    {story.category}
                  </span>
                  <h3 className="font-semibold text-sm text-[#1F2937] leading-snug">{story.title}</h3>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[#6B7280] text-xs">{story.time}</span>
                  <a
                    href="/stories"
                    className="text-xs font-semibold"
                    style={{ color: "#24B5CB" }}
                  >
                    Read →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="/stories"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border"
            style={{ borderColor: "#24B5CB", color: "#24B5CB" }}
          >
            See All Stories →
          </a>
        </div>
      </div>
    </section>
  );
}
