import {sectionForWellKnownPhishingLinks} from "./sections/sectionForWellKnownPhishingLinks.js";
import {sectionForHeaders} from "./sections/sectionForHeaders.js";
import {processNonTopMillion} from "./processNonTopMillion.js";
import {sectionForNonTopMillionDomainNames} from "./sections/sectionForNonTopMillionDomainNames.js";
import {HAS_VIOLATIONS, NO_VIOLATIONS} from "../index.js";
import {sectionForAttachments} from "./sections/sectionForAttachments.js";

export const getViolations = async (
    parentEmail,
    fullLinkUrls,
    domainNames,
) => {
    const
        headersSection
            = await sectionForHeaders(parentEmail);
    const wellKnownPhishingLinksSection = sectionForWellKnownPhishingLinks(fullLinkUrls);
    const {topMillionDomainNames, nonTopMillionDomainNames} =
        processNonTopMillion(domainNames);
    const nonTopMillionDomainNamesSections = await sectionForNonTopMillionDomainNames(nonTopMillionDomainNames);
    const attachmentsSection = sectionForAttachments(parentEmail);

    const violations = [headersSection, attachmentsSection, nonTopMillionDomainNamesSections, wellKnownPhishingLinksSection]

    const violationCount = violations.filter(
        (violation) => violation.isViolation
    ).length;
    const overallPhishy = violationCount > 0;

    const violationsHtml = [];
    const violationsExplanationSection = violations
        .map(
            (violation) => {
                if (violation.isViolation) {
                    return `<br><h3 style="margin-bottom: 0;">${violation.title}</h3>${violation.explanation}<br>\u274C Flagged: ${violation.detail}`;
                }
            }
        )
        .join("");
    violationsHtml.push(violationsExplanationSection);

    if (!overallPhishy) {
        violationsHtml.unshift(NO_VIOLATIONS);
    } else {
        violationsHtml.unshift(HAS_VIOLATIONS);
        if (violationCount === 1) {
            violationsHtml.push(
                `<br>Since the suspicious email has a phishy flag, we recommend that you treat it with caution.`
            );
        } else {
            violationsHtml.push(
                `<br>Since the suspicious email has more than one phishy flag, we recommend that you treat it with caution.`
            );
        }
    }
    return violationsHtml.join("");
};
