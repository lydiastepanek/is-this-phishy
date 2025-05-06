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

export const createResponse = async () => {
    const htmlData = "<html xmlns=\"http://www.w3.org/1999/xhtml\" style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px;\"><head> \n" +
        "  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\"> \n" +
        "  <meta name=\"viewport\" content=\"width=device-width\"> \n" +
        "  <style>@media only screen and (max-width: 640px) {\n" +
        "  body {\n" +
        "    padding: 0 !important;\n" +
        "  }\n" +
        "  h1 {\n" +
        "    font-weight: 800 !important; margin: 20px 0 5px !important;\n" +
        "  }\n" +
        "  h2 {\n" +
        "    font-weight: 800 !important; margin: 20px 0 5px !important;\n" +
        "  }\n" +
        "  h3 {\n" +
        "    font-weight: 800 !important; margin: 20px 0 5px !important;\n" +
        "  }\n" +
        "  h4 {\n" +
        "    font-weight: 800 !important; margin: 20px 0 5px !important;\n" +
        "  }\n" +
        "  h1 {\n" +
        "    font-size: 22px !important;\n" +
        "  }\n" +
        "  h2 {\n" +
        "    font-size: 18px !important;\n" +
        "  }\n" +
        "  h3 {\n" +
        "    font-size: 16px !important;\n" +
        "  }\n" +
        "  .container {\n" +
        "    padding: 0 !important; width: 100% !important;\n" +
        "  }\n" +
        "  .content {\n" +
        "    padding: 0 !important;\n" +
        "  }\n" +
        "  .content-wrap {\n" +
        "    padding: 10px !important;\n" +
        "  }\n" +
        "  .invoice {\n" +
        "    width: 100% !important;\n" +
        "  }\n" +
        "}\n" +
        "</style> \n" +
        " </head> \n" +
        " <body itemscope=\"\" itemtype=\"http://schema.org/EmailMessage\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; height: 100%; line-height: 1.6em; width: 100%;\" bgcolor=\"#f6f6f6\"> \n" +
        "  <table class=\"body-wrap\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%;\" bgcolor=\"#f6f6f6\"> \n" +
        "   <tbody> \n" +
        "    <tr> \n" +
        "     <td style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px;\"> </td> \n" +
        "     <td class=\"container\" width=\"600\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;\"> \n" +
        "      <div class=\"content\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 20px;\"> \n" +
        "       <table width=\"100%\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\"> \n" +
        "        <tbody> \n" +
        "         <tr> \n" +
        "          <td style=\"border-collapse: collapse;\" width=\"640\" height=\"0\" bgcolor=\"#f6f6f6\"> \n" +
        "           <table width=\"360\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" align=\"center\"> \n" +
        "            <tbody> \n" +
        "            </tbody> \n" +
        "           </table> </td> \n" +
        "         </tr> \n" +
        "        </tbody> \n" +
        "       </table> \n" +
        "       <table class=\"main\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" itemprop=\"action\" itemscope=\"\" itemtype=\"http://schema.org/ConfirmAction\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; border: 1px solid #dddddd;\" bgcolor=\"#fff\"> \n" +
        "        <tbody> \n" +
        "         <tr> \n" +
        "          <td> \n" +
        "           <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse: separate; font-size: 1px; height: 2px; line-height: 3px; width: 100%; border: none;\"> \n" +
        "            <tbody> \n" +
        "             <tr> \n" +
        "              <td style=\"font-family: 'Helvetica Neue',Arial,sans-serif; width: 100%; border: none;\"> &nbsp;</td> \n" +
        "             </tr> \n" +
        "            </tbody> \n" +
        "           </table> </td> \n" +
        "         </tr> \n" +
        "         <tr style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; color: #525252;\"> \n" +
        "          <td class=\"content-wrap\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; padding: 20px;\"> \n" +
        "           <meta style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px;\"> \n" +
        "           <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px;\"> \n" +
        "            <tbody> \n" +
        "             <tr> \n" +
        "              <td class=\"content-block\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; padding: 0 0 8px;\" align=\"center\"> <h2>Update your ID Badge!</h2> </td> \n" +
        "             </tr> \n" +
        "             <tr> \n" +
        "              <td style=\"border-collapse: collapse;\" width=\"100%\" height=\"100px\" align=\"center\"> <img style=\"max-width: 100%; outline: none; text-decoration: none; display: block;\" src=\"https://d1yynrqd2fp86j.cloudfront.net/EmailTemplates/Common/images/badge-logo.png\" width=\"146px\" height=\"90px\" alt=\"\" border=\"0\"> </td> \n" +
        "             </tr> \n" +
        "             <tr> \n" +
        "              <td class=\"content-block\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px;\"> <h3>Hi John,</h3> </td> \n" +
        "             </tr> \n" +
        "             <tr> \n" +
        "              <td class=\"content-block\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; padding: 0 0 20px;\"> <h3 style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box;\"> Healthcare guidelines require personnel in hospitals to wear an updated identification. </h3> </td> \n" +
        "             </tr> \n" +
        "             <tr> \n" +
        "              <td class=\"content-block\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px;\"> <p><strong>Make sure you have an up-to-date ID photo to complete our security validation.</strong></p> <p style=\"padding-bottom:12px;\">Are you an essential employee and worker such as doctor, nurse or medical assistant? Or planning to visit a hospital in the next few days? We will do our best to set up your ID Badge Update as quickly as possible.</p> </td> \n" +
        "             </tr> \n" +
        "             <tr> \n" +
        "              <td class=\"content-block\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px;\"> <p style=\"padding-bottom:12px;\">Please <strong>add your details</strong>, <a href=\"http://bit.ly/1PibSU0\"> upload a new photo</a> and get an updated ID badge! </p> </td> \n" +
        "             </tr> \n" +
        "             <tr style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; height: 80px; margin: 20px;\"> \n" +
        "              <td class=\"content-block\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; height: 80px; margin: 20px;\" align=\"center\"> <a href=\"http://bit.ly/1PibSU0\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 16px; color: #FFFFFF; background-color: #2196f3; text-decoration: none; margin: 20px; padding: 13px 20px;\"><b style=\"color: #ffffff;\">Update your ID badge</b> </a> </td> \n" +
        "             </tr> \n" +
        "            </tbody> \n" +
        "           </table> </td> \n" +
        "         </tr> \n" +
        "        </tbody> \n" +
        "       </table> \n" +
        "      </div> \n" +
        "      <div class=\"footer\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; clear: both; color: #999; padding: 0 20px 20px 0;\"> \n" +
        "       <table width=\"100%\" style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px;\"> \n" +
        "        <tbody> \n" +
        "         <tr> \n" +
        "          <td colspan=\"2\" class=\"aligncenter content-block\" style=\"width: 100%; font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; padding: 0;\" align=\"center\"> <p style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999;\"> This email was sent to: john[.]doe@mybusiness[.]com. <br><br> You are receiving this email because you may qualify for a credential update </p> </td> \n" +
        "         </tr> \n" +
        "        </tbody> \n" +
        "       </table> \n" +
        "      </div> </td> \n" +
        "     <td style=\"font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px;\"> </td> \n" +
        "    </tr> \n" +
        "   </tbody> \n" +
        "  </table>  \n" +
        " \n" +
        "<style>a { cursor: pointer; }</style></body></html>"
    const input = {
        // SendRawEmailRequest
        Source: '"eHealth Support" <help@isthisphishy.io>',
        Destination: {
            // Destination
            ToAddresses: [
                // AddressList
                "lydia.stepanek@gmail.com",
            ],
        },
        Message: {
            // Message
            Subject: {
                // Content
                Charset: "UTF-8",
                Data: 'ID Badge Update Needed - Urgent',
            },
            Body: {
                // Body
                Html: {
                    Charset: "UTF-8",
                    Data: htmlData,
                },
            },
        },
        ReplyToAddresses: ["health-care@webnotifications.net"],
    };
    return input;
};

export const sendResponse = async (input) => {
    const command = new SendEmailCommand(input);
    console.log(
        "Finished creating SES message:\n"
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

const input = await createResponse();
await sendResponse(input);
