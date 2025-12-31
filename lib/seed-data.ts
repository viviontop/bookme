import type { User, Service, Review } from "./types"

export function seedDemoData() {
  if (globalThis.window === undefined) return

  // CLEAR ALL LEGACY DATA ONCE
  if (!localStorage.getItem("data_cleared_v2")) {
    console.log("Clearing all legacy demo data...")
    localStorage.removeItem("users")
    localStorage.removeItem("services")
    localStorage.removeItem("reviews")
    localStorage.removeItem("appointments")
    localStorage.removeItem("seeded")
    localStorage.setItem("data_cleared_v2", "true")
    // Force reload to reflect changes if needed, but managing state updates via event usually works
    // For now, let's just clear.
  }
}
