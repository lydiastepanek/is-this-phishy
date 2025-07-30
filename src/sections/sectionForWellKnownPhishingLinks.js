import { PHISHING_LINK_EMAIL } from "../../index.js";

export const BITLY_PHISHING_SITE_DOMAIN = "bit.ly";
export const GCP_PHISHING_SITE_DOMAIN = "storage.googleapis.com";
export const AZURE_PHISHING_SITE_DOMAIN = "blob.core.windows.net";
export const AWS_PHISHING_SITE_DOMAIN = "s3.amazonaws.com";

export const sectionForWellKnownPhishingLinks = (fullLinkUrls) => {
  const wellKnownPhishingLinks = [];
  [...fullLinkUrls].map((link) => {
    if (link.toString().indexOf(BITLY_PHISHING_SITE_DOMAIN) !== -1) {
      wellKnownPhishingLinks[link] = BITLY_PHISHING_SITE_DOMAIN;
    }
    if (link.toString().indexOf(AWS_PHISHING_SITE_DOMAIN) !== -1) {
      wellKnownPhishingLinks[link] = AWS_PHISHING_SITE_DOMAIN;
    }
    if (link.toString().indexOf(GCP_PHISHING_SITE_DOMAIN) !== -1) {
      wellKnownPhishingLinks[link] = GCP_PHISHING_SITE_DOMAIN;
    }
    if (link.toString().indexOf(AZURE_PHISHING_SITE_DOMAIN) !== -1) {
      wellKnownPhishingLinks[link] = AZURE_PHISHING_SITE_DOMAIN;
    }
  });
  return {
    isViolation: Object.keys(wellKnownPhishingLinks).length > 0,
    title: "Phishy links found",
    explanation: PHISHING_LINK_EMAIL,
    detail:
      `<ul style="margin: 0;">` +
      Object.keys(wellKnownPhishingLinks)
        .map(
          (link) =>
            `<li>${wellKnownPhishingLinks[link]} (full link address: ${link})</li>`
        )
        .join("") +
      `</ul>`,
  };
};
