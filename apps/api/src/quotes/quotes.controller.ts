import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { CreateQuoteRequestDto, CreateQuoteResponseDto } from './dto/quote.dto';
import { QuotesService } from './quotes.service';

@ApiTags('quotes')
@Controller('quote-requests')
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Post()
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a public RFQ (honeypot-protected, rate-limited).' })
  @ApiCreatedResponse({ type: CreateQuoteResponseDto })
  create(@Body() dto: CreateQuoteRequestDto): Promise<CreateQuoteResponseDto> {
    return this.quotes.create(dto);
  }
}
