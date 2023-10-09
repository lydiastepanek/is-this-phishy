import {
  ATTACHMENT_VIOLATION,
  createResponse,
  getForwardedEmailFromS3,
  NO_FORWARDED_EMAIL,
  NO_VIOLATIONS,
  NON_TOP_MILLION_LINK_EMAIL,
  POPULAR_EMAIL_DOMAIN_VIOLATION,
  sendResponse,
} from "./index.js";
import EmailForwardParser from "email-forward-parser";
import * as fs from "fs";

const read = (emailFilename) => {
  return fs.readFileSync(
    `${__dirname}/tests/fixtures/${emailFilename}`,
    "utf-8"
  );
};
describe("testsNotRequiringAWSCredentials", () => {
  describe("createResponse", () => {
    test("returns error when there is no forwarded email included", async () => {
      const email = read("5a1cq5uuvfgjafiaccke5qo5rsv8bgnj6f940vg1");
      try {
        const input = await createResponse(email);
        expect(
          input.Message.Body.Html.Data.includes(POPULAR_EMAIL_DOMAIN_VIOLATION)
        ).toBe(false);
        expect(input.Message.Body.Html.Data.includes(NO_FORWARDED_EMAIL)).toBe(
          true
        );
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(
          false
        );
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(false);
      } catch (e) {
        console.log(e);
      }
    });

    test("returns error when simpleParser is not able to recognize the email text", async () => {
      const email = read("fegpjvia3s75firghmib6uuuhlmdgatahhtujlo1");
      try {
        const input = await createResponse(email);
        expect(input.Message.Body.Html.Data.includes(NO_FORWARDED_EMAIL)).toBe(
          true
        );
      } catch (e) {
        console.log(e);
      }
    });

    test("analyzes email when AOC email which is from outlooks so is encrypted", async () => {
      const email = read("qk7eogaeme2hcftcnaqu64nqpsn9knugi0pa17g1");
      try {
        const input = await createResponse(email);
        expect(
          input.Message.Body.Html.Data.includes(POPULAR_EMAIL_DOMAIN_VIOLATION)
        ).toBe(false);
        expect(input.Message.Body.Html.Data.includes(NO_FORWARDED_EMAIL)).toBe(
          false
        );
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(true);
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(false);
      } catch (e) {
        console.log(e);
      }
    });

    test("analyzes email when phishing email is encrypted", async () => {
      const email = read("encrypted");
      try {
        const input = await createResponse(email);
        expect(
          input.Message.Body.Html.Data.includes(POPULAR_EMAIL_DOMAIN_VIOLATION)
        ).toBe(false);
        expect(
          input.Message.Body.Html.Data.includes(ATTACHMENT_VIOLATION)
        ).toBe(true);
        expect(input.Message.Body.Html.Data.includes(NO_FORWARDED_EMAIL)).toBe(
          false
        );
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(
          false
        );
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(true);
      } catch (e) {
        console.log(e);
      }
    });

    test("analyzes another email when phishing email is encrypted", async () => {
      const email = read("encrypted2");
      try {
        const input = await createResponse(email);
        expect(
          input.Message.Body.Html.Data.includes(POPULAR_EMAIL_DOMAIN_VIOLATION)
        ).toBe(false);
        expect(
          input.Message.Body.Html.Data.includes(ATTACHMENT_VIOLATION)
        ).toBe(true);
        expect(input.Message.Body.Html.Data.includes(NO_FORWARDED_EMAIL)).toBe(
          false
        );
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(
          false
        );
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(false);
      } catch (e) {
        console.log(e);
      }
    });

    test("does not see violations in forwarded email from Cos", async () => {
      const email = read("ar8hceu5jrp1p2ku02rdlcopm99uhd2b65acdu01");
      try {
        const input = await createResponse(email);
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(true);
        expect(
          input.Message.Body.Html.Data.includes(POPULAR_EMAIL_DOMAIN_VIOLATION)
        ).toBe(false);
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(false);
      } catch (e) {
        console.log(e);
      }
    });

    test("does not see violations in forwarded email from Yelp that has a link to www.yelp.com that URI library cant parse", async () => {
      const email = read("6qcv8kddmb51ut2otin8q2thvgeqdhb7ak191bg1");
      try {
        const input = await createResponse(email);
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(true);
        expect(
          input.Message.Body.Html.Data.includes(POPULAR_EMAIL_DOMAIN_VIOLATION)
        ).toBe(false);
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(false);
      } catch (e) {
        console.log(e);
      }
    });

    test("does not see violations in forwarded email from Quora that has lots of weird links", async () => {
      const email = read("f25maripeo8ci803g5u2oqtu5f5725hh757troo1");
      try {
        const input = await createResponse(email);
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(true);
        expect(
          input.Message.Body.Html.Data.includes(POPULAR_EMAIL_DOMAIN_VIOLATION)
        ).toBe(false);
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(false);
      } catch (e) {
        console.log(e);
      }
    });

    test("does not see violation in Sapphire Preferred email", async () => {
      const email = read("6qli6rdtol5pnf2gbpju3q03pgmpdh0p7hcsnt81");
      try {
        const input = await createResponse(email);
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(true);
        expect(
          input.Message.Body.Html.Data.includes(POPULAR_EMAIL_DOMAIN_VIOLATION)
        ).toBe(false);
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(false);
      } catch (e) {
        console.log(e);
      }
    });

    test("sees violation in email containing attachment", async () => {
      const email = read("vtv4u1rc14r7kdsndm09eugcgtjdr3pgm7e4ss01");
      try {
        const input = await createResponse(email);
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(
          false
        );
        expect(
          input.Message.Body.Html.Data.includes(POPULAR_EMAIL_DOMAIN_VIOLATION)
        ).toBe(false);
        expect(
          input.Message.Body.Html.Data.includes(ATTACHMENT_VIOLATION)
        ).toBe(true);
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(false);
      } catch (e) {
        console.log(e);
      }
    });

    test("sees violations in email with attachments", async () => {
      const email = read("jtprmhtbd0qgeh4k0abthol0vsfab43racsal501");
      try {
        const input = await createResponse(email);
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(
          false
        );
        expect(
          input.Message.Body.Html.Data.includes(ATTACHMENT_VIOLATION)
        ).toBe(true);
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(false);
      } catch (e) {
        console.log(e);
      }
    });

    test("sees violations in email containing non-top-million link", async () => {
      const email = read("ipll0sth2gapnc9l1muucqfa6vb6qf26actqj5o1");
      try {
        const input = await createResponse(email);
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(
          false
        );
        expect(
          input.Message.Body.Html.Data.includes(POPULAR_EMAIL_DOMAIN_VIOLATION)
        ).toBe(false);
        expect(
          input.Message.Body.Html.Data.includes(ATTACHMENT_VIOLATION)
        ).toBe(false);
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(true);
      } catch (e) {
        console.log(e);
      }
    });

    test("sees violations in gary's guide email with unusual links", async () => {
      const email = read("834urg4d5bgs535u9eusqdf8psn9bsm9sba4cu01");
      try {
        const input = await createResponse(email);
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(
          false
        );
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(true);
        expect(
          input.Message.Body.Html.Data.includes(ATTACHMENT_VIOLATION)
        ).toBe(false);
      } catch (e) {
        console.log(e);
      }
    });

    test("sees violations in another gary's guide email with two unusual links", async () => {
      const email = read("5blhn5g3n6adv5n0clb79v6srovomjlbl0kbl101");
      try {
        const input = await createResponse(email);
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(
          false
        );
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(true);
        expect(
          input.Message.Body.Html.Data.includes(ATTACHMENT_VIOLATION)
        ).toBe(false);
      } catch (e) {
        console.log(e);
      }
    });

    test("sees violations in spammy email with unusual link to farm.one", async () => {
      const email = read("spam");
      try {
        const input = await createResponse(email);
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(
          false
        );
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(true);
        expect(
          input.Message.Body.Html.Data.includes(ATTACHMENT_VIOLATION)
        ).toBe(false);
      } catch (e) {
        console.log(e);
      }
    });

    test("sees violations in email with multiple violations", async () => {
      const email = read("2j3bk9otdmq555ceumthujpnjluchvinhdjf9ig1");
      try {
        const input = await createResponse(email);
        expect(input.Message.Body.Html.Data.includes(NO_VIOLATIONS)).toBe(
          false
        );
        expect(
          input.Message.Body.Html.Data.includes(POPULAR_EMAIL_DOMAIN_VIOLATION)
        ).toBe(true);
        expect(
          input.Message.Body.Html.Data.includes(NON_TOP_MILLION_LINK_EMAIL)
        ).toBe(true);
        expect(
          input.Message.Body.Html.Data.includes(ATTACHMENT_VIOLATION)
        ).toBe(false);
      } catch (e) {
        console.log(e);
      }
    });
  });
});

describe("testsRequiringAWSCredentials", () => {
  describe("getForwardedEmailFromS3", () => {
    test("the fetch succeeds and parses email correctly", async () => {
      const key = "ap20t96q6vu40uqbdobh3ng0tk6bfcl6amo24701";
      try {
        const s3Object = await getForwardedEmailFromS3(key);
        const forwardedEmail = new EmailForwardParser().read(s3Object);
        expect(forwardedEmail.forwarded).toBe(true);
      } catch (e) {
        console.log(e);
      }
    });

    test("ignores email from SES", async () => {
      const key = "0cn96vo2qcmkjvs7g96gsc5jv8dqu1fkjcjb92g1";
      const s3Object = await getForwardedEmailFromS3(key);
      try {
        const input = await createResponse(s3Object);
        expect(input).toBe(undefined);
      } catch (e) {
        console.log(e);
      }
    });
  });

  describe("sendResponse", () => {
    test("sends email successfully and doesn't go to spam for outlook inbox", async () => {
      const key = "david_outlook";
      const s3Object = await getForwardedEmailFromS3(key);
      try {
        const input = await createResponse(s3Object);
        const response = await sendResponse(key, input);
        expect(response.$metadata.httpStatusCode).toBe(200);
      } catch (e) {
        console.log(e);
      }
    });

    test("sends email successfully and doesn't go to spam for gmail inbox", async () => {
      const key = "display_name_spoofing";
      const s3Object = await getForwardedEmailFromS3(key);
      try {
        const input = await createResponse(s3Object);
        const response = await sendResponse(key, input);
        expect(response.$metadata.httpStatusCode).toBe(200);
      } catch (e) {
        console.log(e);
      }
    });
  });
});
