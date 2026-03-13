import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway {
  @WebSocketServer() server!: Server;

  emitToWorkspace(workspaceId: string, event: string, payload: unknown) {
    this.server.to(`workspace:${workspaceId}`).emit(event, payload);
  }
}
