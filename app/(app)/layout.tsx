import { ConnectedShell } from "@/components/store/ConnectedShell";
import { StoreProvider } from "@/lib/store/StoreProvider";

/**
 * Product layout. The data lives on the device (lib/store): the shell waits for
 * it, shows the welcome screen on first launch, then the sidebar, top bar, and page.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ConnectedShell>{children}</ConnectedShell>
    </StoreProvider>
  );
}
