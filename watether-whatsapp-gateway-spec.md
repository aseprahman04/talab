# WhatsApp Gateway Platform – Full Technical Specification
Version: 1.0  
Target Stack: **Next.js + NestJS + PostgreSQL + Redis + BullMQ**

---

# 1. Overview

This project is a **multi-tenant WhatsApp gateway platform** that allows users to connect their WhatsApp accounts via QR pairing and interact with them through a REST API and dashboard.

The system supports:

- Multi-device WhatsApp connection
- REST API messaging
- Incoming message webhooks
- Broadcast campaigns
- Auto-reply rules
- Contact management
- Device monitoring
- Billing and quota management
- Multi-tenant workspace system

Target users:

- SaaS developers
- Agencies
- Customer support teams
- Small and medium businesses
- Internal automation systems

---

# 2. Architecture

The platform follows a **distributed architecture** with separation between the control plane and the worker plane.

## Components

### Dashboard Layer
User interface for managing devices and messages.

Technology:
- Next.js
- TypeScript
- WebSocket
- TanStack Query

### Control Plane (API)
Handles:

- authentication
- workspace management
- device management
- message enqueue
- webhook configuration
- analytics
- billing

Technology:

- NestJS
- PostgreSQL
- Redis
- BullMQ

### Worker Plane

Responsible for:

- WhatsApp session handling
- sending messages
- receiving inbound messages
- broadcast dispatch
- webhook delivery

Technology:

- Node.js workers
- Redis queues

### Storage Layer

- PostgreSQL → application data
- Redis → queues + cache
- Object Storage (MinIO / S3) → media
- encrypted session storage → device sessions

---

# 3. High Level System Diagram

```txt
Dashboard (Next.js)
        │
        ▼
API Gateway (NestJS)
        │
        ├── PostgreSQL
        ├── Redis
        │
        ▼
Message Queue (BullMQ)
        │
        ▼
Workers
  ├─ Session Worker
  ├─ Broadcast Worker
  ├─ Webhook Worker
  └─ Auto Reply Worker
```

---

# 4. Core Modules

## Authentication
Handles:

- register
- login
- JWT tokens
- refresh tokens
- password reset

## Workspaces

Multi-tenant container for resources.

Workspace contains:

- devices
- contacts
- broadcasts
- auto replies
- members
- webhooks
- subscription

## Device Management

Features:

- create device
- QR pairing
- reconnect
- disconnect
- status monitoring
- token management

Device statuses:

```txt
CREATED
PAIRING
CONNECTED
RECONNECTING
DISCONNECTED
SESSION_EXPIRED
RATE_LIMITED
UNSTABLE
BANNED_RISK
DISABLED
```

## Messaging

Supported message types:

```txt
TEXT
IMAGE
DOCUMENT
AUDIO
VIDEO
```

Operations:

- send single message
- send bulk messages
- retry failed messages
- delivery status updates

## Contacts

Features:

- add contact
- import CSV
- tagging
- blacklist
- opt-out handling

## Broadcast

Campaign messaging system.

Features:

- audience selection
- queue based sending
- throttling
- pause/resume
- progress monitoring

## Auto Reply

Keyword-based automatic replies.

Features:

- keyword matching
- fallback reply
- schedule rules
- per-device rules

## Webhooks

Events delivered to external systems.

Supported events:

```txt
device.connected
device.disconnected
message.received
message.sent
message.delivered
message.read
message.failed
broadcast.started
broadcast.completed
```

---

# 5. Core Data Model

Main entities:

```txt
User
Workspace
WorkspaceMember
Device
DeviceToken
DeviceSession
Contact
Message
Webhook
WebhookDelivery
Broadcast
BroadcastRecipient
AutoReplyRule
Plan
Subscription
AuditLog
```

Relationships:

```txt
User -> Workspace (owner)
Workspace -> Devices
Workspace -> Contacts
Workspace -> Broadcasts
Workspace -> Webhooks
Device -> Messages
Broadcast -> BroadcastRecipients
Workspace -> Subscription
```

---

# 6. Database Schema (Prisma)

Example entity:

```prisma
model Device {
  id             String   @id @default(uuid())
  workspaceId    String
  name           String
  phoneNumber    String?
  status         DeviceStatus
  healthScore    Int
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id])
  tokens    DeviceToken[]
  sessions  DeviceSession[]
  messages  Message[]
}
```

Example message entity:

```prisma
model Message {
  id          String   @id @default(uuid())
  workspaceId String
  deviceId    String
  direction   MessageDirection
  type        MessageType
  content     String?
  mediaUrl    String?
  status      MessageStatus
  createdAt   DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id])
  device    Device    @relation(fields: [deviceId], references: [id])
}
```

---

# 7. API Endpoints

## Authentication

```txt
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

## Devices

```txt
POST /devices
GET /devices
GET /devices/:id
POST /devices/:id/pair
POST /devices/:id/reconnect
POST /devices/:id/disconnect
DELETE /devices/:id
```

## Tokens

```txt
POST /devices/:id/tokens
GET /devices/:id/tokens
DELETE /tokens/:id
POST /tokens/:id/rotate
```

## Messages

```txt
POST /messages/send
POST /messages/send-media
POST /messages/send-bulk
GET /messages
GET /messages/:id
POST /messages/:id/retry
```

## Contacts

```txt
POST /contacts
POST /contacts/import
GET /contacts
PATCH /contacts/:id
DELETE /contacts/:id
```

## Broadcast

```txt
POST /broadcasts
POST /broadcasts/:id/start
POST /broadcasts/:id/pause
POST /broadcasts/:id/resume
GET /broadcasts
GET /broadcasts/:id
```

## Webhooks

```txt
POST /webhooks
GET /webhooks
PATCH /webhooks/:id
POST /webhooks/:id/test
GET /webhooks/:id/logs
```

---

# 8. Queue Design

Main queues:

```txt
device.pair.start
device.reconnect
message.send
message.status.update
inbound.process
auto-reply.process
webhook.delivery
broadcast.dispatch
broadcast.send
```

Purpose:

- prevent API blocking
- enable retries
- isolate heavy workloads
- throttle broadcasts

---

# 9. Worker Types

## Session Worker

Responsibilities:

- manage WhatsApp sessions
- generate QR codes
- reconnect devices
- send outbound messages
- receive inbound messages

## Broadcast Worker

Responsibilities:

- split campaign targets
- throttle sending
- track progress

## Webhook Worker

Responsibilities:

- deliver events
- retry failed webhooks
- sign payloads

## Auto Reply Worker

Responsibilities:

- evaluate inbound messages
- match rules
- enqueue reply messages

---

# 10. Message Sending Flow

1. API receives send request
2. request validated
3. message record created
4. job added to queue
5. worker processes job
6. message sent via session
7. status updated
8. webhook event triggered

---

# 11. Incoming Message Flow

1. session receives message
2. worker pushes inbound job
3. system saves message
4. auto-reply rules evaluated
5. webhook delivered
6. optional reply sent

---

# 12. Rate Limiting

Per device:

```txt
max 10-20 messages per minute
random delay 1-5 seconds
```

Per workspace:

```txt
API request limits
broadcast concurrency limits
daily quota
```

---

# 13. Device Health Score

Initial score: `100`

Penalties:

```txt
disconnect event -10
send failure burst -15
reconnect attempts -10
```

Recovery:

```txt
successful reconnect +3
stable uptime +5
successful delivery streak +5
```

Status mapping:

```txt
80-100 healthy
60-79 warning
40-59 unstable
<40 risky
```

---

# 14. Security

Measures:

- password hashing (bcrypt/argon2)
- JWT authentication
- API token hashing
- HMAC webhook signing
- encrypted session blobs
- rate limiting
- audit logging

---

# 15. Deployment

Recommended services:

```txt
frontend
api
worker-session
worker-broadcast
worker-webhook
redis
postgres
minio
nginx
```

Small deployment:

```txt
1 API server
1 PostgreSQL
1 Redis
2 session workers
1 broadcast worker
1 webhook worker
```

---

# 16. Monitoring

Metrics to track:

- active devices
- message throughput
- delivery success rate
- webhook success rate
- queue backlog
- worker health

Recommended stack:

```txt
Prometheus
Grafana
Loki
```

---

# 17. Legal Considerations

Using WhatsApp Web automation is **not an official WhatsApp integration**.

Implications:

- accounts may be limited or disconnected
- service must not claim official partnership
- platform must implement anti-spam controls
- user agreement must clarify risks

---

# 18. Development Roadmap

## Phase 1

- authentication
- workspace
- device creation
- QR pairing
- send text message
- inbound logs

## Phase 2

- webhook delivery
- contacts
- broadcast
- message retry
- rate limiting

## Phase 3

- auto replies
- analytics
- billing
- admin panel

## Phase 4

- AI reply
- campaign analytics
- multi device routing
- white label

---

# 19. Definition of Done

A feature is complete when:

- API endpoint implemented
- validation rules added
- database migration created
- UI component implemented
- audit log recorded
- automated tests passing
- documentation updated

---

# 20. Key Engineering Priorities

The stability of the platform depends on:

1. **Session stability**
2. **Reliable queue processing**
3. **Reconnect logic**
4. **Idempotent message sending**
5. **Clear observability**
6. **Anti-abuse protections**

User interface is secondary.  
Session reliability is the foundation of the entire platform.

---

# 21. Recommended Next Deliverables

After this spec, the most practical next outputs are:

1. ERD final
2. OpenAPI spec
3. Prisma full schema
4. NestJS folder structure with modules
5. BullMQ job contracts
6. Docker Compose deployment
7. Admin dashboard wireframe
8. Pricing and quota matrix

