import { ScrapbookHome } from "@/components/scrapbook/scrapbook-home";
import { ScrapbookProvider } from "@/components/scrapbook/scrapbook-provider";

export default function Page() {
  return (
    <ScrapbookProvider>
      <ScrapbookHome />
    </ScrapbookProvider>
  );
}
