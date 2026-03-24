const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "0b809c1a4bfa8e",
        pass: "8ae1f86bf1ee5d",
    },
});

module.exports = {
    sendMail: async (to, url) => {
        const info = await transporter.sendMail({
            from: 'Admin@hahah.com',
            to: to,
            subject: "request resetpassword email",
            text: "click vao day de reset", // Plain-text version of the message
            html: "click vao <a href=" + url + ">day</a> de reset", // HTML version of the message
        });

        console.log("Message sent:", info.messageId);
    },

    sendPasswordMail: async (to, username, password) => {
        const info = await transporter.sendMail({
            from: 'Admin@hahah.com',
            to: to,
            subject: "Thông tin tài khoản của bạn",
            text: `Xin chào ${username},\n\nTài khoản của bạn đã được tạo.\nUsername: ${username}\nPassword: ${password}\n\nVui lòng đăng nhập và đổi mật khẩu ngay sau khi đăng nhập lần đầu.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
                    <h2 style="color: #4f46e5;">🎉 Chào mừng, ${username}!</h2>
                    <p>Tài khoản của bạn đã được tạo thành công. Dưới đây là thông tin đăng nhập:</p>
                    <table style="width:100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px; font-weight: bold; background:#f3f4f6;">Username</td>
                            <td style="padding: 8px; background:#f9fafb;">${username}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold; background:#f3f4f6;">Password</td>
                            <td style="padding: 8px; background:#f9fafb; font-family: monospace; letter-spacing: 1px;">${password}</td>
                        </tr>
                    </table>
                    <p style="margin-top: 16px; color: #ef4444;"><strong>⚠️ Lưu ý:</strong> Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="font-size: 12px; color: #9ca3af;">Email này được gửi tự động, vui lòng không trả lời.</p>
                </div>
            `,
        });

        console.log(`✅ Password email sent to ${to} — messageId: ${info.messageId}`);
    }
}