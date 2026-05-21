"use client";

import Image from "next/image";
import { ExternalLink, Mail } from "lucide-react";

const QUICK_LINKS = [
  { label: "Projects", href: "#projects" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "About", href: "/about" },
];

const FOR_DONORS = [
  { label: "Transparency", href: "/dashboard" },
];

export default function Footer() {
  return (
    <footer style={{ background: "#1A7A8A" }} className="text-white">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          {/* Col 1 */}
          <div>
            <Image
              src="/logo.png"
              alt="WaveNova"
              width={200}
              height={56}
              className="mb-4 brightness-0 invert h-12 w-auto"
            />
            <p className="text-white/70 text-sm leading-relaxed mb-3">
              A curated portfolio of grassroots environmental projects in Lombok, Indonesia.
            </p>
            <p className="text-white/50 text-xs">WaveNova Yayasan</p>
            <p className="text-white/50 text-xs">Lombok, Indonesia</p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-white/70 text-sm hover:text-white transition-colors hover:underline"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">For Donors</h4>
            <ul className="space-y-2.5">
              {FOR_DONORS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-white/70 text-sm hover:text-white transition-colors hover:underline"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Stay Connected</h4>
            <a
              href="https://instagram.com/wavenova.ocean"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm mb-3"
            >
              <ExternalLink size={16} />
              @wavenova.ocean (Instagram)
            </a>
            <a
              href="https://www.threads.net/@wavenova.ocean"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm mb-3"
            >
              <ExternalLink size={16} />
              @wavenova.ocean (Threads)
            </a>
            <a
              href="https://x.com/WaveNovaOcean"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm mb-3"
            >
              <ExternalLink size={16} />
              @WaveNovaOcean (X)
            </a>
            <a
              href="mailto:hi@wavenova.org"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
            >
              <Mail size={16} />
              hi@wavenova.org
            </a>
          </div>
        </div>

        <div
          className="border-t border-white/15 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-white/50 text-xs"
        >
          <p>© 2026 WaveNova Yayasan. All donations are project-tagged and publicly reported.</p>
          <p className="text-center sm:text-right">
            Lombok, Indonesia · Yayasan (Indonesian Nonprofit Foundation)
          </p>
        </div>
      </div>
    </footer>
  );
}
