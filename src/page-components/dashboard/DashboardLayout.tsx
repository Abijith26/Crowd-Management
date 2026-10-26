import { NavLink, Outlet } from "react-router-dom";
import { Activity, LayoutDashboard, Users, LogOut } from "lucide-react";
import { logout } from "@/services/auth";

const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/entries", label: "Crowd Entries", icon: Users, end: false },
];

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <aside className="flex w-full flex-col border-b border-slate-200 bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between">
          <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Activity size={20} />
            </div>
            <div>
              <p className="font-semibold tracking-tight">Crowd Management</p>
              <p className="text-xs text-slate-500">Easy Monitoring </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              window.location.assign("/login");
            }}
            className="lg:hidden sm:flex md:flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <LogOut size={18} className="md:block hidden" />
            Sign out
          </button>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex gap-2 p-3 lg:flex-1 lg:flex-col"
        >
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-slate-100 p-3 lg:block">
          <button
            type="button"
            onClick={() => {
              logout();
              window.location.assign("/login");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 lg:flex-1">
        <Outlet />
      </main>
    </div>
  );
}
