import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://pixabuild.local";
  const routes = [
    "",
    "/catalog",
    "/visualize",
    "/cart",
    "/login",
    "/register",
    "/admin/dashboard",
    "/admin/users",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/catalog" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/catalog" || route === "/visualize" ? 0.9 : 0.6,
  }));
}
