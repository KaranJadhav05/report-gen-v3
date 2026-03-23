import { v2 as cloudinary } from "cloudinary";

export function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary credentials are not configured in environment variables.",
    );
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

export async function uploadExcelFileToCloudinary(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
) {
  configureCloudinary();

  const base64Data = buffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64Data}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "reportgen",
    resource_type: "raw",
    public_id: originalName.replace(/\.[^/.]+$/, ""),
    unique_filename: true,
    overwrite: false,
  });

  if (!result || !result.secure_url || !result.public_id) {
    throw new Error("Cloudinary upload did not return a valid response");
  }

  return { fileUrl: result.secure_url, cloudinaryId: result.public_id };
}
