import PlausibleProvider from "next-plausible"
import { type PropsWithChildren, Suspense } from "react"
import { Wrapper } from "~/components/common/wrapper"
import { AdBanner } from "~/components/web/ads/ad-banner"
import { Footer } from "~/components/web/footer"
import { FooterDirectoryDiscovery } from "~/components/web/footer-directory-discovery"
import { AuthErrorBanner } from "~/components/web/auth/auth-error-banner"
import { Header } from "~/components/web/header"
import { Container } from "~/components/web/ui/container"
import { env } from "~/env"

const plausibleDomain = env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
const plausibleUrl = env.NEXT_PUBLIC_PLAUSIBLE_URL

export default function ({ children }: PropsWithChildren) {
  const content = (
      <div className="flex flex-col min-h-dvh overflow-clip pt-(--header-inner-offset)">
        <Header />

        <Suspense>
          <AdBanner />
        </Suspense>

        <Container asChild>
          <Wrapper className="grow py-fluid-md">
            <Suspense fallback={null}>
              <AuthErrorBanner />
            </Suspense>

            {children}

            <Footer>
              <Suspense fallback={null}>
                <FooterDirectoryDiscovery />
              </Suspense>
            </Footer>
          </Wrapper>
        </Container>
      </div>
  )

  if (plausibleDomain && plausibleUrl) {
    return (
      <PlausibleProvider domain={plausibleDomain} customDomain={plausibleUrl}>
        {content}
      </PlausibleProvider>
    )
  }

  return content
}
