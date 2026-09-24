import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const uploadSchema = z.object({
  key: z.string().min(1),
  contentType: z.string().default("image/jpeg"),
  base64Data: z.string().min(1),
});

export const uploadToR2Fn = createServerFn({ method: "POST" })
  .validator((d: unknown) => uploadSchema.parse(d))
  .handler(async ({ data }) => {
    const { uploadToR2 } = await import("./r2.server");
    const buffer = Buffer.from(data.base64Data, "base64");
    const url = await uploadToR2(data.key, buffer, data.contentType);
    return {
      success: true,
      url,
      key: data.key,
      size: buffer.length,
    };
  });

const deleteSchema = z.object({
  key: z.string().min(1),
});

export const deleteFromR2Fn = createServerFn({ method: "POST" })
  .validator((d: unknown) => deleteSchema.parse(d))
  .handler(async ({ data }) => {
    const { deleteFromR2 } = await import("./r2.server");
    return await deleteFromR2(data.key);
  });

const bulkDeleteSchema = z.object({
  keys: z.array(z.string().min(1)),
});

export const bulkDeleteFromR2Fn = createServerFn({ method: "POST" })
  .validator((d: unknown) => bulkDeleteSchema.parse(d))
  .handler(async ({ data }) => {
    const { bulkDeleteFromR2 } = await import("./r2.server");
    return await bulkDeleteFromR2(data.keys);
  });

const trashSchema = z.object({
  key: z.string().min(1),
});

export const moveToTrashR2Fn = createServerFn({ method: "POST" })
  .validator((d: unknown) => trashSchema.parse(d))
  .handler(async ({ data }) => {
    const { moveToTrashR2 } = await import("./r2.server");
    return await moveToTrashR2(data.key);
  });

export const restoreFromTrashR2Fn = createServerFn({ method: "POST" })
  .validator((d: unknown) => trashSchema.parse(d))
  .handler(async ({ data }) => {
    const { restoreFromTrashR2 } = await import("./r2.server");
    return await restoreFromTrashR2(data.key);
  });
