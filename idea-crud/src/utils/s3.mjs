import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const S3 = new S3Client({})

export const uploadImageToS3 = async (imageData, fileName, bucketName) => {
    const uploadParams = {
        Bucket: bucketName,
        Key: `images/${fileName}`,
        Body: imageData,
        ACL: 'public-read'
    };

    try {
        const data = await S3.send(new PutObjectCommand(uploadParams));
        console.info('Image uploaded to S3:', data);
        return data.$metadata.httpStatusCode === 200 ? `https://${bucketName}.s3.amazonaws.com/images/${fileName}` : null;
    } catch (error) {
        console.error('Error uploading image to S3:', error);
        throw error;
    }
};

export const deleteImageFromS3 = async (fileName, bucketName) => {
    const deleteParams = {
        Bucket: bucketName,
        Key: `images/${fileName}`
    };

    try {
        const data = await S3.send(new DeleteObjectCommand(deleteParams));
        console.info('Image deleted from S3:', data);
        return data.$metadata.httpStatusCode === 204;
    } catch (error) {
        console.error('Error deleting image from S3:', error);
        throw error;
    }
}

// export const getSignedUrl = async (fileName, bucketName) => {
//     const params = {
//         Bucket: bucketName,
//         Key: `images/${fileName}`,
//         Expires: 60
//     };

//     try {
//         const data = await S3.send(new GetSignedUrlCommand(params));
//         console.info('Signed URL generated:', data);
//         return data;
//     } catch (error) {
//         console.error('Error generating signed URL:', error);
//         throw error;
//     }
// }