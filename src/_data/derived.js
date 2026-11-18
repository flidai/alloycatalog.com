// Values derived from site.json, so each fact is written once.
import site from "./site.json" with { type: "json" };

export default {
  year: new Date().getFullYear(),
  demoHref: site.bookingUrl ?? `mailto:${site.email}?subject=${encodeURIComponent(`${site.name} demo`)}`,
};
