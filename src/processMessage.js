import URI from "urijs";
import * as cheerio from 'cheerio';

const LINK_ELEMENT_TYPES =
    "a[href^='http://']:not(a[href^='mailto']), " +
    "a[href^='https://']:not(a[href^='mailto']), " +
    "a[href^='/']:not(a[href^='mailto'])";

export const processMessage = async (parentEmail) => {
    let domainNames = new Set();
    let fullLinkUrls = new Set();
    const $ = cheerio.load(parentEmail.textAsHtml);
    const relativeLinks = $(LINK_ELEMENT_TYPES);
    relativeLinks.each((index, value) => {
        const href = $(value).attr("href");
        fullLinkUrls.add(new URI(href));
        domainNames.add(new URI(href).domain());
    });

    return {fullLinkUrls, domainNames};
};
