import assert from "node:assert/strict";
import { decideThumbnail } from "./thumbnail_service.ts";

const accepted = decideThumbnail({ courseId: "biology-101", image: "source-1", width: 320, height: 180, deadline: "2099-01-01T00:00:00.000Z" }, new Date("2026-01-01T00:00:00.000Z"));
assert.deepEqual(accepted, { accepted: true, courseId: "biology-101", variantKey: "biology-101/320x180.webp" });
const expired = decideThumbnail({ courseId: "biology-101", image: "source-1", width: 320, height: 180, deadline: "2025-01-01T00:00:00.000Z" }, new Date("2026-01-01T00:00:00.000Z"));
assert.equal(expired.accepted, false);
console.log("thumbnail decision test passed");
