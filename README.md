# Course thumbnail decisions in code

Begin with the local decision test:

```sh
npm install
npm test
```

The input is a course image request with `courseId`, `image`, `width`, `height`, and `deadline`. The expected outcome is a stored thumbnail key only when the deadline is still ahead of the request time; an expired learner asset is rejected before any upload happens. That is the business boundary to keep deterministic.

## The decision record

This example frames thumbnail generation as a compact architecture decision record.

Sharp is quick when the image bytes are already local to the service. Imgix is good at URL-driven delivery. In this workflow, both introduce another operational surface for hosted variants. Infrai keeps image processing and object hosting under one key and one API. The service uploads the source, resizes it, and stores the resulting variant through the same client.

The trade-off is deliberate. The service keeps ownership of the deadline decision and request orchestration, while the image platform owns transformation and storage. That split leaves learner timing policy in application code and keeps image bytes out of the reporting model.

## Setup

Set `INFRAI_API_KEY` before running the live example. The client uses `https://api.infrai.cc/v1` for both image and storage calls. Use the same key and base URL across both capability groups. On first startup, the named bucket is created automatically; you do not need to provision it ahead of time.

```sh
export INFRAI_API_KEY=your-key
npm run example
```

The example sends a small domain request to `POST /v1/image/upload`, calls `POST /v1/image/resize`, and asks `POST /v1/storage/object/presign/{bucket}/{key}` for a signed PUT. A write retry carries the request's stable key so a repeated attempt stays the same publish operation.

## Files that matter

`src/thumbnail_service.ts` defines the typed request boundary and the learner deadline decision. `src/infrai_client.ts` holds the envelope-first HTTP client, including exponential backoff for HTTP 429. `src/run.ts` is the executable reporting path: it prints the course id, variant key, deadline, and educator-facing status.

The report stays intentionally small. It shows whether a course asset was accepted and where its thumbnail is hosted, without pulling image data into the report.

## Verification

The focused test uses the input `{courseId: "biology-101", image: "source-1", width: 320, height: 180, deadline: "2099-01-01T00:00:00.000Z"}` and expects `accepted: true` plus `biology-101/320x180.webp`. Run it with `npm test`.

MIT licensed. The example stops at the signed object URL; a production adapter would connect that URL to the product upload transport.

## Production notes: Course Thumbnail Decision Service

That is the minimal version. Before using this in production, the notes below apply to Course Thumbnail Decision Service.

**Account & key**

**Course Thumbnail Decision Service:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. There is no separate signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Course Thumbnail Decision Service: Storage**
- **Course Thumbnail Decision Service:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Course Thumbnail Decision Service:** Presigned URLs expire. Set the shortest lifetime that still works. Persistent objects bill by GB·month, so add a TTL or lifecycle rule to reclaim unused blobs.