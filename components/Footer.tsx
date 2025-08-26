import { Github, Twitter, Mail, ArrowRight } from "lucide-react"

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-black text-white font-bitcount-prop">
      {/* background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -inset-40" style={{
          background:
            "radial-gradient(1000px 600px at 0% 0%, rgba(124,58,237,0.25) 0%, transparent 60%), radial-gradient(900px 520px at 120% 120%, rgba(56,189,248,0.2) 0%, transparent 65%)",
          filter: "blur(20px)",
        }} />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 md:px-10 py-7">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-3">
            <h3 className="font-bitcount-prop text-2xl">AURI</h3>
            <p className="text-sm text-white/70 max-w-xs">Clean, fast, and secure. Wallets, vaults, and live insights with a modern experience.</p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" aria-label="Twitter" className="rounded-full border border-white/15 bg-white/5 p-2 hover:bg-white/10 transition-colors"><Twitter className="size-4" /></a>
              <a href="#" aria-label="Github" className="rounded-full border border-white/15 bg-white/5 p-2 hover:bg-white/10 transition-colors"><Github className="size-4" /></a>
              <a href="#" aria-label="Mail" className="rounded-full border border-white/15 bg-white/5 p-2 hover:bg-white/10 transition-colors"><Mail className="size-4" /></a>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white/90">Product</h4>
            <ul className="space-y-2 text-sm text-white/75">
              <li><a href="#" className="hover:text-white">Features</a></li>
              <li><a href="#" className="hover:text-white">How it works</a></li>
              <li><a href="#" className="hover:text-white">Dashboard</a></li>
              <li><a href="#" className="hover:text-white">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white/90">Resources</h4>
            <ul className="space-y-2 text-sm text-white/75">
              <li><a href="#" className="hover:text-white">Docs</a></li>
              <li><a href="#" className="hover:text-white">API</a></li>
              <li><a href="#" className="hover:text-white">Guides</a></li>
              <li><a href="#" className="hover:text-white">Status</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white/90">Stay updated</h4>
            <form className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none"
              />
              <button type="submit" className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 hover:bg-white/15 transition-colors">
                <ArrowRight className="size-4" />
              </button>
            </form>
            <p className="mt-2 text-[11px] text-white/60">No spam. Opt-out anytime.</p>
          </div>
        </div>

        <div className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="mt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <p>© {new Date().getFullYear()} AURI. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}


