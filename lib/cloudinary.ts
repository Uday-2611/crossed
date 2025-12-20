export const uploadToCloudinary = async (imageUri: string) => {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Missing Cloudinary env variables");
    }

    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    const mimeType = fileType === 'png' ? 'image/png' : fileType === 'webp' ? 'image/webp' : 'image/jpeg';

    const formData = new FormData();
    formData.append("file", {
        uri: imageUri,
        type: mimeType,
        name: `upload.${fileType}`,
    } as any);

    formData.append("upload_preset", uploadPreset);
    formData.append("cloud_name", cloudName);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
            method: "POST",
            body: formData,
        }
    );

    const data = await response.json();

    if (data.secure_url) {
        return data.secure_url;
    } else {
        throw new Error("Upload failed: " + JSON.stringify(data));
    }
};