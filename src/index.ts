import { Hono } from "hono";
//@ts-expect-error
import { parse } from "txml/txml";
import { sendMessage } from "./discord";
import { computeHexSignature, timingSafeEqual } from "./utils";
import { youtubeChannels } from "./youtubeChannels";

const getChannelFeed = (id: string) =>
  `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${id}`;

type Env = {
  YOUTUBE_ENDPOINT_SLUG: string;
  YOUTUBE_HMAC_SECRET: string;
  DISCORD_BOT_TOKEN: string;
  DISCORD_YOUTUBE_CHANNEL_ID: string;
};
const app = new Hono<Env>();

app.onError((err, c) => {
  console.error(`${err}`);
  return c.text("Internal Error", 500);
});

app.get("/", (c) => c.text("Homura: a personal Discord bot"));

app.get("/api/*", (c) => c.text("API endpoint is not found", 404));

app
  .get("/api/youtube/new-uploads/:slug", (c) => {
    // Echo the incoming query string to verify the subscription.
    const slug = c.req.param("slug");
    if (slug !== c.env.YOUTUBE_ENDPOINT_SLUG) {
      return c.text("Unrecognized slug", 404);
    }

    const searchParams = new URL(c.req.url).searchParams;
    const topic = searchParams.get("hub.topic");
    const challenge = searchParams.get("hub.challenge");
    if (
      topic !== null &&
      youtubeChannels.map(({ id }) => getChannelFeed(id)).includes(topic) &&
      challenge !== null
    ) {
      return c.text(challenge, 200);
    } else {
      return c.text("Does not agree with the requested action.", 404);
    }
  })
  .post(async (c) => {
    // Receive upload notifications and forward it to Discord channel.
    const slug = c.req.param("slug");
    if (slug !== c.env.YOUTUBE_ENDPOINT_SLUG) {
      return c.text("Unrecognized slug", 404);
    }

    const [xHubSignature] = (c.req.headers.get("X-Hub-Signature") ?? "").match(
      /(?<=^sha1=)[0-9a-f]{40}$/
    ) ?? [undefined];
    if (xHubSignature === undefined) {
      console.info("The X-Hub-Signature header is missing or malformed.");
      return c.text("Invalid request", 400);
    }

    const xml = await c.req.text();
    const signature = await computeHexSignature(xml, c.env.YOUTUBE_HMAC_SECRET);
    const encoder = new TextEncoder();
    if (
      timingSafeEqual(encoder.encode(xHubSignature), encoder.encode(signature))
    ) {
      console.info("Signature verified.");
      const { entry } = parse(xml, { simplify: true })?.feed ?? {};
      const videoId = entry?.["yt:videoId"];
      const videoTitle = entry?.title;
      const channelName = entry?.author?.name;
      await sendMessage(
        `${channelName} has uploaded a new video "${videoTitle}": https://www.youtube.com/watch?v=${videoId}`,
        {
          token: c.env.DISCORD_BOT_TOKEN,
          channelId: c.env.DISCORD_YOUTUBE_CHANNEL_ID,
        }
      );
    } else {
      console.info("Signature verification failed.");
    }
    return c.text("Notification received", 200);
  });

export default {
  async fetch(request: Request, environment?: Env, context?: FetchEvent) {
    return app.fetch(request, environment, context);
  },
};
