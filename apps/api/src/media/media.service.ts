import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, isAbsolute, join, resolve } from 'node:path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { MediaType as PrismaMediaType } from '@prisma/client';
import { MediaType } from '@altan/shared';
import { AuditService } from '../audit/audit.service';
import { AppConfigService } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import type { MediaAssetDto } from './dto/media.dto';

/** Public URL prefix the static handler serves uploaded files from. */
export const MEDIA_URL_PREFIX = '/media';

/** Allowed image MIME types → canonical extension. */
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
};

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
  ) {}

  /** Absolute path to the configured media storage directory. */
  get mediaDir(): string {
    const dir = this.config.get('MEDIA_DIR');
    return isAbsolute(dir) ? dir : resolve(process.cwd(), dir);
  }

  /**
   * Persist an uploaded image to the media dir and create a `MediaAsset` row.
   * Validates MIME type (images only) and size (MEDIA_MAX_BYTES).
   */
  async upload(
    file: Express.Multer.File | undefined,
    actorId: string,
    alt?: string,
  ): Promise<MediaAssetDto> {
    if (!file) throw new BadRequestException('No file uploaded (field name must be "file").');

    const ext = ALLOWED_IMAGE_TYPES[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}". Allowed: ${Object.keys(ALLOWED_IMAGE_TYPES).join(', ')}.`,
      );
    }

    const maxBytes = this.config.get('MEDIA_MAX_BYTES');
    if (file.size > maxBytes) {
      throw new BadRequestException(`File too large (max ${Math.floor(maxBytes / 1024)} KB).`);
    }

    const filename = `${randomUUID()}${ext || extname(file.originalname) || ''}`;
    await mkdir(this.mediaDir, { recursive: true });
    await writeFile(join(this.mediaDir, filename), file.buffer);

    const url = `${MEDIA_URL_PREFIX}/${filename}`;
    const row = await this.prisma.mediaAsset.create({
      data: { url, alt: alt ?? null, type: PrismaMediaType.IMAGE },
    });

    await this.audit.log({
      actorId,
      action: 'CREATE',
      entity: 'MediaAsset',
      entityId: row.id,
      after: { url: row.url, type: row.type, bytes: file.size, mime: file.mimetype },
    });

    return this.toDto(row);
  }

  private toDto(row: {
    id: string;
    url: string;
    alt: string | null;
    type: PrismaMediaType;
    width: number | null;
    height: number | null;
    productId: string | null;
    createdAt: Date;
  }): MediaAssetDto {
    return {
      id: row.id,
      url: row.url,
      alt: row.alt,
      type: row.type as MediaType,
      width: row.width,
      height: row.height,
      productId: row.productId,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
