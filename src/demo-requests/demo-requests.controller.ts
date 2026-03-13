import { Body, Controller, Post } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateDemoRequestDto } from './dto/create-demo-request.dto';
import { DemoRequestsService } from './demo-requests.service';

@Controller('demo-requests')
export class DemoRequestsController {
  constructor(private service: DemoRequestsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateDemoRequestDto) {
    return this.service.create(dto);
  }
}
