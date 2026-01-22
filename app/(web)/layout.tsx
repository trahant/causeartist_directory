import PlausibleProvider from "next-plausible"
import { type PropsWithChildren, Suspense } from "react"
import { Wrapper } from "~/components/common/wrapper"
import { AdBanner } from "~/components/web/ads/ad-banner"
import { Bottom } from "~/components/web/bottom"
import { FeedbackWidget } from "~/components/web/feedback-widget"
import { Footer } from "~/components/web/footer"
import { Header } from "~/components/web/header"
import { Backdrop } from "~/components/web/ui/backdrop"
import { Container } from "~/components/web/ui/container"
import { siteConfig } from "~/config/site"
import { env } from "~/env"

export default function ({ children }: PropsWithChildren) {
  return (
    <PlausibleProvider
      domain={env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
      customDomain={env.NEXT_PUBLIC_PLAUSIBLE_URL}
    >
      <div className="flex flex-col min-h-dvh overflow-clip pt-(--header-inner-offset)">
        <Header />

        <Backdrop isFixed />

        <Suspense>
          <AdBanner />
        </Suspense>

        <Container asChild>
          <Wrapper className="grow py-fluid-md">
            {children}

            <Footer />
          </Wrapper>
        </Container>
      </div>

      <Bottom />

      <FeedbackWidget />
    </PlausibleProvider>
  )
}
