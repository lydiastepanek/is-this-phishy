import EmailForwardParser from "email-forward-parser";
import { TOP_MILLION_DOMAINS } from "../topDomains/topDomains.js";
import whois from "whois-json";
import {COUNTRY_CODE_TO_COUNTRY_MAP} from "../countryCodeToCountryMap.js";
import {SENDER_NON_TOP_MILLION_LINK_EMAIL} from "../../index.js";

export const sectionForHeaders = async (parentEmail) => {
    let forwardedEmail;
    if (parentEmail.text) {
        forwardedEmail = new EmailForwardParser().read(parentEmail.text);
    }

    let fromEmail;
    let fromDomain;
    if (forwardedEmail && forwardedEmail.forwarded) {
        let fromData = forwardedEmail.email.from;
        if (!!fromData.address && fromData.address.includes("@")) {
            fromDomain = fromData.address.split("@")[1];
        } else if (!!fromData.name && fromData.name.includes("@")) {
            fromDomain = fromData.name.split("@")[1];
        }
    }

    let whoisResults;
    let fromDomainCountry;
    try {
        whoisResults = await whois(fromDomain);
        for (const key of Object.keys(whoisResults)) {
            if (
                key === "registrantCountry" &&
                !!COUNTRY_CODE_TO_COUNTRY_MAP[whoisResults[key]]
            ) {
                fromDomainCountry =
                    COUNTRY_CODE_TO_COUNTRY_MAP[whoisResults[key]];
            }
        }
    } catch (e) {
    }

    return {
        isViolation: !TOP_MILLION_DOMAINS.has(fromDomain) && !!fromDomainCountry,
        title: `What we know about sender ${fromEmail}`,
        explanation: `${SENDER_NON_TOP_MILLION_LINK_EMAIL} ${fromDomain} is not in the top million most common websites in the world.`,
        detail: `Our whois check shows that ${fromDomain} is hosted in ${fromDomainCountry}.`,
    };
};
