export const accounts = [
  {
    name: "gmail",
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_PASS!,
    },
  },
//   {
//     name: "outlook",
//     host: "outlook.office365.com",
//     port: 993,
//     secure: true,
//     auth: {
//       user: process.env.OUTLOOK_USER!,
//       pass: process.env.OUTLOOK_PASS!,
//     },
//   },
];
