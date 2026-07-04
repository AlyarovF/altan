import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@altan/shared';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiPaginatedResponse, type Paginated } from '../common/dto/pagination-query.dto';
import {
  AdminQuoteDetailDto,
  AdminQuoteListItemDto,
  AdminQuoteQueryDto,
  QuoteAuditEntryDto,
  RespondQuoteDto,
  UpdateQuoteStatusDto,
} from './dto/quote.dto';
import { QuotesService } from './quotes.service';

@ApiTags('quotes')
@ApiBearerAuth('access-token')
@Roles(Role.SALES)
@Controller('admin/quote-requests')
export class AdminQuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Get()
  @ApiOperation({ summary: 'List quote requests (filter status/overdue/date/search).' })
  @ApiPaginatedResponse(AdminQuoteListItemDto)
  list(@Query() query: AdminQuoteQueryDto): Promise<Paginated<AdminQuoteListItemDto>> {
    return this.quotes.listAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a quote request with items + internal notes.' })
  @ApiOkResponse({ type: AdminQuoteDetailDto })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<AdminQuoteDetailDto> {
    return this.quotes.getAdmin(id);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Immutable audit trail for a quote request (newest first).' })
  @ApiOkResponse({ type: [QuoteAuditEntryDto] })
  audit(@Param('id', ParseUUIDPipe) id: string): Promise<QuoteAuditEntryDto[]> {
    return this.quotes.listAudit(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change quote status (enforces the transition state machine).' })
  @ApiOkResponse({ type: AdminQuoteDetailDto })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuoteStatusDto,
    @CurrentUser() u: AuthUser,
  ): Promise<AdminQuoteDetailDto> {
    return this.quotes.changeStatus(id, dto.status, u.id);
  }

  @Post(':id/respond')
  @ApiOperation({ summary: 'Respond to a quote (records SLA, advances NEW/IN_REVIEW → QUOTED).' })
  @ApiOkResponse({ type: AdminQuoteDetailDto })
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondQuoteDto,
    @CurrentUser() u: AuthUser,
  ): Promise<AdminQuoteDetailDto> {
    return this.quotes.respond(id, dto, u.id);
  }
}
