import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@altan/shared';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiPaginatedResponse, type Paginated } from '../common/dto/pagination-query.dto';
import { AdminNewsDto, CreateNewsDto, NewsQueryDto, UpdateNewsDto } from './dto/news.dto';
import { NewsService } from './news.service';

@ApiTags('news')
@ApiBearerAuth('access-token')
@Roles(Role.EDITOR)
@Controller('admin/news')
export class AdminNewsController {
  constructor(private readonly news: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'List news of any status (admin).' })
  @ApiPaginatedResponse(AdminNewsDto)
  list(@Query() query: NewsQueryDto): Promise<Paginated<AdminNewsDto>> {
    return this.news.listAdmin(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a news article.' })
  @ApiOkResponse({ type: AdminNewsDto })
  create(@Body() dto: CreateNewsDto, @CurrentUser() u: AuthUser): Promise<AdminNewsDto> {
    return this.news.create(dto, u.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a news article.' })
  @ApiOkResponse({ type: AdminNewsDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNewsDto,
    @CurrentUser() u: AuthUser,
  ): Promise<AdminNewsDto> {
    return this.news.update(id, dto, u.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a news article.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser): Promise<void> {
    return this.news.remove(id, u.id);
  }
}
