import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Role } from '@altan/shared';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { MediaAssetDto } from './dto/media.dto';
import { MediaService } from './media.service';

@ApiTags('media')
@ApiBearerAuth('access-token')
@Roles(Role.EDITOR)
@Controller('admin/media')
export class AdminMediaController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @UseInterceptors(
    // Buffer in memory; size is validated against MEDIA_MAX_BYTES in the service.
    FileInterceptor('file', { storage: memoryStorage() }),
  )
  @ApiOperation({ summary: 'Upload an image; stores it and returns a served media asset.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpg/png/webp/gif/svg/avif).',
        },
        alt: { type: 'string', description: 'Optional alt text.' },
      },
    },
  })
  @ApiCreatedResponse({ type: MediaAssetDto })
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() u: AuthUser,
    @Body('alt') alt?: string,
  ): Promise<MediaAssetDto> {
    return this.media.upload(file, u.id, alt);
  }
}
