'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, formatRelative } from "@/lib/api";
import type { NotificationFeed, NotificationItem } from "@/types";
import { Bell, Loader2, Menu, RefreshCw, X } from "lucide-react";

const routes = [
  { href: "/", label: "Home" },
  { href: "/#services", label: "Services" },
  { href: "/#process", label: "Process" },
  { href: "/#contact", label: "Contact" },
];

export function Navbar() {
  const {
    token,
    user,
    isAuthenticated,
    isSuperAdmin,
    isSubAdmin,
    isDeveloper,
    logout,
  } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const notificationsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setHydrated(true));
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      setNotificationsLoading(true);
      const response = await apiFetch<NotificationFeed>("/api/notifications", {
        token,
      });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !token) {
      return;
    }
    void fetchNotifications();
  }, [hydrated, isAuthenticated, token, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    if (!token || unreadCount === 0) return;
    try {
      await apiFetch<null>("/api/notifications/read-all", {
        method: "POST",
        token,
      });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
        })),
      );
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  }, [token, unreadCount]);

  const handleToggleNotifications = useCallback(() => {
    if (!hydrated || !isAuthenticated) return;
    setNotificationsOpen((prev) => {
      const next = !prev;
      if (!prev && unreadCount > 0) {
        void markAllRead();
      }
      return next;
    });
  }, [hydrated, isAuthenticated, unreadCount, markAllRead]);

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsContainerRef.current &&
        !notificationsContainerRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (notificationsOpen && unreadCount > 0) {
      void markAllRead();
    }
  }, [notificationsOpen, unreadCount, markAllRead]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="bg-white/80 backdrop-blur sticky top-0 z-50 border-b border-slate-200">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/Arc-i-Tech-logo.png"
            alt="Arc-i-Tech logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-contain"
            priority
          />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold text-slate-900">
              Arc-<span className="text-red-500 italic">i</span>-Tech
            </span>
            <span className="text-xs font-medium text-slate-500">
              Building future-ready products
            </span>
          </div>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600"
            >
              {route.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          {hydrated && isAuthenticated && user ? (
            <>
              <div
                ref={notificationsContainerRef}
                className="relative"
              >
                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  className="relative inline-flex items-center rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Alerts
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          void fetchNotifications();
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Refresh
                      </button>
                    </div>
                    <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                      {notificationsLoading ? (
                        <div className="flex items-center justify-center py-6 text-sm text-slate-500">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Syncing alerts...
                        </div>
                      ) : notifications.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                          You are all caught up. No new notifications right now.
                        </p>
                      ) : (
                        notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className={`rounded-lg border border-slate-200 p-3 text-xs ${
                              notification.read
                                ? "bg-slate-50 text-slate-500"
                                : "bg-indigo-50 text-slate-600"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">
                                {notification.title}
                              </span>
                              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                                {formatRelative(notification.createdAt)}
                              </span>
                            </div>
                            {notification.message && (
                              <p className="mt-1 text-[11px] text-slate-500">
                                {notification.message}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-3 border-t border-slate-100 pt-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          void fetchNotifications();
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500"
                      >
                        View latest
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-sm text-slate-500">
                Hi, <span className="font-semibold">{user.fullName}</span>
              </span>
              <Link
                href={
                  isSuperAdmin
                    ? "/super-admin"
                    : isSubAdmin
                      ? "/admin"
                      : isDeveloper
                        ? "/developer"
                        : "/dashboard"
                }
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                {isSuperAdmin
                  ? "Super Admin"
                  : isSubAdmin
                    ? "Admin Console"
                    : isDeveloper
                      ? "Dev Console"
                      : "My Dashboard"}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Create account
              </Link>
            </>
          )}
        </div>
        <button
          className="rounded-md border border-slate-200 p-2 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-slate-200 bg-white p-4 md:hidden">
          <div className="flex flex-col gap-4">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-slate-600 hover:text-indigo-600"
              >
                {route.label}
              </Link>
            ))}
            {hydrated && isAuthenticated && user ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Alerts
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void fetchNotifications();
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Refresh
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {notificationsLoading ? (
                      <div className="flex items-center justify-center py-4 text-xs text-slate-500">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing alerts...
                      </div>
                    ) : notifications.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-500">
                        You&apos;re up to date.
                      </p>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`rounded-lg border border-slate-200 p-3 text-xs ${
                            notification.read
                              ? "bg-white text-slate-500"
                              : "bg-indigo-50 text-slate-600"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">
                              {notification.title}
                            </span>
                            <span className="text-[10px] uppercase tracking-wide text-slate-400">
                              {formatRelative(notification.createdAt)}
                            </span>
                          </div>
                          {notification.message && (
                            <p className="mt-1 text-[11px] text-slate-500">
                              {notification.message}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <Link
                  href={
                    isSuperAdmin
                      ? "/super-admin"
                      : isSubAdmin
                        ? "/admin"
                        : isDeveloper
                          ? "/developer"
                          : "/dashboard"
                  }
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  {isSuperAdmin
                    ? "Super Admin"
                    : isSubAdmin
                      ? "Admin Console"
                      : isDeveloper
                        ? "Dev Console"
                        : "My Dashboard"}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-500"
                  onClick={() => setOpen(false)}
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
