import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { AwsConfigService } from 'src/config/aws/config.service';

@Injectable()
export class S3Service {
  private s3: S3Client;

  constructor(private awsConfigService: AwsConfigService) {
    this.s3 = new S3Client({
      region: this.awsConfigService.awsRegion!,
      credentials: {
        accessKeyId: this.awsConfigService.awsAccessKeyId!,
        secretAccessKey: this.awsConfigService.awsSecretAccessKey!,
      },
    });
  }

  async uploadImage(file: Express.Multer.File, dirPath: string) {
    const fileName = `${dirPath}/${Date.now()}`;

    const uploadParams = {
      Bucket: this.awsConfigService.awsBucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await this.s3.send(new PutObjectCommand(uploadParams));

    return `https://${this.awsConfigService.awsBucketName}.s3.${this.awsConfigService.awsRegion}.amazonaws.com/${fileName}`;
  }

  async deleteImage(imageUrl: string) {
    try {
      // URL에서 파일명 추출
      const urlParts = imageUrl.split('.com/');
      if (urlParts.length !== 2) {
        console.error('Invalid S3 URL format');
        return;
      }

      const key = urlParts[1];
      const deleteParams = {
        Bucket: this.awsConfigService.awsBucketName,
        Key: key,
      };

      await this.s3.send(new DeleteObjectCommand(deleteParams));
    } catch (error) {
      console.error('Error deleting image from S3:', error);
    }
  }
}
