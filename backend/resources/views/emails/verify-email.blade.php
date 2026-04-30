<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác thực email</title>
    <!-- Fallback fonts for email -->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    </style>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f7ff; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
    
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f3f7ff; padding: 40px 20px;">
        <tr>
            <td align="center">
                
                <!-- Main Card -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid rgba(76, 92, 148, 0.18); box-shadow: 0 10px 25px -5px rgba(49, 105, 255, 0.1); overflow: hidden;">
                    
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 32px 40px; border-bottom: 1px solid #f1f5f9;">
                            <a href="{{ config('app.frontend_url') }}" style="font-family: 'Google Sans Flex', 'Inter', sans-serif; font-size: 24px; font-weight: 700; color: #0f172a; text-decoration: none; letter-spacing: -0.5px;">
                                Jot<span style="color: #4f46e5;">Down</span>
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Content Area -->
                    <tr>
                        <td style="padding: 40px;">
                            <h1 style="font-family: 'Google Sans Flex', 'Inter', sans-serif; font-size: 22px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 24px;">Xác thực email của bạn,</h1>
                            
                            <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 32px; margin-top: 0;">
                                Cảm ơn bạn đã sử dụng Jot Down! Bạn vui lòng nhấn vào nút bên dưới để xác thực địa chỉ email của mình.
                            </p>

                            <!-- Action Button -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $url }}" style="font-family: 'Google Sans Flex', 'Inter', sans-serif; display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                                            Xác thực Email Ngay
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;">
                                Link này sẽ hết hạn sau <strong>60 phút</strong>.<br>
                                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 32px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
                            <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
                                Email này được gửi tự động từ hệ thống Jot Down.<br>
                                © {{ date('Y') }} Jot Down. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
