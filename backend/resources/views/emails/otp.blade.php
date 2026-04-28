<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
        <tr>
            <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
                    {{-- Header --}}
                    <tr>
                        <td style="background:linear-gradient(135deg,#245dff 0%,#7c3aed 100%);padding:32px 40px;text-align:center;">
                            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.02em;">
                                JotDown
                            </h1>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding:40px;">
                            <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">
                                @if($purpose === 'verify')
                                    Xác thực email của bạn
                                @else
                                    Đặt lại mật khẩu
                                @endif
                            </h2>
                            <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
                                @if($purpose === 'verify')
                                    Cảm ơn bạn đã sử dụng JotDown! Nhập mã bên dưới để xác thực email của bạn.
                                @else
                                    Bạn đã yêu cầu đặt lại mật khẩu. Sử dụng mã bên dưới để tiếp tục.
                                @endif
                            </p>

                            {{-- OTP Box --}}
                            <div style="text-align:center;margin:0 0 28px;">
                                <div style="display:inline-block;background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:16px 40px;">
                                    <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#245dff;">{{ $otp }}</span>
                                </div>
                            </div>

                            <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6;">
                                Mã này sẽ hết hạn sau <strong style="color:#64748b;">5 phút</strong>.<br>
                                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
                            </p>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="padding:20px 40px;background:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
                            <p style="margin:0;font-size:12px;color:#94a3b8;">
                                &copy; {{ date('Y') }} JotDown. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
