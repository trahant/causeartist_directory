import { db } from "~/services/db"

type Entry = { name: string; website: string | null }

function slugFromName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
}

function logoUrlFromWebsite(website: string | null): string | null {
  if (!website) return null
  try {
    const domain = new URL(website).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  } catch {
    return null
  }
}

const assetManagers: Entry[] = [
  { name: "57 Stars", website: "https://www.57stars.com" },
  { name: "ABC Impact", website: "https://www.abcimpact.com" },
  { name: "ABN AMRO Bank N.V.", website: "https://www.abnamro.com" },
  { name: "Accial Capital", website: "https://www.accialcapital.com" },
  { name: "Accion", website: "https://www.accion.org" },
  { name: "Achmea Investment Management", website: "https://www.achmea.nl" },
  { name: "Actis", website: "https://www.act.is" },
  { name: "Acumen", website: "https://acumen.org" },
  { name: "Adenia Partners", website: "https://www.adeniapartners.com" },
  { name: "Advance Global Capital Ltd", website: "https://www.advanceglobalcapital.com" },
  { name: "AFIG Funds", website: "https://www.afigfunds.com" },
  { name: "African Alliance", website: "https://www.africanalliance.com" },
  { name: "AfricInvest", website: "https://www.africinvest.com" },
  { name: "Agroempresa Forestal", website: null },
  { name: "AiiM Partners", website: "https://www.aiimpartners.com" },
  { name: "Alcazar Energy", website: "https://www.alcazarenergy.com" },
  { name: "Allianz Global Investors", website: "https://www.allianzgi.com" },
  { name: "ALMA Sustainable Finance", website: null },
  { name: "American Heart Association Social Impact Funds", website: "https://www.heart.org" },
  { name: "Amundi", website: "https://www.amundi.com" },
  { name: "Angelini Ventures", website: "https://www.angeliniventures.com" },
  { name: "Apollo Global Management", website: "https://www.apollo.com" },
  { name: "Archipelago Ventures Ltd", website: null },
  { name: "Ashburton Investments", website: "https://www.ashburtoninvestments.com" },
  { name: "Ashmore Group", website: "https://www.ashmoregroup.com" },
  { name: "Asia Green Fund", website: "https://www.asiagreenfund.com" },
  { name: "ASN Impact Investors", website: "https://www.asnbank.nl" },
  { name: "Asteria IM", website: "https://www.asteriaim.com" },
  { name: "Athar Investment Fund", website: null },
  { name: "Avaana Capital", website: "https://www.avaana.in" },
  { name: "Aviva Investors", website: "https://www.avivainvestors.com" },
  { name: "AXA Investment Managers", website: "https://www.axa-im.com" },
  { name: "Baillie Gifford", website: "https://www.bailliegifford.com" },
  { name: "Bain Capital Double Impact", website: "https://www.baincapital.com" },
  { name: "Better Society Capital", website: "https://bettersocietycapital.com" },
  { name: "Beyond Impact", website: "https://www.beyondimpact.com" },
  { name: "BlackRock", website: "https://www.blackrock.com" },
  { name: "Blue Earth Capital AG", website: "https://www.blueearthcapital.com" },
  { name: "Blue like an Orange Sustainable Capital", website: "https://www.bluelikeanorange.com" },
  { name: "BlueOrchard Finance S.A", website: "https://www.blueorchard.com" },
  { name: "Bootstrap Europe", website: "https://www.bootstrap-europe.eu" },
  { name: "Brawn Capital Management Singapore", website: null },
  { name: "Bregal Sphere", website: "https://www.bregalsphere.com" },
  { name: "Bridges Fund Management", website: "https://www.bridgesfundmanagement.com" },
  { name: "BrightEdge", website: "https://brightedge.org" },
  { name: "Calvert Impact", website: "https://calvertimpact.org" },
  { name: "Camco Clean Energy", website: "https://www.camcocleanenergy.com" },
  { name: "Cardano Development", website: "https://www.cardanodevelopment.com" },
  { name: "Catalyst Fund", website: "https://www.thecatalystfund.net" },
  { name: "Cauris Finance", website: null },
  { name: "Civitas Investment Management Limited", website: null },
  { name: "ClearBridge Investments", website: "https://www.clearbridge.com" },
  { name: "ClearSky", website: "https://www.clearskyllc.com" },
  { name: "Climate Asset Management", website: "https://www.climateam.com" },
  { name: "Climate Fund Managers", website: "https://www.climatefundmanagers.com" },
  { name: "Colesco Capital", website: null },
  { name: "Columbia Threadneedle Investments", website: "https://www.columbiathreadneedle.com" },
  { name: "Community Investment Management", website: "https://www.cim.vc" },
  { name: "Connectivity Capital", website: null },
  { name: "Conservation Resources", website: "https://www.conservationresources.org" },
  { name: "Convergence Partners", website: "https://www.convergencepartners.com" },
  { name: "Corbin Capital Partners", website: "https://www.corbincapital.com" },
  { name: "Creation Investments Capital Management", website: "https://www.creationinvestments.com" },
  { name: "CrossBoundary", website: "https://www.crossboundary.com" },
  { name: "Cygnum Capital Group", website: null },
  { name: "D3 Jubilee Partners", website: null },
  { name: "DAI Asset Management", website: "https://www.dai.com" },
  { name: "Deetken Impact", website: "https://www.deetkenimpact.com" },
  { name: "Developing World Markets", website: "https://www.developingworldmarkets.com" },
  { name: "Development Partners International", website: "https://www.dpi-llp.com" },
  { name: "EBG Investment Solutions", website: null },
  { name: "EcoEnterprises Fund", website: "https://www.ecoenterprisesfund.com" },
  { name: "EFM Investments & Advisory", website: null },
  { name: "Elevar Equity", website: "https://www.elevarequity.com" },
  { name: "Enabling Qapital", website: "https://www.enablingqapital.com" },
  { name: "Enhanced Capital", website: "https://www.enhancedcapital.com" },
  { name: "Enterprise Community Partners", website: "https://www.enterprisecommunity.org" },
  { name: "EQT", website: "https://www.eqtgroup.com" },
  { name: "Eurazeo", website: "https://www.eurazeo.com" },
  { name: "Finance in Motion", website: "https://www.finance-in-motion.com" },
  { name: "FINCA International", website: "https://www.finca.org" },
  { name: "Forbion", website: "https://www.forbion.com" },
  { name: "Franklin Templeton", website: "https://www.franklintempleton.com" },
  { name: "FS Impact Finance", website: null },
  { name: "GAWA Capital", website: "https://www.gawacapital.com" },
  { name: "GCM Grosvenor", website: "https://www.gcmgrosvenor.com" },
  { name: "GEF Capital Partners", website: "https://www.gefcapital.com" },
  { name: "Gilde Healthcare Partners", website: "https://www.gildehealthcare.com" },
  { name: "GLIN Impact Capital", website: null },
  { name: "Global Health Investment Corporation", website: "https://www.ghic.world" },
  { name: "Global Innovation Fund", website: "https://www.globalinnovation.fund" },
  { name: "Global Social Impact Investments", website: null },
  { name: "Goldman Sachs Asset Management", website: "https://www.gsam.com" },
  { name: "Handelsbanken Fonder AB", website: "https://www.handelsbanken.se" },
  { name: "HCAP Partners", website: "https://www.hcapllc.com" },
  { name: "Heartwood Trust", website: null },
  { name: "Helios Investment Partners", website: "https://www.heliosinvestment.com" },
  { name: "HSBC Asset Management", website: "https://www.assetmanagement.hsbc.com" },
  { name: "Idealist Capital", website: null },
  { name: "IDH Investment Management", website: "https://www.idhsustainabletrade.com" },
  { name: "IMPact SGR", website: "https://www.impactsgr.it" },
  { name: "ImpactA Global Limited", website: null },
  { name: "ImpactAssets Capital Partners", website: "https://www.impactassets.org" },
  { name: "Incofin Investment Management", website: "https://www.incofin.com" },
  { name: "Infranity", website: "https://www.infranity.com" },
  { name: "INOKS Capital", website: "https://www.inoks.com" },
  { name: "InPact Switzerland SA", website: null },
  { name: "Insitor Partners", website: "https://www.insitorpartners.com" },
  { name: "Intermediate Capital Group", website: "https://www.icgam.com" },
  { name: "International Farming", website: null },
  { name: "Investisseurs & Partenaires", website: "https://www.ietp.com" },
  { name: "Jolt Capital SAS", website: "https://www.jolt-capital.com" },
  { name: "Jonathan Rose Companies", website: "https://www.rose.com" },
  { name: "Jordan Park", website: "https://www.jordanpark.com" },
  { name: "Kartesia Management SARL", website: "https://www.kartesia.com" },
  { name: "Kiva", website: "https://www.kiva.org" },
  { name: "KKR", website: "https://www.kkr.com" },
  { name: "KOIS", website: "https://www.kois.be" },
  { name: "Kuramo Capital Management", website: "https://www.kuramocapital.com" },
  { name: "LeapFrog Investments", website: "https://www.leapfroginvest.com" },
  { name: "Lendable", website: "https://www.lendable.io" },
  { name: "LGT Capital Partners", website: "https://www.lgtcp.com" },
  { name: "Lightrock", website: "https://www.lightrock.com" },
  { name: "Lok Capital", website: "https://www.lokcapital.com" },
  { name: "M&G Investments", website: "https://www.mandg.com" },
  { name: "Macquarie Asset Management", website: "https://www.macquarie.com" },
  { name: "Maycomb Capital", website: "https://www.maycombcapital.com" },
  { name: "Medical Credit Fund Kenya", website: null },
  { name: "Mediterrania Capital Partners", website: "https://www.mediterrania.com" },
  { name: "Mekong Capital", website: "https://www.mekongcapital.com" },
  { name: "Mirova", website: "https://www.mirova.com" },
  { name: "MK Global Kapital", website: null },
  { name: "Moreva Capital", website: null },
  { name: "MUFG Asset Management", website: "https://www.mufgam.co.jp" },
  { name: "National Community Investment Fund", website: "https://www.ncif.org" },
  { name: "Nephila", website: "https://www.nephila.com" },
  { name: "Neuberger Berman", website: "https://www.nb.com" },
  { name: "New Forests", website: "https://www.newforests.com.au" },
  { name: "New Ventures", website: "https://www.new-ventures.org" },
  { name: "Newmarket Capital", website: "https://www.newmarketcapital.com" },
  { name: "Next Billion Capital Partners", website: null },
  { name: "NEXT Generation Invest AG", website: null },
  { name: "Nissay Asset Management", website: "https://www.nam.co.jp" },
  { name: "Nordea Asset Management", website: "https://www.nordea.com" },
  { name: "Norsad Capital", website: "https://www.norsad.com" },
  { name: "Nuveen", website: "https://www.nuveen.com" },
  { name: "Octobre", website: null },
  { name: "Oikocredit", website: "https://www.oikocredit.coop" },
  { name: "Old Mutual Alternative Investments", website: "https://www.oldmutual.com" },
  { name: "Omnivore Capital Management Advisors", website: "https://www.omnivore.vc" },
  { name: "Palladium Equity Partners", website: "https://www.palladiumequity.com" },
  { name: "Patamar Capital", website: "https://www.patamar.com" },
  { name: "Pharos Capital Group", website: "https://www.pharoscapital.com" },
  { name: "Q-Impact", website: null },
  { name: "Quadria Capital Investment Management", website: "https://www.quadriacapital.com" },
  { name: "Quona Capital", website: "https://www.quona.com" },
  { name: "RAISE Impact", website: "https://www.raise-impact.com" },
  { name: "Rally Assets", website: "https://www.rallyassets.com" },
  { name: "Raven Indigenous Outcomes Funds", website: "https://www.ravenif.com" },
  { name: "RBC Global Asset Management", website: "https://www.rbcgam.com" },
  { name: "Record Currency Management", website: "https://www.recordcm.com" },
  { name: "Regnan", website: "https://www.regnan.com" },
  { name: "responsAbility Investments AG", website: "https://www.responsability.com" },
  { name: "Revelstoke Capital Partners", website: "https://www.revelstokecp.com" },
  { name: "Rivage Investment SAS", website: "https://www.rivage.eu" },
  { name: "Root Capital", website: "https://www.rootcapital.org" },
  { name: "Sarona Asset Management", website: "https://www.saronaasset.com" },
  { name: "Save the Children Global Ventures", website: "https://www.savethechildren.org" },
  { name: "Schroders", website: "https://www.schroders.com" },
  { name: "SDS Capital Group", website: "https://www.sdscapitalgroup.com" },
  { name: "Simpact Ventures", website: null },
  { name: "SJF Ventures", website: "https://www.sjfventures.com" },
  { name: "Social Impact Investment Fund Pioneer", website: null },
  { name: "Sogécapital Gestion", website: null },
  { name: "Solum Partners", website: null },
  { name: "SP Ventures", website: "https://www.spventures.com.br" },
  { name: "Stray Dog Capital", website: "https://www.straydogcapital.com" },
  { name: "Summa Equity", website: "https://www.summaequity.com" },
  { name: "Summit Africa", website: null },
  { name: "SUSI Partners", website: "https://www.susi-partners.com" },
  { name: "SWEN Capital Partners", website: "https://www.swencap.com" },
  { name: "Sycomore Asset Management", website: "https://www.sycomore-am.com" },
  { name: "Sygnus Group", website: "https://www.sygnusgroup.com" },
  { name: "Symbiotics Group SA", website: "https://www.symbioticsgroup.com" },
  { name: "T. Rowe Price", website: "https://www.troweprice.com" },
  { name: "Talanton Impact Fund", website: null },
  { name: "The Conservation Fund", website: "https://www.conservationfund.org" },
  { name: "The Rise Fund", website: "https://www.therisefund.com" },
  { name: "The Vistria Group", website: "https://www.vistria.com" },
  { name: "ThirdWay Partners", website: null },
  { name: "Tikehau Capital", website: "https://www.tikehaucapital.com" },
  { name: "Total Impact Capital", website: "https://www.totalimpactcapital.com" },
  { name: "TowerBrook Capital Partners", website: "https://www.towerbrook.com" },
  { name: "TriLinc Global", website: "https://www.trilinc.com" },
  { name: "Trill Impact", website: "https://www.trillimpact.com" },
  { name: "Triodos Investment Management", website: "https://www.triodos-im.com" },
  { name: "Triple Jump", website: "https://www.triplejump.eu" },
  { name: "Triple P Advisory", website: null },
  { name: "Turner Impact Capital", website: "https://www.turnerimpactcapital.com" },
  { name: "Ultra Capital LLC", website: "https://www.ultracapital.com" },
  { name: "Unovis Asset Management", website: "https://www.unovis.vc" },
  { name: "Variant Investments", website: null },
  { name: "VentureWave Capital", website: "https://www.venturewavecapital.com" },
  { name: "Victory Hill Capital Partners", website: "https://www.victoryhillcapital.com" },
  { name: "Vidia GmbH", website: null },
  { name: "Village Capital", website: "https://vilcap.com" },
  { name: "Wellington Management", website: "https://www.wellington.com" },
  { name: "Westfuller", website: null },
  { name: "World Education Services", website: "https://www.wes.org" },
  { name: "Yunus Social Business Funds", website: "https://www.yunussb.com" },
]

const assetOwners: Entry[] = [
  { name: "Aegon Investment Management", website: "https://www.aegon.com" },
  { name: "Africa50", website: "https://www.africa50.com" },
  { name: "Anthos Fund & Asset Management", website: "https://www.anthos.com" },
  { name: "APG Asset Management", website: "https://www.apg.nl" },
  { name: "Asian Development Bank", website: "https://www.adb.org" },
  { name: "Australian Ethical", website: "https://www.australianethical.com.au" },
  { name: "Bank of America", website: "https://www.bankofamerica.com" },
  { name: "Bank of Palestine", website: "https://www.bankofpalestine.com" },
  { name: "Bertelsmann Stiftung", website: "https://www.bertelsmann-stiftung.de" },
  { name: "Blue Haven Initiative", website: "https://www.bluehaveninitiative.com" },
  { name: "Bpifrance", website: "https://www.bpifrance.fr" },
  { name: "British International Investment", website: "https://www.bii.co.uk" },
  { name: "Builders Initiative", website: "https://www.buildersinitiative.org" },
  { name: "Capricorn Investment Group", website: "https://www.capricornllc.com" },
  { name: "Ceniarth LLC", website: "https://www.ceniarth.com" },
  { name: "Citi", website: "https://www.citi.com" },
  { name: "Common Fund for Commodities", website: "https://www.common-fund.org" },
  { name: "FinDev Canada", website: "https://www.findevcanada.ca" },
  { name: "Finnfund", website: "https://www.finnfund.fi" },
  { name: "FMO", website: "https://www.fmo.nl" },
  { name: "Ford Foundation", website: "https://www.fordfoundation.org" },
  { name: "Global Alliance for Improved Nutrition", website: "https://www.gainhealth.org" },
  { name: "Green Climate Fund", website: "https://www.greenclimate.fund" },
  { name: "IDB Invest", website: "https://www.idbinvest.org" },
  { name: "IKEA Foundation", website: "https://www.ikeafoundation.org" },
  { name: "International Finance Corporation", website: "https://www.ifc.org" },
  { name: "JP Morgan Chase & Co.", website: "https://www.jpmorgan.com" },
  { name: "John D. and Catherine T. MacArthur Foundation", website: "https://www.macfound.org" },
  { name: "Liberty Mutual Insurance Group", website: "https://www.libertymutual.com" },
  { name: "Margaret A. Cargill Philanthropies", website: "https://www.macphilanthropies.org" },
  { name: "MassMutual", website: "https://www.massmutual.com" },
  { name: "Minderoo Foundation", website: "https://www.minderoo.org" },
  { name: "Morgan Stanley", website: "https://www.morganstanley.com" },
  { name: "Norfund", website: "https://www.norfund.no" },
  { name: "PGGM Investments", website: "https://www.pggm.nl" },
  { name: "Pharo Foundation", website: "https://www.pharofoundation.org" },
  { name: "Pictet Group", website: "https://www.pictet.com" },
  { name: "Prudential", website: "https://www.prudential.com" },
  { name: "Realdania", website: "https://www.realdania.dk" },
  { name: "Shell Foundation", website: "https://www.shellfoundation.org" },
  { name: "Skoll Foundation", website: "https://skoll.org" },
  { name: "Sobrato Family Foundation", website: "https://www.sobrato.com" },
  { name: "Soros Economic Development Fund", website: "https://www.opensocietyfoundations.org" },
  { name: "Surdna Foundation", website: "https://www.surdna.org" },
  { name: "Swedfund", website: "https://www.swedfund.se" },
  { name: "Temasek", website: "https://www.temasek.com.sg" },
  { name: "The Annie E. Casey Foundation", website: "https://www.aecf.org" },
  { name: "The California Endowment", website: "https://www.calendow.org" },
  { name: "The Colorado Health Foundation", website: "https://www.coloradohealth.org" },
  { name: "The David and Lucile Packard Foundation", website: "https://www.packard.org" },
  { name: "The Kresge Foundation", website: "https://kresge.org" },
  { name: "The Nathan Cummings Foundation", website: "https://www.nathancummings.org" },
  { name: "The Rockefeller Foundation", website: "https://www.rockefellerfoundation.org" },
  { name: "UBS", website: "https://www.ubs.com" },
  { name: "Visa Foundation", website: "https://www.visafoundation.org" },
  { name: "W.K. Kellogg Foundation", website: "https://www.wkkf.org" },
  { name: "WHO Foundation", website: "https://www.who.int" },
  { name: "Zurich Insurance Group", website: "https://www.zurich.com" },
]

type Batch = "asset-managers" | "asset-owners"

type ErrorEntry = {
  batch: Batch
  name: string
  slug: string
  error: unknown
}

function formatErrorShort(e: unknown) {
  if (e instanceof Error) return e.message
  if (typeof e === "string") return e
  try {
    return JSON.stringify(e)
  } catch {
    return String(e)
  }
}

async function upsertGiinMember(
  entry: Entry,
  type: "impact-fund" | "foundation",
): Promise<"created" | "updated"> {
  const slug = slugFromName(entry.name)
  const website = entry.website
  const logoUrl = logoUrlFromWebsite(website)

  const existing = await db.funder.findUnique({
    where: { slug },
    select: { id: true },
  })

  await db.funder.upsert({
    where: { slug },
    update: { website, logoUrl, type },
    create: {
      name: entry.name,
      slug,
      status: "draft",
      type,
      website,
      logoUrl,
    },
  })

  return existing ? "updated" : "created"
}

async function main() {
  let assetManagersCreated = 0
  let assetManagersUpdated = 0
  let assetOwnersCreated = 0
  let assetOwnersUpdated = 0
  const errors: ErrorEntry[] = []

  for (const entry of assetManagers) {
    const slug = slugFromName(entry.name)
    try {
      const result = await upsertGiinMember(entry, "impact-fund")
      if (result === "created") assetManagersCreated++
      else assetManagersUpdated++
      console.log(`✓ ${entry.name}`)
    } catch (e) {
      errors.push({ batch: "asset-managers", name: entry.name, slug, error: e })
      console.error(`Failed: ${entry.name} (${slug})`)
      console.error(formatErrorShort(e))
    }
  }

  for (const entry of assetOwners) {
    const slug = slugFromName(entry.name)
    try {
      const result = await upsertGiinMember(entry, "foundation")
      if (result === "created") assetOwnersCreated++
      else assetOwnersUpdated++
      console.log(`✓ ${entry.name}`)
    } catch (e) {
      errors.push({ batch: "asset-owners", name: entry.name, slug, error: e })
      console.error(`Failed: ${entry.name} (${slug})`)
      console.error(formatErrorShort(e))
    }
  }

  const totalProcessed =
    assetManagersCreated +
    assetManagersUpdated +
    assetOwnersCreated +
    assetOwnersUpdated

  console.log("\n--- Summary ---")
  console.log("Asset managers created:", assetManagersCreated)
  console.log("Asset managers updated (already existed):", assetManagersUpdated)
  console.log("Asset owners created:", assetOwnersCreated)
  console.log("Asset owners updated (already existed):", assetOwnersUpdated)
  console.log("Total processed:", totalProcessed)
  console.log("Errors:", errors.length)

  if (errors.length > 0) {
    console.log("\n--- Errors (details) ---")
    for (const err of errors) {
      console.log(`[${err.batch}] ${err.name} (${err.slug})`)
      console.log(formatErrorShort(err.error))
    }
  }
}

main()
  .catch(e => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
