import { HeroSection } from "@/components/HeroSection";
import { ServicesSection } from "@/components/ServicesSection";
import { ProjectsShowcase } from "@/components/ProjectsShowcase";
import { ContactSection } from "@/components/ContactSection";
import { ApiResponse, Project, ServiceOffering } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function fetchCollection<T>(path: string): Promise<T[]> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}`);
    }
    const payload = (await response.json()) as ApiResponse<T[]>;
    return payload.data ?? [];
  } catch (error) {
    console.warn("Falling back to static data for", path, error);
    return [];
  }
}

export default async function Home() {
  const [services, projects] = await Promise.all([
    fetchCollection<ServiceOffering>("/api/services/featured"),
    fetchCollection<Project>("/api/projects/highlights"),
  ]);

  return (
    <>
      <HeroSection />
      <ServicesSection services={services} />
      <ProjectsShowcase projects={projects} />
      <ContactSection />
    </>
  );
}
