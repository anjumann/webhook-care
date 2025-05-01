# Webhook Catcher - Product Requirements Document

## Product Overview
Webhook Catcher is a developer tool that provides temporary webhook endpoints for testing and development purposes. It allows developers to inspect incoming webhook payloads, customize responses, and forward requests to local environments, streamlining the integration and debugging process.

## Site Structure & User Flow

### Core Pages
1. **Landing Page (`/`)** 
   - Introduction to the product and its features
   - Clear CTA: "Get Started" (generates ULID and redirects to dashboard)
   - No sign-up required to start using the service
   - Secondary links: Documentation, Pricing, About

2. **Dashboard (`/{{ulid}}`)** 
   - ULID stored in localStorage
   - If ULID exists, auto-redirect to dashboard
   - If not, generate new ULID, store it, and redirect to dashboard
   - Shows list of all created endpoints with key metrics
   - Button to create new endpoint
   - Option to bookmark this page (emphasize it as their unique dashboard)

3. **Endpoint Details (`/{{ulid}}/{{endpoint_name}}`)** 
   - Complete details about a specific endpoint
   - Request logs with expandable details
   - Configuration options
   - Detailed statistics

### User Journey

1. User lands on homepage → clicks "Get Started"
2. System generates ULID, stores in localStorage, redirects to dashboard
3. Dashboard shows empty state with prominent "Create First Endpoint" button
4. User clicks button, enters endpoint name (or uses suggested random name)
5. System creates endpoint and shows success with copyable URL
6. User copies URL to test with their webhook provider
7. As requests come in, they appear in real-time on the dashboard
8. User can click on any request to see details, or on endpoint name to access settings

## Feature Details

### 1. Core Webhook Functionality
- **Endpoint Creation**
  - Custom endpoint names (alphanumeric, dashes, underscores)
  - Auto-suggest random memorable names if user doesn't specify
  - Full endpoint URL formatted as: `{{baseUrl}}/{{ulid}}/{{endpoint_name}}`
  - One-click copy button for the full URL
  - QR code generation for mobile testing (instant scanning of endpoint URLs)

- **Request Logging**
  - Real-time display of incoming requests
  - Log view shows: timestamp, method, status code, source IP
  - Expandable view shows full headers and body
  - JSON/XML pretty-printing with syntax highlighting
  - Search/filter requests by content
  - Accessible via UI: `{{baseUrl}}/{{ulid}}/{{endpoint_name}}/logs`
  - Accessible via API: `{{baseUrl}}/api/{{ulid}}/{{endpoint_name}}/logs`

### 2. Response Customization
- **Status Code Selection**
  - Dropdown with common codes (200, 201, 204, 400, 401, 403, 404, 500)
  - Option to enter custom code
  - Default: 200 OK

- **Response Body**
  - JSON editor with validation
  - Option to use template variables (e.g., `{{request.body.user_id}}`)
  - Pre-made templates for common scenarios
  - Default: `{"status": "success", "message": "Webhook received"}`

- **Response Headers**
  - Key-value pair interface
  - Common headers auto-suggested
  - Default: `Content-Type: application/json`

- **Response Delay**
  - Slider to simulate latency (0-10000ms)
  - Default: 0ms (immediate response)

### 3. Webhook Forwarding
- **Forwarding Configuration**
  - Input field for destination URL
  - Toggle to enable/disable forwarding
  - Option to forward original or transformed request
  - Test connection button

- **Retry Logic**
  - Number of retry attempts (0-5)
  - Backoff strategy (none, linear, exponential)
  - Timeout settings
  - Default: 3 retries with exponential backoff

- **Forwarding Security**
  - Add authentication to forwarded requests
  - Options: None, Basic Auth, Bearer Token
  - Header preservation options

- **Forwarding Logs**
  - Success/failure status for each forwarded request
  - Response from forwarding target
  - Retry history if applicable

### 4. Security & Authentication Options
- **Endpoint Security**
  - Option to require authentication for webhook endpoints
  - Types: None, API Key, Bearer Token, Basic Auth
  - IP whitelisting capability

- **Request Validation**
  - Content-type validation
  - Payload size limits
  - Schema validation (optional)
  - Default: Accept all valid HTTP requests

### 5. Persistence Options
- **Data Retention**
  - Time-based options: 1 hour, 24 hours, 7 days, 30 days
  - Request count options: Last 50, 100, 500 requests
  - Default: 24 hours or 100 requests (whichever comes first)

- **Data Management**
  - Delete individual requests
  - Clear all requests for an endpoint
  - Delete endpoints
  - Export logs (JSON, CSV formats)

### 6. Webhook Replay
- **Replay Controls**
  - Replay button on each logged request
  - Option to edit payload before replaying
  - View comparison between original and replay responses

- **Batch Replay**
  - Select multiple requests for replay
  - Sequential or parallel execution
  - Customizable delay between replays

## Non-Functional Requirements

### Performance
- Request processing time < 100ms
- Real-time updates for incoming webhooks
- Support for high-volume webhook traffic

### Security
- HTTPS for all connections
- No storage of sensitive data
- Automatic purging of data after retention period
- Rate limiting to prevent abuse

### Scalability
- Horizontal scaling for webhook processing
- Database partitioning by ULID
- Caching for frequently accessed data

### Monitoring & Analytics
- Request volume metrics
- Error rate tracking
- Performance monitoring
- Usage patterns analysis

## User Interface Guidelines

### Dashboard Layout
- Clean, minimal design focused on functionality
- Dark mode option (developer-friendly)
- Responsive design for mobile usage
- Persistent navigation to quickly access all endpoints

### Request Visualization
- Timeline view of requests
- Color-coding by status code
- Expandable/collapsible details
- JSON/XML pretty formatting

### Notifications
- Real-time alerts for new requests
- Browser notifications (optional)
- Error notifications for forwarding failures

## Feature Details (continued)

### 7. AI-Powered Payload Analysis
- **Pattern Recognition**
  - Analyze multiple webhook payloads to identify common structures
  - Generate visual representation of payload structure
  - Create JSON schema based on observed payloads
  - Detect structural changes between payloads over time

- **Smart Insights**
  - Generate human-readable summaries of complex payloads
  - Identify key information in each webhook (e.g., "Payment of $59.99 from user john_doe")
  - Suggest filters based on payload content patterns
  - Flag anomalies or unusual values in payloads

- **Automated Documentation**
  - Generate endpoint documentation based on observed traffic
  - Suggest field descriptions and data types
  - Create sample payloads for reference
  - Export documentation in various formats

### 8. Security Features
- **Webhook Signature Validation**
  - Support for common signature algorithms (HMAC-SHA256, etc.)
  - Key management for signature verification
  - Visual indicator for verified/unverified requests
  - Detailed validation errors for debugging

## Future Enhancements (Phase 2)

### Request Transformation
- JavaScript-based transformation engine
- Visual mapper for reorganizing payload structure
- Templates for common transformations
- Conditional transformations based on request content

### Advanced Functionality
- Mock server functionality
- Scheduled webhook generation
- WebSocket support
- GraphQL endpoint testing

### Team Collaboration
- Shared workspaces
- User roles and permissions
- Activity audit logs
- Comments on requests for team communication

## Technical Architecture (High-Level)

### Frontend & Backend
- Next.js with TypeScript (App Router)
- shadcn UI component library for consistent design
- Real-time updates using WebSockets or Server-Sent Events
- Local storage for ULID persistence
- Responsive design using Tailwind CSS
- MongoDB for request storage
- Redis for caching and rate limiting

### Infrastructure
- Containerized deployment with Docker
- Load balancing for webhook endpoints
- CDN for static assets
- Automated backups and disaster recovery

## Metrics & Success Criteria
- User activation: % of visitors who create an endpoint
- Engagement: Average requests per endpoint
- Retention: % of users returning within 30 days
- Feature adoption: % of users utilizing advanced features