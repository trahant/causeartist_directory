import PlausibleProvider from "next-plausible"
import { type PropsWithChildren, Suspense } from "react"
import { QueryProvider } from "~/components/common/providers/query-provider"
import { Wrapper } from "~/components/common/wrapper"
import { AdBanner } from "~/components/web/ads/ad-banner"
import { Footer } from "~/components/web/footer"
import { Header } from "~/components/web/header"
import { QueryProvider } from "~/components/web/providers/query-provider"
import { Backdrop } from "~/components/web/ui/backdrop"
import { Container } from "~/components/web/ui/container"
import { env } from "~/env"

export default function ({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
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
      </PlausibleProvider>
    </QueryProvider>
  )
}
