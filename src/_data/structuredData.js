// Schema.org data for the home page, built from site.json.
import site from "./site.json" with { type: "json" };

export default {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#org`,
      name: site.company.legalName,
      url: site.company.url,
      logo: `${site.url}/apple-touch-icon.png`,
      email: site.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: site.company.street,
        postalCode: site.company.postalCode,
        addressLocality: site.company.city,
        addressCountry: site.company.countryCode,
      },
    },
    { "@type": "WebSite", "@id": `${site.url}/#website`, url: `${site.url}/`, name: site.name, publisher: { "@id": `${site.url}/#org` } },
    {
      "@type": "SoftwareApplication",
      name: site.name,
      url: `${site.url}/`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "Engineering master data with a built-in AI agent: models, drawings, bills of materials and ERP data in one page per part number.",
      publisher: { "@id": `${site.url}/#org` },
    },
  ],
};
