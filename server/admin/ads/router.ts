import { after } from "next/server"
import { removeS3Directories } from "~/lib/media"
import { withAdmin } from "~/lib/orpc"
import { findAds } from "~/server/admin/ads/queries"
import { adListSchema, adSchema } from "~/server/admin/ads/schema"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"

const list = withAdmin.input(adListSchema).handler(async ({ input }) => {
  return findAds(input)
})

const upsert = withAdmin.input(adSchema).handler(async ({ input, context: { db, revalidate } }) => {
  const { id, ...data } = input

  const ad = await db.ad.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  })

  revalidate({
    tags: ["ads"],
  })

  return ad
})

const duplicate = withAdmin
  .input(idSchema)
  .handler(async ({ input: { id }, context: { db, revalidate } }) => {
    const ad = await db.ad.findUnique({
      where: { id },
    })

    if (!ad) {
      throw new Error("Ad not found")
    }

    const newAd = await db.ad.create({
      data: {
        name: `${ad.name} (Copy)`,
        email: ad.email,
        description: ad.description,
        websiteUrl: ad.websiteUrl,
        faviconUrl: ad.faviconUrl,
        bannerUrl: ad.bannerUrl,
        buttonLabel: ad.buttonLabel,
        type: ad.type,
        startsAt: ad.startsAt,
        endsAt: ad.endsAt,
      },
    })

    revalidate({
      tags: ["ads"],
    })

    return newAd
  })

const remove = withAdmin
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    await db.ad.deleteMany({
      where: { id: { in: ids } },
    })

    after(async () => {
      await removeS3Directories(ids.map(id => `ads/${id}`))
    })

    revalidate({
      tags: ["ads"],
    })

    return true
  })

export const adRouter = {
  list,
  upsert,
  duplicate,
  remove,
}
