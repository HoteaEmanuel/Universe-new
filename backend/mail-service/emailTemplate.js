export const VERIFICATION_EMAIL = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
<img src="https://i.imgur.com/cv2yCX7.png" alt="logo" style="display: block; margin: 20px auto; width: 150px; position: absolute; top: 20px; left: 50%; transform: translateX(-50%);" />
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border: 1px solid #dddddd; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                    
                        <td style="padding: 40px 40px 20px 40px; text-align: center;  background: linear-gradient(135deg, #9400D3 0%, #7a00c2 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Verify Your Account</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                                Hello,
                            </p>
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                                Thank you for signing up! To complete your registration, please enter the verification code below in the app's authentication page.
                            </p>
                            
                            <!-- Verification Code Box -->
                            <table role="presentation" style="width: 100%; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="background: linear-gradient(135deg, #9400D3 0%, #7a00c2 100%); border-radius: 8px; padding: 30px; display: inline-block;">
                                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                                            <p style="margin: 0; font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">{{VERIFICATION_CODE}}</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                                This code will expire in <strong>15 minutes</strong>.
                            </p>
                            
                            <!-- Instructions -->
                            <div style="background-color: #f8f9fa; border-left: 4px solid #9400D3; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #333333;">
                                    How to verify:
                                </p>
                                <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #666666; line-height: 22px;">
                                    <li>Go to the authentication page in the app</li>
                                    <li>Enter the verification code above</li>
                                    <li>Click "Verify" to complete your registration</li>
                                </ol>
                            </div>
                            
                            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 20px; color: #666666;">
                                If you didn't create an account, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0 0 10px 0; font-size: 12px; line-height: 18px; color: #999999; text-align: center;">
                                This is an automated message, please do not reply to this email.
                            </p>
                            <p style="margin: 0; font-size: 12px; line-height: 18px; color: #999999; text-align: center;">
                                © 2026 Universe. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
export const WELCOME_EMAIL = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
    "
  >
    <table role="presentation" style="width: 100%; border-collapse: collapse">
      <tr>
        <td align="center" style="padding: 40px 20px">
          <table
            role="presentation"
            style="
              max-width: 600px;
              width: 100%;
              border-collapse: collapse;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            "
          >
            <!-- Header -->

            <!-- Content -->
            <tr>
              
              <td style="padding: 2rem 4rem" >
                <img src="https://i.imgur.com/cv2yCX7.png" alt="logo"
" style="display:flex;width: 50%;margin:0 auto;margin-bottom: 2rem;"/>
                
                <p style="margin: 0 0 20px 0; font-size: 18px; color: #333333">
                  Hi <strong>{{USER_NAME}}</strong>,
                </p>
                <p
                  style="
                    margin: 0 0 20px 0;
                    font-size: 16px;
                    line-height: 24px;
                    color: #555555;
                  "
                >
                  Welcome to <strong>{{APP_NAME}}</strong>! We're excited to
                  have you on board. Connect with other students around the
                  world, share experiences and stay tuned for the university
                  news & events!
                </p>
                <p
                  style="
                    margin: 0 0 30px 0;
                    font-size: 16px;
                    line-height: 24px;
                    color: #555555;
                  "
                >
                  Your account has been successfully verified and you're all set
                  to get started!
                </p>

                <!-- CTA Button -->
                <table role="presentation" style="margin: 30px 0">
                  <tr>
                    <td align="center">
                      <a
                        href="{{APP_URL}}"
                        style="
                          display: inline-block;
                          padding: 15px 40px;
                          background-color: #9400D3;
                          color: #ffffff;
                          text-decoration: none;
                          border-radius: 5px;
                          font-size: 16px;
                          font-weight: bold;
                        "
                        >Get Started</a
                      >
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    margin: 30px 0 0 0;
                    font-size: 14px;
                    line-height: 22px;
                    color: #666666;
                  "
                >
                  If you have any questions, feel free to reach out to our
                  support team.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  padding: 30px;
                  background-color: #f8f9fa;
                  border-radius: 0 0 8px 8px;
                  text-align: center;
                "
              >
                <p style="margin: 0; font-size: 12px; color: #999999">
                  © 2026 {{APP_NAME}}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
export const RESET_PASSWORD_EMAIL = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f5f6fa;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 500px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 30px;
      text-align: center;
    }
    h2 {
      color: #333;
    }
    p {
      color: #555;
      font-size: 15px;
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      background-color: #9400D3;
      color: white !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: bold;
    }
    .button:hover {
      background-color: #7a00c2;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #888;
    }
      .img{
        height: 8rem;
        width: 12rem;
        margin-bottom: 2rem;}
  </style>
</head>
<body>

  <div class="container">
    <img src="https://i.imgur.com/cv2yCX7.png" alt="logo" class="img" />
    <h2>Reset your password</h2>
    <p>We received a request to reset your password. Click the button below to create a new one:</p>

    <a href={{URL}} class="button">Reset Password</a>
    
    <p>If you didn’t request this, you can safely ignore this email.</p>
    <div class="footer">
      © 2026 Universe. All rights reserved.
    </div>
  </div>
</body>
</html>

`;
export const BLOCKED_ACCOUNT_EMAIL = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your account has been blocked</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f5f6fa;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 500px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 30px;
      text-align: center;
    }
    h2 {
      color: #333;
    }
    p {
      color: #555;
      font-size: 15px;
    }
    .reason-box {
      background-color: #f8f9fa;
      border-left: 4px solid #9400D3;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      text-align: left;
      font-size: 14px;
      color: #333;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #888;
    }
      .img{
        height: 8rem;
        width: 12rem;
        margin-bottom: 2rem;}
  </style>
</head>
<body>

  <div class="container">
    <img src="https://i.imgur.com/cv2yCX7.png" alt="logo" class="img" />
    <h2>Your account has been blocked</h2>
    <p>Hi {{USER_NAME}},</p>
    <p>An administrator has blocked your Universe account. You will not be able to log in until it is unblocked.</p>
    <div class="reason-box">
      <strong>Reason:</strong> {{REASON}}
    </div>
    <p>If you believe this was a mistake, please contact support.</p>
    <div class="footer">
      © 2026 Universe. All rights reserved.
    </div>
  </div>
</body>
</html>

`;
