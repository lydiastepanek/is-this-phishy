import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { S3 } from "@aws-sdk/client-s3";
import EmailForwardParser from "email-forward-parser";
import { simpleParser } from "mailparser";
import { TOP_MILLION_DOMAINS } from "./topDomains.js";
import { Response } from "node-fetch";
import URI from "urijs";
import { POPULAR_EMAIL_DOMAINS } from "./popularEmailDomains.js";

const REGION = process.env.REGION;
const BUCKET = process.env.S3_BUCKET;
const S3_CLIENT = new S3({ region: REGION });
const SES_CLIENT = new SESClient({ region: REGION });
export const NO_VIOLATIONS = `<br><br>We do not see anything phishy about this email.`;
export const POPULAR_EMAIL_DOMAIN_VIOLATION = `which is one of the 100 most popular email domains.`;
export const NON_TOP_MILLION_LINK_EMAIL = `This email contains links to the following domains which are not in the top million. We do not recommend clicking these links.`;
export const ATTACHMENT_VIOLATION = `This email contains the following attachment(s). We strongly suggest you do not open any attachments unless you are 100% sure you know the sender is who they say they are.`;
export const ATTACHMENT_NON_VIOLATION = `This email doesn't contain any attachments.`;
export const NO_FORWARDED_EMAIL = `We are not able to parse the forwarded email. Please try sending a different email.`;

export const getForwardedEmailFromS3 = async (key) => {
  const resp = await S3_CLIENT.getObject({
    Bucket: BUCKET,
    Key: key,
  });
  return new Response(resp.Body, {}).text();
};

export const sentFromPopularEmailDomain = (forwardedEmailFromAddress) => {
  const title = `Sent from a Popular Email Domain`;
  const explanation =
    `We checked whether this email comes from one of the ` +
    `<a href="https://email-verify.my-addr.com/list-of-most-popular-email-domains.php">100 most popular email domains online</a>. ` +
    `Legitimate organizations will avoid using popular email domains; for example, an employee of Walmart would have an email address like jdoe@walmart.com, not jdoe_walmart@gmail.com.`;
  const address = forwardedEmailFromAddress;
  if (!address) {
    return { skip: true, isViolation: false };
  }
  const emailDomain = address.split("@").pop();
  const violationResultString = `This email came from ${address} with email domain ${emailDomain} ${POPULAR_EMAIL_DOMAIN_VIOLATION}`;
  const nonViolationResultString = `This email came from ${address} with email domain ${emailDomain} which is not one of the most popular email domains.`;
  return {
    title,
    explanation,
    isViolation: POPULAR_EMAIL_DOMAINS.includes(emailDomain),
    violationResultString,
    nonViolationResultString,
  };
};

export const hasAttachment = (parentEmail) => {
  const title = `Contains an attachment`;
  const explanation = `Most legitimate organizations won't send an unsolicited attachment directly in an email.`;
  const nonViolationResultString = ATTACHMENT_NON_VIOLATION;
  let attachments = parentEmail.attachments
    .filter((attachment) => attachment.hasOwnProperty("filename"))
    .map((attachment) => ({ name: attachment.filename }));
  if (attachments.length === 0) {
    return {
      title,
      explanation,
      isViolation: false,
      nonViolationResultString,
    };
  }
  const violationResultString =
    `${ATTACHMENT_VIOLATION} <ul style="margin: 0;">` +
    attachments.map((attachment) => `<li>${attachment.name}</li>`).join("") +
    `</ul>`;
  return {
    title,
    explanation,
    isViolation: true,
    violationResultString,
    nonViolationResultString,
  };
};

export const hasNonTopMillionLinks = (parentEmail, linksInEmail) => {
  const title = `Contains Links to Unusual Domains`;
  const explanation = `We checked whether this email contains any links to domains that are not in the top one million most popular domains on the internet. We use the <a href="https://tranco-list.eu/list/K2XYW/1000000">Tranco top 1M list</a> generated on 5/1/2023. Domains not on this list may lead somewhere untrustworthy.`;
  const nonViolationResultString = `This email doesn't contain any links to unusual domains.`;
  if (!linksInEmail) {
    return { skip: true, isViolation: false };
  }
  let domainNames = Object.assign(
    {},
    ...linksInEmail
      .filter((link) => new URI(link).domain().length > 0)
      .map((link) => ({ [new URI(link).domain()]: new URI(link) }))
  );
  const nonTopMillionLinks = [];
  Object.entries(domainNames).forEach(([domain, x]) => {
    if (!TOP_MILLION_DOMAINS.includes(domain)) {
      nonTopMillionLinks.push(domain);
    }
  });
  if (nonTopMillionLinks.length === 0) {
    return {
      title,
      explanation,
      isViolation: false,
      nonViolationResultString,
    };
  }
  const violationResultString =
    `${NON_TOP_MILLION_LINK_EMAIL} <ul style="margin: 0;">` +
    nonTopMillionLinks
      .map(
        (domain) =>
          `<li>${domain} (full link address: ${domainNames[domain]})</li>`
      )
      .join("") +
    `</ul>`;
  return {
    title,
    explanation,
    isViolation: true,
    violationResultString,
    nonViolationResultString,
  };
};

export const getViolations = (parentEmail, forwardedEmailFromAddress) => {
  const violationsHtml = [];
  const linksInEmail = parentEmail.html.match(
    /(((https?:\/\/)|(www\.))[^\s^"^<]+)/gim
  );

  const hasNonTopMillionLinksResult = hasNonTopMillionLinks(
    parentEmail,
    linksInEmail
  );
  const hasAttachmentResult = hasAttachment(parentEmail);
  const sentFromPopularEmailDomainResult = sentFromPopularEmailDomain(
    forwardedEmailFromAddress
  );
  const violations = [
    hasNonTopMillionLinksResult,
    hasAttachmentResult,
    sentFromPopularEmailDomainResult,
  ];

  const violationsExplanationSection = violations
    .filter((violation) => !violation.skip)
    .map(
      (violation) =>
        `<h3 style="margin-bottom: 0;">${violation.title}</h3>${
          violation.explanation
        }<br>${violation.isViolation ? "\u274C" : "\u2705"} 
        ${violation.isViolation ? "Flagged" : "Not Flagged"}: ${
          violation.isViolation
            ? violation.violationResultString
            : violation.nonViolationResultString
        }`
    )
    .join("");
  violationsHtml.push(violationsExplanationSection);

  const violationCount = violations.filter(
    (violation) => !violation.skip && violation.isViolation
  ).length;
  if (violationCount === 0) {
    violationsHtml.unshift(
      `We performed the following checks and don't see any phishy flags in the email you sent: `
    );
    violationsHtml.push(NO_VIOLATIONS);
  } else {
    if (violationCount === 1) {
      violationsHtml.unshift(
        `We performed the following checks and see ${violationCount} phishy flag in the email you sent: `
      );
      violationsHtml.push(
        `<br><br>Since the suspicious email has a phishy flag, we recommend that you treat it with caution.`
      );
    } else {
      violationsHtml.unshift(
        `We spot ${violationCount} phishy flags in the email you sent: `
      );
      violationsHtml.push(
        `<br><br>Since the suspicious email has more than one phishy flag, we recommend that you treat it with caution.`
      );
    }
  }

  return violationsHtml.join("");
};

export const createResponse = async (s3Object) => {
  const parentEmail = await simpleParser(s3Object);
  const forwardedEmail = new EmailForwardParser().read(parentEmail.text);
  const fromAddress = parentEmail.from.value[0].address;
  if (fromAddress) {
    const emailDomain = fromAddress.split("@").pop();
    if (emailDomain === "amazonses.com") {
      return;
    }
  }
  const dataPrivacyStatement =
    `<table width="50%" border="0" cellspacing="0" cellpadding="0" style="background: #fffcb8; border-radius: 10px;"><tr><td align="center">` +
    `Your email address and all emails you send us are auto-deleted from our servers after 7 days. After that, no one, not even IsThisPhishy, can read them.` +
    `</td></tr></table><br><br>`;
  let data;
  if (forwardedEmail.forwarded) {
    data =
      dataPrivacyStatement +
      `<div> Hi ${parentEmail.from.value[0].name}, <br><br>` +
      `<div>Thanks for forwarding the suspicious email with the subject line \"${forwardedEmail.email.subject}\" to help@isthisphishy.io. </div><br>` +
      `${getViolations(
        parentEmail,
        forwardedEmail.email.from.address
      )}<br><br>` +
      `Keep up the vigilance, <br>` +
      `help@isthisphishy.io <br>` +
      `<br><br>` +
      `Below is the email you forwarded:</div><br>${parentEmail.html}`;
  } else {
    data =
      dataPrivacyStatement +
      `<div> Hi ${parentEmail.from.value[0].name}, ${NO_FORWARDED_EMAIL}<br><br>` +
      `Best, <br>` +
      `help@isthisphishy.io <br>` +
      `<br><br>` +
      `You sent the following email to help@isthisphishy.io:</div><br>${parentEmail.html}`;
  }
  const input = {
    // SendRawEmailRequest
    Source: '"IsThisPhishy" <help@isthisphishy.io>',
    Destination: {
      // Destination
      ToAddresses: [
        // AddressList
        fromAddress,
      ],
      BccAddresses: ["sent@isthisphishy.io"],
    },
    Message: {
      // Message
      Subject: {
        // Content
        Charset: "UTF-8",
        Data: 'Analyzed: "' + parentEmail.subject + '"',
      },
      Body: {
        // Body
        Html: {
          Charset: "UTF-8",
          Data: data,
        },
      },
    },
    ReplyToAddresses: ["help@isthisphishy.io"],
  };
  return input;
};

export const sendResponse = async (messageId, input) => {
  const command = new SendEmailCommand(input);
  console.log(
    "Finished creating SES message:\n",
    JSON.stringify(messageId, null, 2)
  );
  return await SES_CLIENT.send(command);
};

export const handler = async (event, context) => {
  const messageId = event.Records[0]["ses"]["mail"]["messageId"];
  console.log(
    "Started creating SES message:\n",
    JSON.stringify(messageId, null, 2)
  );
  const s3Object = await getForwardedEmailFromS3(messageId);
  const input = await createResponse(s3Object);
  if (!input) {
    console.log(
      "Skipping so as not to respond to emails from SES:\n",
      JSON.stringify(messageId, null, 2)
    );
    return;
  }
  return await sendResponse(messageId, input);
};
