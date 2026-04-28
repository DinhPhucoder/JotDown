<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chia sẻ ghi chú</title>
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
                            <h1 style="font-family: 'Google Sans Flex', 'Inter', sans-serif; font-size: 22px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 24px;">Xin chào,</h1>
                            
                            <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 32px; margin-top: 0;">
                                <strong>{{ $sender->name }}</strong> ({{ $sender->email }}) vừa chia sẻ một ghi chú với bạn trên Jot Down. Bạn có thể truy cập ngay để xem nội dung.
                            </p>

                            <!-- Note Detail Box -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <p style="font-family: 'Google Sans Flex', 'Inter', sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; margin: 0 0 8px 0;">
                                            Tên ghi chú
                                        </p>
                                        <p style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0 0 24px 0;">
                                            {{ $note->title ?: 'Ghi chú không tiêu đề' }}
                                        </p>
                                        
                                        <p style="font-family: 'Google Sans Flex', 'Inter', sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; margin: 0 0 8px 0;">
                                            Quyền hạn
                                        </p>
                                        <p style="font-size: 16px; font-weight: 600; color: #4f46e5; margin: 0;">
                                            {{ $permission === 'edit' ? 'Có thể chỉnh sửa' : 'Chỉ xem' }}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Action Button -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 40px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ config('app.frontend_url') }}/notes/{{ $note->id }}" style="font-family: 'Google Sans Flex', 'Inter', sans-serif; display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                                            Mở Ghi Chú Ngay
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 32px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
                            <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
                                Email này được gửi tự động từ hệ thống Jot Down.<br>
                                © 2026 Jot Down. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>