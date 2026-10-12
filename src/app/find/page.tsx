import type { Metadata } from "next"
import { Suspense } from "react"
import { FindMp, FindMpWithParams } from "@/components/home/find-mp"
import { Container, PageHeader } from "@/components/tabled/page-header"

export const metadata: Metadata = {
  title: "Find your MP",
  description: "Enter your postal code to find your federal riding and your Member of Parliament.",
  alternates: { canonical: "/find" },
}

export default function FindPage() {
  return (
    <Container>
      <PageHeader title="Find your MP" lede="Enter your postal code to see your federal riding, who represents you in the House of Commons and how they have voted." />
      <div className="mt-10">
        <Suspense fallback={<FindMp />}>
          <FindMpWithParams />
        </Suspense>
      </div>
    </Container>
  )
}
