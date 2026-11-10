import { z } from "zod";

export const thumbnailRequest = z.object({
  courseId: z.string().min(1), image: z.string().min(1), width: z.number().int().positive(), height: z.number().int().positive(), deadline: z.string().datetime()
});
export type ThumbnailRequest = z.infer<typeof thumbnailRequest>;

export type ThumbnailDecision = { accepted: boolean; courseId: string; variantKey?: string; reason?: string };

export function decideThumbnail(input: unknown, now = new Date()): ThumbnailDecision {
  const request = thumbnailRequest.parse(input);
  if (new Date(request.deadline) <= now) return { accepted: false, courseId: request.courseId, reason: "learner deadline has passed" };
  return { accepted: true, courseId: request.courseId, variantKey: `${request.courseId}/${request.width}x${request.height}.webp` };
}
