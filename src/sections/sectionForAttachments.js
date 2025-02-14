import {ATTACHMENT_VIOLATION} from "../../index.js";

export const sectionForAttachments = (parentEmail) => {
    let attachments = parentEmail.attachments
        .filter((attachment) => attachment.hasOwnProperty("filename"))
        .map((attachment) => ({name: attachment.filename}));
    return {
        isViolation: attachments.length > 0,
        title: "Contains an attachment",
        explanation: ATTACHMENT_VIOLATION,
        detail: `<ul style="margin: 0;">` +
            attachments.map((attachment) => `<li>${attachment.name}</li>`).join("") +
            `</ul>`
    };
};
