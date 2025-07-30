import {SendEmailCommand, SESClient} from "@aws-sdk/client-ses";
import {S3} from "@aws-sdk/client-s3";
import EmailForwardParser from "email-forward-parser";
import {simpleParser} from "mailparser";
import {Response} from "node-fetch";
import {processMessage} from "./src/processMessage.js";
import {getViolations} from "./src/getViolations.js";

const REGION = process.env.REGION;
const BUCKET = process.env.S3_BUCKET;
const S3_CLIENT = new S3({region: REGION});
const SES_CLIENT = new SESClient({region: REGION});
export const NO_VIOLATIONS = `The email you sent is <span style="color:green; font-weight: bold;">Not Phishy</span>.`;
export const HAS_VIOLATIONS = `The email you sent is <span style="color:red; font-weight: bold;">Phishy</span>.`;
export const NON_TOP_MILLION_LINK_EMAIL = `This email contains links to the following domains which are not in the top million most common websites in the world.`;
export const SENDER_NON_TOP_MILLION_LINK_EMAIL = `Be cautious with this email; the sender's email domain`
export const PHISHING_LINK_EMAIL = `Hosting malicious code on a popular code hosting site allows scammers to get their links through spam filters. We do not recommend clicking these links.`;
export const ATTACHMENT_VIOLATION = `This email contains the following attachment(s).Only open attachments unless you are 100% sure you know the sender is who they say they are.`;
export const NO_FORWARDED_EMAIL = `We are not able to parse the forwarded email. Please try sending a different email.`;

export const getForwardedEmailFromS3 = async (key) => {
    const resp = await S3_CLIENT.getObject({
        Bucket: BUCKET,
        Key: key,
    });
    return new Response(resp.Body, {}).text();
};

export const createResponse = async (s3Object) => {
    const parentEmail = await simpleParser(s3Object);
    let forwardedEmail;
    if (parentEmail.text) {
        forwardedEmail = new EmailForwardParser().read(parentEmail.text);
    }
    const fromAddress = parentEmail.from.value[0].address;
    if (fromAddress) {
        const emailDomain = fromAddress.split("@").pop();
        if (emailDomain === "amazonses.com") {
            return;
        }
    }

    const dataPrivacyStatement =
        `<table width="50%" border="0" cellspacing="0" cellpadding="0" style="background: #fffcb8; border-radius: 10px;"><tr><td align="center">` +
        `Your email address and all emails you send us are auto-deleted from our servers after 7 days. After that, no one, not even Is This Phishy, can read them.` +
        `</td></tr></table><br><br>`;
    let data;
    if (forwardedEmail && forwardedEmail.forwarded && typeof parentEmail.textAsHtml === "string") {

        const {fullLinkUrls, domainNames} =
            await processMessage(parentEmail);

        data =
            dataPrivacyStatement +
            `<div> Hi ${parentEmail.from.value[0].name}, <br><br>` +
            `<div>Thanks for forwarding the suspicious email with the subject line \"${forwardedEmail.email.subject}\" to help@isthisphishy.io. </div><br>` +
            `${await getViolations(
                parentEmail,
                fullLinkUrls,
                domainNames,
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
        Source: '"Is This Phishy" <help@isthisphishy.io>',
        Destination: {
            // Destination
            ToAddresses: [
                // AddressList
                fromAddress,
            ],
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
