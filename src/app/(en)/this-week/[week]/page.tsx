import { activeWeeks, DigestView, digestMetadata } from "@/views/digest"

export function generateStaticParams() {
  return activeWeeks().map((week) => ({ week }))
}

export async function generateMetadata({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params
  return digestMetadata("en", week)
}

export default async function Page({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params
  return <DigestView locale="en" week={week} />
}
