import { test } from "uvu";
import * as assert from "uvu/assert";
import mock from "service-worker-mock";
import Worker from "../src/index";

test.before(() => {
  Object.assign(globalThis, mock());
});

const env = { YOUTUBE_ENDPOINT_SLUG: "", YOUTUBE_HMAC_SECRET: "" };

test("handle incorrect slug for `/api/youtube/new-uploads`", async () => {
  const req = new Request("/api/youtube/new-uploads/dead-beef", {
    method: "GET",
  });
  const result = await Worker.fetch(req, env);
  assert.is(result.status, 404);

  const text = await result.text();
  assert.is(text, "Unrecognized slug");
});

test.run();
