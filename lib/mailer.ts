import nodemailer from 'nodemailer'

const SITE_URL = 'https://mediout.jp'
const NOTE_URL = 'https://note.com/medical_output/n/nea98d61048fd'

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter() {
  if (transporter) return transporter

  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) {
    throw new Error('環境変数 GMAIL_USER / GMAIL_APP_PASSWORD が設定されていません')
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
  return transporter
}

export async function sendWelcomeEmail(to: string) {
  const subject = 'MediOutへようこそ！'

  const text = `この度はMediOutにご登録いただき、ありがとうございます。

MediOutでは以下の3つの学習モードをご用意しています。

■ 自己学習モード
1問ずつ解いて、すぐに正答と解説を確認できます。

■ テストモード
本番と同じ形式で時間を計って演習できます。

■ 解説投稿
自分で解説を書いて投稿できます。書くことが最高の勉強になります。

MediOutを作った経緯はこちら
${NOTE_URL}

ご質問・ご要望は、お問い合わせフォームからお気軽にご連絡ください。
${SITE_URL}/contact

MediOut運営`

  const html = `
<div style="font-family: sans-serif; line-height: 1.7; color: #1f2933; max-width: 560px; margin: 0 auto;">
  <p>この度はMediOutにご登録いただき、ありがとうございます。</p>

  <p>MediOutでは以下の3つの学習モードをご用意しています。</p>

  <p>
    <strong>■ 自己学習モード</strong><br>
    1問ずつ解いて、すぐに正答と解説を確認できます。
  </p>
  <p>
    <strong>■ テストモード</strong><br>
    本番と同じ形式で時間を計って演習できます。
  </p>
  <p>
    <strong>■ 解説投稿</strong><br>
    自分で解説を書いて投稿できます。書くことが最高の勉強になります。
  </p>

  <p>
    <a href="${NOTE_URL}">MediOutを作った経緯はこちら</a>
  </p>

  <p>
    ご質問・ご要望は、<a href="${SITE_URL}/contact">お問い合わせフォーム</a>からお気軽にご連絡ください。
  </p>

  <p>MediOut運営</p>
</div>`

  await getTransporter().sendMail({
    from: `"MediOut" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  })
}
