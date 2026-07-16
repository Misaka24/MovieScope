import assert from "node:assert/strict";
import test from "node:test";

import { parseDohAddresses } from "./providers.mjs";

test("TMDB DoH parser keeps unique IPv4 addresses", () => {
  assert.deepEqual(
    parseDohAddresses({
      Answer: [
        { type: 5, data: "example.cloudfront.net." },
        { type: 1, data: "65.9.175.66" },
        { type: 1, data: "65.9.175.66" },
        { type: 28, data: "2001:db8::1" },
        { type: 1, data: "not-an-ip" },
        { type: 1, data: "65.9.175.84" },
      ],
    }),
    ["65.9.175.66", "65.9.175.84"],
  );
});

test("TMDB DoH parser handles empty answers", () => {
  assert.deepEqual(parseDohAddresses(null), []);
  assert.deepEqual(parseDohAddresses({ Answer: [] }), []);
});
