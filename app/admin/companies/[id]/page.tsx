import { notFound } from "next/navigation"
import { CompanyForm } from "~/app/admin/companies/_components/company-form"
import { Wrapper } from "~/components/common/wrapper"
import {
  findCompanyByIdForAdmin,
  findTaxonomyForCompanyAdmin,
} from "~/server/admin/companies/queries"

export default async function ({ params }: PageProps<"/admin/companies/[id]">) {
  const { id } = await params
  const [company, taxonomy] = await Promise.all([
    findCompanyByIdForAdmin(id),
    findTaxonomyForCompanyAdmin(),
  ])

  if (!company) {
    notFound()
  }

  return (
    <Wrapper size="md" gap="sm">
      <CompanyForm title={`Edit ${company.name}`} company={company} taxonomy={taxonomy} />
    </Wrapper>
  )
}
