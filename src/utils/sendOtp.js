
import twilio from 'twilio'
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);



const sendOtp = (phoneNumber)=>{
try {
        async function createVerification() 
        {
            const verification = await client.verify.v2
              .services(accountSid)
              .verifications.create({
                channel: "sms",
                to:phoneNumber,
              });
          
            console.log(verification.status);
          }

          createVerification();
          
} catch (error) {
    console.log(error)
}
}

export {sendOtp};