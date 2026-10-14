import { ReportView, reportMetadata } from "@/views/report"

export const metadata = reportMetadata("en")

export default function Page() {
  return <ReportView locale="en" />
}
