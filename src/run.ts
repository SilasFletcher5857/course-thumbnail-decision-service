import { InfraiClient } from "./infrai_client.ts";
import { decideThumbnail } from "./thumbnail_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the example");
const request = { courseId: "biology-101", image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAC0CAIAAABqhmJGAAACJ0lEQVR4nO3TQQ0AIBDAsJOIMIQhCw98yJImFbDPZu0DRM33AuCZgSHMwBBmYAgzMIQZGMIMDGEGhjADQ5iBIczAEGZgCDMwhBkYwgwMYQaGMANDmIEhzMAQZmAIMzCEGRjCDAxhBoYwA0OYgSHMwBBmYAgzMIQZGMIMDGEGhjADQ5iBIczAEGZgCDMwhBkYwgwMYQaGMANDmIEhzMAQZmAIMzCEGRjCDAxhBoYwA0OYgSHMwBBmYAgzMIQZGMIMDGEGhjADQ5iBIczAEGZgCDMwhBkYwgwMYQaGMANDmIEhzMAQZmAIMzCEGRjCDAxhBoYwA0OYgSHMwBBmYAgzMIQZGMIMDGEGhjADQ5iBIczAEGZgCDMwhBkYwgwMYQaGMANDmIEhzMAQZmAIMzCEGRjCDAxhBoYwA0OYgSHMwBBmYAgzMIQZGMIMDGEGhjADQ5iBIczAEGZgCDMwhBkYwgwMYQaGMANDmIEhzMAQZmAIMzCEGRjCDAxhBoYwA0OYgSHMwBBmYAgzMIQZGMIMDGEGhjADQ5iBIczAEGZgCDMwhBkYwgwMYQaGMANDmIEhzMAQZmAIMzCEGRjCDAxhBoYwA0OYgSHMwBBmYAgzMIQZGMIMDGEGhjADQ5iBIczAEGZgCDMwhBkYwgwMYQaGMANDmIEhzMAQZmAIMzCEGRjCDAxhBoYwA0OYgSHMwBBmYAgzMIQZGMIMDGEGhjADQ5iBIczAEHYB+vI5oPNW+rQAAAAASUVORK5CYII=", width: 320, height: 180, deadline: "2099-01-01T00:00:00.000Z" };
const decision = decideThumbnail(request);
if (!decision.accepted || !decision.variantKey) throw new Error(decision.reason ?? "thumbnail rejected");
const client = new InfraiClient(key);
const bucket = process.env.INFRAI_BUCKET ?? "course-thumbnails";
await client.createBucket(bucket);
const uploaded = await client.upload({ file: request.image, filename: "course-source.png" });
const resized = await client.resize({ image: uploaded.id, width: request.width, height: request.height, fit: "cover", enlarge: false, format: "webp", store: true });
const signed = await client.presign(bucket, decision.variantKey);
console.log(JSON.stringify({ courseId: decision.courseId, variantKey: decision.variantKey, resize: resized, uploadUrl: signed.url, educatorStatus: "accepted" }, null, 2));
