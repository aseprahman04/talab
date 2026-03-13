import { Module } from '@nestjs/common';
import { AutoRepliesController } from './auto-replies.controller';
import { AutoRepliesService } from './auto-replies.service';

@Module({ controllers: [AutoRepliesController], providers: [AutoRepliesService], exports: [AutoRepliesService] })
export class AutoRepliesModule {}
