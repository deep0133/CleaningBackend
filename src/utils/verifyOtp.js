const verifyOtp = async (phoneNumber, otpCode) => {
    try {
      const verificationCheck = await client.verify.v2
        .services(verifySid)
        .verificationChecks.create({ to: phoneNumber, code: otpCode });
  
      console.log('Verification status:', verificationCheck.status); // 'approved' or 'failed'
    } catch (error) {
      console.error('Error verifying OTP:', error);
    }
  };
  

 export {verifyOtp};
  