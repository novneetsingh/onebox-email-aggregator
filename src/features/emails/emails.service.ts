import { prisma } from "../../config/prisma";
import { openSearchClient } from "../../config/opensearch";

const OS_INDEX = process.env.OS_INDEX_NAME ?? "onebox-emails";

export const getEmails = (
  userId: string,
  {
    folder,
    category,
    accountId,
    skip,
    take,
  }: {
    folder?: string;
    category?: string;
    accountId?: string;
    skip: number;
    take: number;
  },
) =>
  prisma.email.findMany({
    where: {
      userId,
      ...(folder ? { folder } : {}),
      ...(category ? { category } : {}),
      ...(accountId ? { accountId } : {}),
    },
    orderBy: { date: "desc" },
    skip,
    take,
    select: {
      id: true,
      messageId: true,
      subject: true,
      snippet: true,
      from: true,
      to: true,
      folder: true,
      category: true,
      isRead: true,
      date: true,
      accountId: true,
    },
  });

export const searchEmails = async (userId: string, q: string) => {
  const result = await openSearchClient.search({
    index: OS_INDEX,
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: q,
                fields: ["subject^3", "from^2", "body", "snippet"],
                fuzziness: "AUTO",
              },
            },
          ],
          filter: [{ term: { userId } }],
        },
      },
      size: 50,
      _source: ["messageId", "subject", "from", "snippet", "folder", "date"],
    },
  });

  return (result.body?.hits?.hits ?? []).map((h: any) => ({
    id: h._id,
    score: h._score,
    ...h._source,
  }));
};

export const getEmailById = async (id: string, userId: string) => {
  const email = await prisma.email.findFirst({ where: { id, userId } });
  if (!email) return null;

  if (!email.isRead)
    await prisma.email.update({ where: { id }, data: { isRead: true } });

  return email;
};

export const deleteEmailById = async (id: string, userId: string) => {
  const email = await prisma.email.findFirst({ where: { id, userId } });
  if (!email) return null;

  await prisma.email.delete({ where: { id } });
  await openSearchClient
    .delete({ index: OS_INDEX, id: email.messageId })
    .catch(() => {});

  return email;
};
