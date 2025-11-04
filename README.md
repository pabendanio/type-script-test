# Birthday Notification System

A scalable, timezone-aware birthday notification system built with TypeScript, Node.js, and PostgreSQL. The system automatically sends birthday messages to users at exactly 9:00 AM in their local timezone with robust error handling and recovery mechanisms.

## 🚀 Features

- **Timezone-Aware Scheduling**: Sends birthday messages at 9:00 AM in each user's local timezone
- **RESTful API**: Complete CRUD operations for user management
- **Message Recovery**: Automatically recovers and sends missed messages if the service was down
- **Error Handling**: Robust retry mechanisms with exponential backoff
- **Race Condition Prevention**: Database constraints prevent duplicate messages
- **Scalable Architecture**: Designed to handle thousands of daily birthdays
- **Docker Support**: Fully containerized with PostgreSQL
- **Comprehensive Testing**: Unit and integration tests with high coverage
- **TypeScript**: Full type safety and modern development experience

## 🏗️ Architecture

### Core Components

1. **User Service**: Manages user CRUD operations and birthday queries
2. **Message Service**: Handles webhook delivery with retry logic
3. **Birthday Scheduler**: Cron-based service that processes birthdays every minute
4. **Database Layer**: PostgreSQL with TypeORM for robust data persistence

### Key Design Decisions

- **Minute-level Scheduling**: Checks every minute instead of daily to ensure precise 9:00 AM delivery
- **Dual Birthday Tracking**: Stores both full date and separate day/month for efficient querying
- **Message State Tracking**: Tracks pending/sent/failed states to prevent duplicates and enable recovery
- **Timezone Validation**: Uses moment-timezone for accurate timezone handling

## 📋 Requirements

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd typescript-test
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and set your WEBHOOK_URL from hookbin.com
   ```

3. **Create docker network**:
   ```bash
   docker network create birthday_network
   ```

4. **Start the application**:
   ```bash
   docker-compose up -d --build
   ```

5. **Check application health**:
   ```bash
   curl http://localhost:3000/health
   ```

### Manual Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup PostgreSQL database**:
   ```sql
   CREATE DATABASE birthday_app;
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and webhook URL
   ```

4. **Build and start**:
   ```bash
   npm run build
   npm start
   ```

## 📊 API Documentation

### Create User
```http
POST /user
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "birthDate": "1990-05-15",
  "timezone": "America/New_York"
}
```

**Response (201)**:
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "birthDate": "1990-05-15",
    "timezone": "America/New_York",
    "createdAt": "2023-11-04T10:00:00Z"
  }
}
```

### Update User
```http
PUT /user/{id}
Content-Type: application/json

{
  "firstName": "Jane",
  "timezone": "America/Los_Angeles"
}
```

### Delete User
```http
DELETE /user/{id}
```

### Get User
```http
GET /user/{id}
```

### Get All Users
```http
GET /user
```

## 🌍 Supported Timezones

The system supports all IANA timezone identifiers. Common examples:

- `America/New_York` (EST/EDT)
- `America/Los_Angeles` (PST/PDT)
- `Europe/London` (GMT/BST)
- `Asia/Tokyo` (JST)
- `Australia/Sydney` (AEST/AEDT)

Full list: [IANA Time Zone Database](https://www.iana.org/time-zones)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `password` |
| `DB_NAME` | Database name | `birthday_app` |
| `WEBHOOK_URL` | Hookbin.com endpoint | Required |
| `MAX_RETRIES` | Message retry attempts | `3` |

### Webhook Setup

1. Visit [hookbin.com](https://hookbin.com)
2. Create a new bin
3. Copy the URL and set it as `WEBHOOK_URL` in your environment

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run in Watch Mode
```bash
npm run test:watch
```

### Test Categories

- **Unit Tests**: Service layer logic, timezone handling, validation
- **Integration Tests**: API endpoints, database operations
- **Mock Tests**: External webhook calls, error scenarios

## 📈 Scalability Considerations

### Current Optimizations

1. **Database Indexing**: Composite index on `(birthDay, birthMonth)` for fast birthday queries
2. **Unique Constraints**: Prevents duplicate messages via `(userId, messageDate)` constraint
3. **Efficient Queries**: Separate day/month columns avoid expensive date functions
4. **Connection Pooling**: TypeORM manages database connections efficiently

### Scaling Strategies

For **thousands of daily birthdays**:

1. **Horizontal Scaling**: Multiple application instances behind a load balancer
2. **Database Partitioning**: Partition `birthday_messages` table by month
3. **Message Queuing**: Use Redis/SQS for message delivery queue
4. **Caching**: Redis cache for user birthday lookups
5. **Background Workers**: Separate worker processes for message delivery

### High-Volume Architecture

```
┌─────────────────┐    ┌───────────────┐    ┌─────────────────┐
│   Load Balancer │    │  Message      │    │   Webhook       │
│                 │    │  Queue        │    │   Delivery      │
└─────────────────┘    │  (Redis/SQS)  │    │   Workers       │
         │              └───────────────┘    └─────────────────┘
         │                       │                     │
┌─────────────────┐              │              ┌─────────────────┐
│  App Instance 1 │──────────────┼──────────────│  External APIs  │
│  (Scheduler)    │              │              │  (Hookbin.com)  │
└─────────────────┘              │              └─────────────────┘
┌─────────────────┐              │
│  App Instance 2 │──────────────┘
│  (API Only)     │
└─────────────────┘
         │
┌─────────────────┐
│  PostgreSQL     │
│  (with replicas)│
└─────────────────┘
```

## 🛡️ Error Handling & Recovery

### Message Delivery Resilience

1. **Exponential Backoff**: Retry delays increase exponentially (1s, 2s, 4s...)
2. **Max Retry Limits**: Prevents infinite retry loops
3. **Failure Tracking**: Stores error messages for debugging
4. **Dead Letter Handling**: Failed messages after max retries are logged

### Recovery Mechanisms

1. **Startup Recovery**: Checks last 7 days for missed birthdays on service restart
2. **Periodic Retry**: Failed messages are retried during each scheduler run
3. **Duplicate Prevention**: Database constraints ensure no duplicate messages
4. **Race Condition Safety**: Atomic database operations prevent concurrent issues

## 🔍 Monitoring & Debugging

### Health Endpoints

- `GET /health`: Application health status
- Database connection status included in health checks

### Logging

- **Console Logging**: Structured logs for debugging
- **Error Tracking**: All errors logged with context
- **Message Tracking**: Success/failure logging for all deliveries

### Debugging Tips

1. **Check Timezone**: Verify user timezone is valid IANA identifier
2. **Database State**: Query `birthday_messages` table for delivery status
3. **Webhook Testing**: Test your hookbin.com endpoint manually
4. **Logs Analysis**: Check application logs for error patterns

## 🔮 Future Extensions

The architecture supports easy extension for:

1. **Anniversary Messages**: Add `anniversaryDate` field and similar logic
2. **Custom Message Types**: Abstract message handling for different event types
3. **Multiple Notifications**: Support email, SMS, push notifications
4. **Scheduling Flexibility**: Custom delivery times per user
5. **Template System**: Dynamic message templates with variables
6. **Analytics**: Delivery success rates and user engagement metrics

## 🛠️ Development

### Development Mode
```bash
npm run dev
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Database Migrations
```bash
# Create new migration
npm run migration:create -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the logs for error messages
2. Verify environment configuration
3. Test with a small number of users first
4. Create an issue with reproduction steps

---

**Happy Birthday Notifications! 🎉**