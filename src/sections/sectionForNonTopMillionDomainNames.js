import whois from "whois-json";
import { COUNTRY_CODE_TO_COUNTRY_MAP } from "../countryCodeToCountryMap.js";
import { NON_TOP_MILLION_LINK_EMAIL } from "../../index.js";

const getRegistrantCountry = async (domainName) => {
  let results;
  try {
    const results = await whois(domainName);
    let country;
    for (const key of Object.keys(results)) {
      if (key === "registrantCountry") {
        if (!!COUNTRY_CODE_TO_COUNTRY_MAP[results[key]]) {
          country = COUNTRY_CODE_TO_COUNTRY_MAP[results[key]];
        } else {
          country = results[key];
        }
      }
    }
    return country;
  } catch (e) {
    console.log(e);
  }
};

export const sectionForNonTopMillionDomainNames = async (
  nonTopMillionDomainNames
) => {
  const linkCountries = [];
  for (const domainName of nonTopMillionDomainNames) {
    const country = await getRegistrantCountry(domainName);
    linkCountries.push(`<li>${domainName}: ${country}</li>`);
  }
  return {
    isViolation: nonTopMillionDomainNames.length > 0,
    title: "Non top million links",
    explanation: NON_TOP_MILLION_LINK_EMAIL,
    detail: `Here are all the non-top-million domain names and the countries where they are registered: <ul style="margin: 0;">${linkCountries.join(
      ""
    )}</ul>`,
  };
};
