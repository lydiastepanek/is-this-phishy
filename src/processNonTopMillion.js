import { TOP_MILLION_DOMAINS } from "./topDomains/topDomains.js";
import {BITLY_PHISHING_SITE_DOMAIN, GCP_PHISHING_SITE_DOMAIN} from "./sections/sectionForWellKnownPhishingLinks.js";

export const processNonTopMillion = (domainNames) => {
  const topMillionDomainNames = [];
  const nonTopMillionDomainNames = [];
  [...domainNames].forEach((domain) => {
    if (!TOP_MILLION_DOMAINS.has(domain)) {
      nonTopMillionDomainNames.push(domain);
    } else {
      if (
        domain !== BITLY_PHISHING_SITE_DOMAIN &&
        domain !== GCP_PHISHING_SITE_DOMAIN &&
        domain !== "amazonaws.com" &&
        domain !== "windows.net"
      ) {
        topMillionDomainNames.push(domain);
      }
    }
  });
  return {
    topMillionDomainNames,
    nonTopMillionDomainNames,
  };
};
