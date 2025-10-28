'use client';

import { ServiceOffering } from "@/types";
import {
  Briefcase,
  GraduationCap,
  Lightbulb,
  Monitor,
  Rocket,
  Smartphone,
  Globe,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  globe: <Globe className="h-7 w-7 text-indigo-500" />,
  smartphone: <Smartphone className="h-7 w-7 text-indigo-500" />,
  monitor: <Monitor className="h-7 w-7 text-indigo-500" />,
  "graduation-cap": <GraduationCap className="h-7 w-7 text-indigo-500" />,
  briefcase: <Briefcase className="h-7 w-7 text-indigo-500" />,
  lightbulb: <Lightbulb className="h-7 w-7 text-indigo-500" />,
};

interface ServicesSectionProps {
  services: ServiceOffering[];
}

export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section id="services" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-4 text-center">
          <span className="mx-auto w-fit rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
            services
          </span>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            From discovery to deployment
          </h2>
          <p className="mx-auto max-w-3xl text-base text-slate-600">
            Product strategists, designers, and engineers working in unison.
            Whether you are validating an idea or modernising an enterprise
            platform, our playbooks adapt to your scale.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {services.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
              Service catalogue will appear here once the API is connected.
            </div>
          )}
          {services.map((service) => (
            <article
              key={service.id}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-indigo-50 p-3">
                  {iconMap[service.icon ?? ""] ?? (
                    <Rocket className="h-7 w-7 text-indigo-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {service.name}
                  </h3>
                  <p className="mt-1 text-sm text-indigo-500">
                    {service.category}
                    {service.startingPrice
                      ? ` · starting at ₹${service.startingPrice.toLocaleString()}`
                      : ""}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                {service.shortDescription}
              </p>
              {service.detailedDescription && (
                <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  {service.detailedDescription}
                </p>
              )}
              {service.featured && (
                <span className="mt-4 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Popular pick
                </span>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
