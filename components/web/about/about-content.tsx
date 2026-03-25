import Image from "next/image"
import grantPortrait from "~/assets/GT.png"
import { Link } from "~/components/common/link"
import { cx } from "~/lib/utils"

const stats = [
  { value: "1000+", label: "Interviews conducted" },
  { value: "130+", label: "Countries reached" },
  { value: "11+", label: "Years of coverage" },
  { value: "2", label: "Active podcasts" },
] as const

const pillars = [
  {
    icon: "◈",
    title: "Impact Directory",
    description:
      "The most comprehensive database of impact-driven companies, social enterprises, and funders in the world. Built to be the Crunchbase of the impact economy.",
  },
  {
    icon: "◉",
    title: "Original Journalism",
    description:
      "In-depth interviews, case studies, and editorial coverage spotlighting the founders and organizations shaping a regenerative economy.",
  },
  {
    icon: "◎",
    title: "Investor Intelligence",
    description:
      "Funding rounds, capital flows, and funder profiles that keep impact investors and founders informed about where capital is moving.",
  },
  {
    icon: "◐",
    title: "Podcasts & Media",
    description:
      "Three active podcasts — Disruptors for GOOD, Investing in Impact, and Tools for Scale — bringing voices from across the global impact ecosystem.",
  },
] as const

const sectionLabel = "text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-6"

const bodyText = "text-[1.05rem] leading-[1.8] text-foreground mb-5 last:mb-0"

export const AboutContent = () => {
  return (
    <main className="mx-auto w-full max-w-215 px-6 py-12 pb-20 text-foreground md:py-16 md:pb-24">
      {/* Word definition */}
      <div className="mb-12 rounded-lg bg-muted/80 px-6 py-6 md:px-7">
        <p className="font-serif text-lg italic text-foreground">causeartist</p>
        <p className="mb-2.5 text-sm text-muted-foreground">[cause-art-ist] · noun</p>
        <p className="text-[0.95rem] leading-relaxed text-secondary-foreground">
          A person who uses their talents and skills to impact the world.
        </p>
      </div>

      <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        About Causeartist
      </p>
      <h1
        className={cx(
          "mb-6 font-serif text-[clamp(2.4rem,5vw,3.6rem)] font-normal leading-[1.15] tracking-[-0.02em] text-pretty text-foreground",
        )}
      >
        Building the world&apos;s most comprehensive database of the{" "}
        <em className="italic text-muted-foreground">impact economy.</em>
      </h1>

      <p className="mb-12 max-w-160 border-l-2 border-border pl-5 text-xl leading-[1.75] text-secondary-foreground">
        Causeartist is a nonprofit media platform and directory dedicated to the founders, funders,
        and organizations building a more sustainable and regenerative world. Founded in 2013,
        we&apos;ve spent over a decade covering the global social entrepreneurship and impact
        investing ecosystem.
      </p>

      <div className="mb-14 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-medium tracking-wide text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
        <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
        Verified Nonprofit · The Causeartist Foundation
      </div>

      <div className="mb-20 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-px overflow-hidden rounded-[10px] border border-border bg-border">
        {stats.map(s => (
          <div key={s.label} className="bg-card px-5 py-6 text-center">
            <div className="mb-1.5 font-display text-[2rem] font-normal leading-none text-foreground">
              {s.value}
            </div>
            <div className="text-xs tracking-wide text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <hr className="mb-14 border-0 border-t border-border" />
      <p className={sectionLabel}>Our story</p>

      <p className={bodyText}>
        When we think of artists, we often picture painters, writers, musicians, or dancers —
        creators who translate a vision into something tangible that endures. Yet there&apos;s
        another kind of artist that rarely gets that recognition: founders.
      </p>
      <p className={bodyText}>
        Like any great artist, founders possess a unique creative vision. They conceive and build
        the companies, tools, and brands that shape our daily lives. They pour years — sometimes
        lifetimes — into bringing an idea to life, transforming abstract conviction into something
        real that changes the world around them.
      </p>

      <blockquote className="my-10 border-l-[3px] border-border py-1 pl-6 font-serif text-[1.35rem] italic leading-snug text-foreground text-pretty">
        &ldquo;It&apos;s this recognition of founders as artists of the business world that inspired
        the name Causeartist.&rdquo;
      </blockquote>

      <p className={bodyText}>
        Our platform celebrates the visionary creators building purposefully — on the canvas of the
        economy, leaving an indelible mark on society and paving the way for a brighter future.
        Since 2013, we&apos;ve conducted over 800 interviews with social entrepreneurs, impact
        investors, and leaders from more than 150 countries.
      </p>

      <hr className="mb-14 mt-14 border-0 border-t border-border" />
      <p className={sectionLabel}>What we&apos;re building</p>

      <p className={bodyText}>
        Causeartist 3.0 is our most significant evolution yet. We&apos;re building the Crunchbase of
        the impact economy — a curated, comprehensive directory of impact-driven companies, social
        enterprises, and funders that makes it easier for investors to find opportunities, founders
        to find peers, researchers to find data, and consumers to find brands they can trust.
      </p>
      <p className={bodyText}>
        Alongside the directory, we continue to produce original journalism, case studies, weekly
        newsletters, and three active podcasts covering every corner of the global impact ecosystem.
      </p>

      <div className="my-8 mb-16 grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-px overflow-hidden rounded-[10px] border border-border bg-border">
        {pillars.map(p => (
          <div key={p.title} className="bg-card p-7 md:p-8">
            <span className="mb-3 block text-lg text-muted-foreground" aria-hidden>
              {p.icon}
            </span>
            <p className="mb-2 text-[0.95rem] font-medium tracking-wide text-foreground">{p.title}</p>
            <p className="text-[0.9rem] leading-[1.65] text-secondary-foreground">{p.description}</p>
          </div>
        ))}
      </div>

      <hr className="mb-14 border-0 border-t border-border" />
      <p className={sectionLabel}>The Causeartist Foundation</p>

      <div className="mb-8 rounded-[10px] border border-border bg-card px-6 py-8 md:px-8">
        <h2 className="mb-3 font-serif text-xl font-normal text-foreground">
          A nonprofit built for the long term
        </h2>
        <p className="mb-5 text-[0.95rem] leading-[1.75] text-secondary-foreground">
          Causeartist is owned and operated by The Causeartist Foundation, a verified nonprofit
          organization. Every dollar of support goes directly back into building the platform —
          expanding the impact directory, funding original journalism, and creating content that
          spotlights impactful founders and companies from around the world.
        </p>
        <Link
          href="/support"
          className="inline-flex items-center gap-1.5 border-b border-border pb-px text-[0.9rem] font-medium text-foreground transition-colors hover:border-foreground"
        >
          Support the Foundation →
        </Link>
      </div>

      <hr className="mb-14 mt-14 border-0 border-t border-border" />
      <p className={sectionLabel}>The founder</p>

      <div className="mb-16 flex flex-col gap-8 rounded-[10px] bg-muted/60 p-6 md:flex-row md:gap-8 md:p-8">
        <div className="relative size-[60px] shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
          <Image
            src={grantPortrait}
            alt="Grant Trahant"
            width={60}
            height={60}
            className="size-full object-cover"
            sizes="60px"
          />
        </div>
        <div className="min-w-0">
          <p className="mb-0.5 text-base font-medium text-foreground">Grant Trahant</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Founder, Causeartist · Executive Director, The Causeartist Foundation
          </p>
          <p className="text-[0.95rem] leading-[1.75] text-foreground">
            Grant founded Causeartist in 2013 with a specific vision: to spotlight founders and
            leaders creating companies that lead to a more sustainable and regenerative business
            future. He curates the weekly Causeartist newsletter and hosts two podcasts —
            Disruptors for GOOD and Investing in Impact. He believes that by
            showcasing the innovations emerging in the impact economy, we can catalyze a global
            movement toward a smarter, more conscious way of doing business.
          </p>
        </div>
      </div>
    </main>
  )
}
