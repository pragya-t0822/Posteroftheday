<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="420" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#f43f5e,#fb923c);padding:32px 32px 24px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Poster of the Day</h1>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Password Reset</p>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>{{ $userName }}</strong>,</p>
                            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">Use the OTP below to reset your password. This code is valid for <strong>10 minutes</strong>.</p>
                            <!-- OTP Box -->
                            <div style="text-align:center;margin:0 0 24px;">
                                <div style="display:inline-block;background-color:#fef2f2;border:2px dashed #fca5a5;border-radius:12px;padding:16px 40px;">
                                    <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#e11d48;font-family:monospace;">{{ $otp }}</span>
                                </div>
                            </div>
                            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.5;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;text-align:center;">
                            <p style="margin:0;color:#9ca3af;font-size:11px;">&copy; {{ date('Y') }} Poster of the Day. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
