import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Image
              src="/Arc-i-Tech-logo.png"
              alt="Arc-i-Tech logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-contain"
            />
            <p className="text-lg font-semibold text-slate-800">
              Arc-<span className="text-red-500 italic">i</span>-Tech
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Crafting software that scales with your ambition.
          </p>
        </div>
        <div className="text-sm text-slate-500">
          © {new Date().getFullYear()} Arc-i-Tech Technologies LLP. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
