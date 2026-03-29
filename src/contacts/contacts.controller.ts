import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ContactsService } from './contacts.service';
import { BulkImportContactsDto } from './dto/bulk-import-contacts.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateContactListDto } from './dto/create-contact-list.dto';

@ApiTags('Contacts')
@ApiBearerAuth()
@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private service: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Create or upsert a contact by phone number' })
  @ApiResponse({ status: 201, description: 'Contact created or updated' })
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateContactDto) {
    return this.service.create(user.sub, dto);
  }

  @Post('bulk-import')
  @ApiOperation({ summary: 'Bulk import contacts' })
  @ApiResponse({ status: 201, description: 'Returns { imported, skipped }' })
  bulkImport(@CurrentUser() user: { sub: string }, @Body() dto: BulkImportContactsDto) {
    return this.service.bulkImport(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all contacts for a workspace' })
  findAll(@CurrentUser() user: { sub: string }, @Query('workspaceId') workspaceId: string) {
    return this.service.findAll(user.sub, workspaceId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact' })
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.service.remove(user.sub, id);
  }

  @Post('lists')
  @ApiOperation({ summary: 'Create a contact list' })
  @ApiResponse({ status: 201, description: 'Contact list created' })
  createList(@CurrentUser() user: { sub: string }, @Body() dto: CreateContactListDto) {
    return this.service.createList(user.sub, dto);
  }

  @Get('lists')
  @ApiOperation({ summary: 'Get all contact lists for a workspace with member counts' })
  findAllLists(@CurrentUser() user: { sub: string }, @Query('workspaceId') workspaceId: string) {
    return this.service.findAllLists(user.sub, workspaceId);
  }

  @Get('lists/:listId/members')
  @ApiOperation({ summary: 'Get members of a contact list' })
  getListMembers(@CurrentUser() user: { sub: string }, @Param('listId') listId: string) {
    return this.service.getListMembers(user.sub, listId);
  }

  @Post('lists/:listId/members')
  @ApiOperation({ summary: 'Add contacts to a list' })
  addToList(
    @CurrentUser() user: { sub: string },
    @Param('listId') listId: string,
    @Body() body: { contactIds: string[] },
  ) {
    return this.service.addToList(user.sub, listId, body.contactIds);
  }

  @Delete('lists/:listId/members/:contactId')
  @ApiOperation({ summary: 'Remove a contact from a list' })
  removeFromList(
    @CurrentUser() user: { sub: string },
    @Param('listId') listId: string,
    @Param('contactId') contactId: string,
  ) {
    return this.service.removeFromList(user.sub, listId, contactId);
  }
}
