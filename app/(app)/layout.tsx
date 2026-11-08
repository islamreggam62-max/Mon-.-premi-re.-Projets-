import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { ConnectedShell } from "@/components/store/ConnectedShell";
import { StoreProvider } from "@/lib/store/StoreProvider";

/**
 * Product layout. The data lives on the device (lib/store): the shell waits for
 * it, shows the welcome screen on first launch, then the sidebar, top bar, and page.
 * The interface language (components/i18n) sits inside the store, so switching
 * languages keeps the data loaded.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <LanguageProvider>
        <ConnectedShell>{children}</ConnectedShell>
      </LanguageProvider>
    </StoreProvider>
  );
}
