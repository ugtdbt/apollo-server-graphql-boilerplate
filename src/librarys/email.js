const emailconfig = require('./../config/email.json');
const nodemailer = require('nodemailer');
const simplenodelogger = require('simple-node-logger');

let sendmail = async (emailtemplate) => {

    try
    {

        const log = simplenodelogger.createSimpleFileLogger('emaillogger.log');

        let emailtemplateobject = {
            from: '"'+ process.env.FROM_NAME +'" <'+ process.env.FROM_EMAIL +'>', // sender address
            ...emailtemplate
        };

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport(emailconfig);

        // send mail with defined transport object
        let info = await transporter.sendMail(emailtemplateobject);

        console.log("Message sent: %s", info.messageId);
        log.info("Message sent: %s", info.messageId);

        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        log.info("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    }
    catch(e)
    {
        console.log(e);
    }
};
module.exports = {sendmail: sendmail};