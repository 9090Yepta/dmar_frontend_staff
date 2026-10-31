import { Link, useRouterState } from "@tanstack/react-router";
import { LuClipboardList, LuHouse, LuUserRound } from "react-icons/lu";

const items = [
  { to: "/admin/foremen" as const, label: "Home", Icon: LuHouse },
  { to: "/admin/foremen/history" as const, label: "Riwayat", Icon: LuClipboardList },
  { to: "/admin/foremen/account" as const, label: "Account", Icon: LuUserRound },
];

export function ForemanNavigation() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <>
      <nav className="mb-5 hidden items-center gap-2 rounded-box border border-base-300 bg-base-100 p-2 shadow-sm md:flex" aria-label="Navigasi foreman">
        {items.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to} activeOptions={{ exact: true }} className={`btn btn-sm ${active ? "btn-primary" : "btn-ghost"}`} aria-current={active ? "page" : undefined}>
              <Icon className="size-4" aria-hidden="true" />{label}
            </Link>
          );
        })}
      </nav>
      <nav className="dock dock-md fixed inset-x-0 bottom-0 z-50 border-t border-base-300 bg-base-100/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden" aria-label="Navigasi foreman">
        {items.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to} activeOptions={{ exact: true }} className={active ? "dock-active text-primary" : ""} aria-current={active ? "page" : undefined}>
              <Icon className="size-5" aria-hidden="true" />
              <span className="dock-label">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
