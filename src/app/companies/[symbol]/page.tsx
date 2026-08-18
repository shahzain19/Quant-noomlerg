import { CompanyDetail } from "@/components/company/company-detail";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return <CompanyDetail symbol={symbol.toUpperCase()} />;
}
