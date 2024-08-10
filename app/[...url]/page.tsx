import React from "react";
import { ragChat } from "../lib/rag-chat";
import { redis } from "../lib/redis";
import ChatWrapper from "../components/chatWrapper";
import { cookies } from "next/headers";

interface PageProps {
  params: {
    url: string | string[] | undefined;
  };
}

const reconstructUrl = ({ url }: { url: string[] }) => {
  const decodedComponents = url.map((component) =>
    decodeURIComponent(component)
  );
  return decodedComponents.join("/");
};

const Page = async ({ params }: PageProps) => {
  const sessionCookie = cookies().get("sessionId")?.value;
  const reconstrucedUrl = reconstructUrl({ url: params.url as string[] });

  const sessionId = (reconstrucedUrl + "--" + sessionCookie).replace(/\//g, "");
  console.log(params);

  const isAlreadyIndexed = await redis.sismember(
    "indexed-urls",
    reconstrucedUrl
  );

  const initialMessages = await ragChat.history.getMessages({
    amount: 10,
    sessionId,
  });

  console.log("isAlreadyIndexed", isAlreadyIndexed);
  if (!isAlreadyIndexed) {
    await ragChat.context.add({
      type: "html",
      source: reconstrucedUrl,
      config: { chunkOverlap: 50, chunkSize: 200 },
    });
    await redis.sadd("indexed-urls", reconstrucedUrl);
  }

  return (
    <ChatWrapper sessionId={sessionId} initialMessages={initialMessages} />
  );
};

export default Page;
