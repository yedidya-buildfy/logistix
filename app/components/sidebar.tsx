import React from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Package,
  Boxes,
  ClipboardList,
  ShoppingCart,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { getSupabaseBrowserClient } from "../lib/supabase.client";

interface SidebarProps {
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    shop?: string | null;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const [pinned, setPinned] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const nav = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: ClipboardList, label: "Purchase Orders", href: "/purchase-orders" },
    { icon: Boxes, label: "Warehouses", href: "/warehouses" },
    { icon: Package, label: "Items", href: "/items" },
    { icon: ShoppingCart, label: "Products", href: "/products" },
    { icon: CreditCard, label: "Billings", href: "/billings" },
  ];

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email;

  const isExpanded = pinned || hovered;

  return (
    <aside
      tabIndex={0}
      aria-label="Primary"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-expanded={isExpanded}
      className={[
        "sticky top-0 h-screen z-20",
        "border-r border-neutral-800/80 bg-neutral-950/60 backdrop-blur",
        "transition-[width] duration-300 ease-out",
        "focus:outline-none",
        "flex-none shrink-0",
        "relative",
        isExpanded ? "w-60" : "w-14",
      ].join(" ")}
    >
      {/* Wider hover rail */}
      <div
        aria-hidden
        className="absolute right-[-20px] top-0 h-full w-[20px]"
        onMouseEnter={() => setHovered(true)}
      />

      <div className="flex items-center justify-between h-14 px-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <img src="/bright-logo.svg" alt="Logistix" className="size-10" />
          <span
            className={[
              "whitespace-nowrap text-base font-semibold transition-all duration-300",
              isExpanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-[-8px]",
            ].join(" ")}
          >
            LOGISTIX
          </span>
        </div>

        <button
          onClick={() => setPinned((v) => !v)}
          aria-pressed={pinned}
          title={pinned ? "Unpin" : "Pin sidebar"}
          className={[
            "items-center justify-center size-8 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition-colors",
            isExpanded ? "inline-flex" : "hidden",
          ].join(" ")}
        >
          {pinned ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>
      </div>

      <nav className="mt-2 flex flex-col gap-1 px-2">
        {nav.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            href={item.href}
            isExpanded={isExpanded}
            isActive={location.pathname === item.href || location.pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>

      <div className="absolute bottom-3 left-0 right-0 px-3 space-y-2">
        <button
          onClick={handleLogout}
          className={[
            "w-full flex items-center gap-3 px-3 py-3 rounded-xl",
            "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30",
            "text-red-400 hover:text-red-300",
            "transition-all duration-200",
          ].join(" ")}
        >
          <LogOut className="size-5 shrink-0" />
          <span
            className={[
              "text-sm font-medium transition-all duration-300",
              isExpanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-[-8px]",
            ].join(" ")}
          >
            Sign Out
          </span>
        </button>

        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-neutral-900/60 border border-neutral-800/40">
          <UserIcon className="size-5 shrink-0 text-green-500" />
          <div
            className={[
              "transition-all duration-300 overflow-hidden",
              isExpanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-[-8px]",
            ].join(" ")}
          >
            <p className="text-xs text-neutral-400 mb-0.5">Account</p>
            <p className="text-sm text-white font-medium truncate">
              {displayName}
            </p>
            {user.shop && (
              <p className="text-xs text-green-400 truncate mt-0.5">
                {user.shop}
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  icon: Icon,
  label,
  href,
  isExpanded,
  isActive,
}: {
  icon: any;
  label: string;
  href: string;
  isExpanded: boolean;
  isActive: boolean;
}) {
  return (
    <Link
      to={href}
      className={[
        "relative flex items-center gap-3 px-3 py-3 rounded-xl",
        "focus:outline-none transition-all duration-200",
        isActive
          ? "text-white bg-green-500/30 hover:bg-green-500/40 shadow-lg shadow-green-500/20"
          : "text-neutral-300 hover:text-white hover:bg-neutral-800/60 focus:bg-neutral-800/60",
      ].join(" ")}
      aria-label={label}
    >
      <Icon className={isActive ? "size-6 shrink-0" : "size-5 shrink-0"} />
      <span
        className={[
          "transition-all duration-300",
          isExpanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-[-8px]",
          isActive ? "text-sm font-semibold" : "text-sm",
        ].join(" ")}
      >
        {label}
      </span>
    </Link>
  );
}
