import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";
import { AccountFooter } from "./account-footer";

/**
 * Console sidebar (236px) — brand, nav, account footer.
 * Reference: theme.css `.side`.
 */
export function Sidebar({ userId }: { userId?: string }) {
  const base = userId ? `/dashboard/${userId}` : "/dashboard";

  return (
    <aside className="flex w-[236px] flex-none flex-col border-r border-border bg-background px-3.5 py-[18px]">
      <Brand href={base} />
      <SidebarNav userId={userId} only="workspace" className="mt-[22px]" />
      <div className="mt-auto flex flex-col gap-3">
        <SidebarNav userId={userId} only="account" />
        <AccountFooter userId={userId} />
      </div>
    </aside>
  );
}

export default Sidebar;
