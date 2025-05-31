import nodemailer from 'nodemailer'
const { EMAIL_USERNAME, EMAIL_PASSWORD } = process.env;

export const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: EMAIL_USERNAME,
        pass: EMAIL_PASSWORD
    }
})

export const sendEmail = async (to, subject, text) => {
    const mailOption = {
        from: EMAIL_USERNAME,
        to,
        subject,
        text
    }
    try {
        await transporter.sendMail(mailOption)
    } catch (error) {
        console.log(error)
    }
}
