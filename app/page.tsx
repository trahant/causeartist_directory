import WebLayout from "~/app/(web)/layout"
import { HomeContent } from "~/app/(web)/(home)/home-content"

export default async function RootPage(props: PageProps<"/">) {
  return (
    <WebLayout>
      <HomeContent searchParams={props.searchParams} />
    </WebLayout>
  )
}
