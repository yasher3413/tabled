import { ReportView, reportMetadata } from "@/views/report"

export const metadata = reportMetadata("fr")

export default function Page() {
  return <ReportView locale="fr" />
}
