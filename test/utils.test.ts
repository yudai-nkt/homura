import { test } from "uvu";
import * as assert from "uvu/assert";
import { timingSafeEqual } from "../src/utils";

test("should return the result of a comparison.", () => {
  const encoder = new TextEncoder();
  const akemi = encoder.encode("akemi");
  const homura = encoder.encode("homura");
  const madoka = encoder.encode("madoka");

  assert.not.ok(timingSafeEqual(akemi, homura));
  assert.not.ok(timingSafeEqual(homura, madoka));
  assert.ok(timingSafeEqual(homura, homura));
});

test.run();
