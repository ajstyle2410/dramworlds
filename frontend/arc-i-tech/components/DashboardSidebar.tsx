'use client';

import type { ReactNode } from "react";

export type DashboardSidebarItem = {
  href: string;
  label: string;
  description?: string;
  icon?: ReactNode;
};

interface DashboardSidebarProps {
  title: string;
  subtitle?: string;
  items: DashboardSidebarItem[];
  footer?: ReactNode;
}

export function DashboardSidebar({
  title,
  subtitle,
  items,
  footer,
}: DashboardSidebarProps) {
  return (
    <aside className="sticky top-24 flex w-full max-w-xs flex-col gap-4 self-start rounded-2xl border border-slate-200 bg-white/80 p-5 text-sm text-slate-600 shadow-sm backdrop-blur lg:w-64">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        ) : null}
      </div>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className="flex items-start gap-3 rounded-xl px-3 py-2 transition hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
            >
              {Icon ? <span className="mt-0.5">{Icon}</span> : null}
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">{item.label}</span>
                {item.description ? (
                  <span className="text-xs font-normal text-slate-400">
                    {item.description}
                  </span>
                ) : null}
              </span>
            </a>
          );
        })}
      </nav>
      {footer ? <div className="border-t border-slate-200 pt-3 text-xs">{footer}</div> : null}
    </aside>
  );
}
