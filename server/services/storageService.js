// The ONLY module that knows storage is Supabase Storage.
//
// Swapping to S3, R2 or MinIO means reimplementing put/remove here. The contract
// is deliberately tiny — an uploaded document is written, read once and deleted,
// so nothing above needs signed URLs, listing or lifecycle rules.

const { rawClient } = require("./databaseService");

const BUCKET = process.env.INGEST_BUCKET || "ingest";

class StorageError extends Error {
  constructor(message, { missingBucket = false } = {}) {
    super(message);
    this.name = "StorageError";
    this.missingBucket = missingBucket;
  }
}

async function put(objectPath, buffer, contentType) {
  const client = rawClient();
  if (!client) throw new StorageError("Storage is not configured on this server.");

  const { error } = await client.storage
    .from(BUCKET)
    .upload(objectPath, buffer, { contentType, upsert: false });

  if (error) {
    if (/bucket/i.test(error.message || "")) {
      throw new StorageError(
        `Storage bucket "${BUCKET}" does not exist. Create it (private) in Supabase, or set INGEST_BUCKET.`,
        { missingBucket: true },
      );
    }
    throw new StorageError(error.message);
  }
  return objectPath;
}

// Never throws: cleanup failing must not turn a completed update into an error
// for the user. It is logged so a leaked object is still visible in the logs.
async function remove(objectPath) {
  const client = rawClient();
  if (!client) return false;
  const { error } = await client.storage.from(BUCKET).remove([objectPath]);
  if (error) {
    console.error(`storageService: failed to delete ${objectPath}: ${error.message}`);
    return false;
  }
  return true;
}

module.exports = { put, remove, BUCKET, StorageError };
