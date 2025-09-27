/**
 * Optimized knowledge base for AI reply generation (RAG-ready).
 * Each entry is short, self-contained, and includes example replies.
 */
export const knowledgeBaseData = [
  {
    category: "Interested",
    content: `
      Category: Interested
      Goal: Convert interest into a scheduled meeting.
      Action: Reply enthusiastically, thank the sender, and share the meeting link.

      Meeting Link: https://cal.com/example

      Example replies:
      - "Thank you for your interest! You can schedule a meeting here: https://cal.com/example"
      - "Excited to connect! Please book a time here: https://cal.com/example"
    `,
  },
  {
    category: "Meeting Booked",
    content: `
      Category: Meeting Booked
      Goal: Confirm the meeting positively, no need to rebook.
      Action: Short, polite confirmation expressing excitement.

      Example replies:
      - "Great, looking forward to our chat!"
      - "Perfect, see you then!"
    `,
  },
  {
    category: "Not Interested",
    content: `
      Category: Not Interested
      Goal: End the conversation politely and positively.
      Action: Thank them for their time, wish them well, no persuasion.

      Example replies:
      - "Thank you for your time and consideration. Wishing you the best ahead!"
      - "I appreciate your response. Best of luck with your future endeavors!"
    `,
  },
  {
    category: "Out of Office",
    content: `
      Category: Out of Office
      Goal: No reply needed, automated response.
      Action: Do not generate a reply. Mark as 'No action required'.
    `,
  },
  {
    category: "Spam",
    content: `
      Category: Spam
      Goal: No reply needed.
      Action: Ignore the email. Do not generate a response.
    `,
  },
];
