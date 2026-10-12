import { allMemberParams } from "@/lib/queries"
import { MpView, mpMetadata, type MpParams } from "@/views/mp"

export function generateStaticParams(): MpParams[] {
  return allMemberParams()
}

export async function generateMetadata({ params }: { params: Promise<MpParams> }) {
  const { slug } = await params
  return mpMetadata("fr", slug)
}

export default async function Page({ params }: { params: Promise<MpParams> }) {
  const { slug } = await params
  return <MpView locale="fr" slug={slug} />
}
