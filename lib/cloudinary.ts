export const uploadToCloudinary = async (imageUri: string) => {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Missing Cloudinary env variables");
    }

    // Extract file extension from URI, handling query params and fragments
    const urlPath = imageUri.split('?')[0].split('#')[0];
    const fileType = urlPath.split('.').pop()?.toLowerCase() || 'jpeg';

    const mimeTypeMap: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'heic': 'image/heic',
    };

    const mimeType = mimeTypeMap[fileType] || 'image/jpeg';

    const formData = new FormData();
    formData.append("file", {
        uri: imageUri,
        type: mimeType,
        name: `upload.${fileType}`,
    } as any);

    formData.append("upload_preset", uploadPreset);
    formData.append("cloud_name", cloudName);

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: "POST",
                body: formData,
                signal: controller.signal,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (data.secure_url) {
            return data.secure_url;
        } else {
            throw new Error(`Upload failed: ${data.error?.message || 'Unknown error'}`);
        }
    } finally {
        clearTimeout(timeoutId);
    }
};