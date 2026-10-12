export const SITE_NAME = "Tabled"
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tabled-ca.vercel.app"
export const REPO_URL = "https://github.com/yasher3413/tabled"
export const SITE_DESCRIPTION =
  "Every federal bill, recorded House vote and MP in the Parliament of Canada, explained in plain English."

export function reportErrorUrl(subject: string, pageUrl: string) {
  const params = new URLSearchParams({
    title: `Error report: ${subject}`,
    body: `Page: ${pageUrl}\n\nWhat is wrong:\n\nWhere the correct information can be found:\n`,
  })
  return `${REPO_URL}/issues/new?${params}`
}
