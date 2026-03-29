---
title: "Harborhook"
frameworks: [NSQ, Protobuf, Hugo, Buf, Kubernetes, Grafana, Prometheus, Tempo, Loki]
show_readme: false
---

Harborhook is a Go-first, multi-tenant webhooks platform.

## Backstory

The idea for Harborhook came from a work project I led. My team and I were defining which processes in our data sync system needed to be strictly synchronous, and which could be done async. I realized that running async workflows at scale means you need a robust method of alerting customers when those workflows finish. For many cases, webhooks solve the problem nicely. And thus Harborhook was born.

## Problem Space

This problem is deceptively simple. At first glance, all we need to do is ingest events, stick them in a queue, and push them to subscribers. Easy, right? There are 10 different pub/sub frameworks that can do that natively. For a production system, the constraints get a lot tighter. We need to build a system that is reliable, secure, transparent, and scalable.

- **Reliable**: we need to ensure at-least-once delivery for every event.
- **Secure**: we need to ensure we're sending the right events to the right subscribers, and subscribers need to be able to validate that events they receive are actually from us.
- **Transparent**: we need a system that is deeply observable. Queues, network conditions, and subscriber instability all lead to mishaps. To guarantee reliability, we need full observability.
- **Scalable**: we need to design for scale, to support everything from startup to enterprise use cases.

## Architecture

The data flow through Harborhook looks like this:

```
Client → Envoy (JWT auth, TLS) → Ingest (fanout) → NSQ → Workers → Customer Endpoints
```

API clients authenticate through Envoy, which handles JWT validation and TLS termination before forwarding requests over mTLS to the Ingest service. Ingest stores the event, queries for subscribed endpoints, creates delivery records, and fans out one message per subscription into NSQ. Workers pull from the queue and handle delivery to customer endpoints. Every step is recorded in Postgres.

I chose gRPC as the internal API protocol with grpc-gateway layered on top for HTTP/JSON support. Beyond Go/Protobuf/gRPC just being my favorite ecosystem, it also gives me strong, schema-driven contracts while still supporting clients that can't speak gRPC. API definitions live in `.proto` files, and all the boilerplate is generated--no hand-rolling marshaling code.

### Reliability

NSQ is the backbone of the delivery guarantee. Every delivery task is a message on the `deliveries` topic. Workers consume messages, attempt delivery, and either ack (success) or requeue with a delay (failure). NSQ's at-least-once semantics mean a message is never dropped until a worker explicitly acks it: if a worker dies mid-delivery, the message gets requeued automatically.

I chose NSQ over Kafka for this project intentionally. Kafka is the right call at serious scale, but it brings real operational weight: ZooKeeper (or KRaft), partition management, consumer group lag, and a steeper learning curve for anything non-trivial. NSQ is simple, Go-native, and operationally lightweight; it fit the scope of this project well. If Harborhook grew into a real product, migrating the queue layer would be the obvious next step.

For retries, workers follow an exponential backoff schedule with jitter: `1s → 5s → 10s → 30s → 1m`. The jitter (±10%) is important--without it, a batch of failed deliveries all retry at the same moment and create a thundering herd against the customer's endpoint. After 5 failed attempts, the delivery moves to the Dead Letter Queue (DLQ) and is marked `dead` in Postgres. Operators can replay DLQ entries with `harborctl delivery replay-dlq`, which creates a new delivery record linked to the original via a `replay_of` field.

Idempotency on publish is handled at the database level with a `UNIQUE(tenant_id, idempotency_key)` constraint. Duplicate publishes with the same key return 200 without creating a new event—safe to retry from the client side.

### Security

Harborhook has three distinct security layers.

**JWT authentication (RS256 + JWKS)**: External clients authenticate with JWTs, verified at the Envoy gateway. I chose RS256 over the simpler HS256 because RS256 uses asymmetric keys--the JWKS server holds the private key and signs tokens, while Envoy verifies using the public key it fetches from `/.well-known/jwks.json`. This means I never have to distribute a shared secret to Envoy. Key rotation is zero-downtime: publish the new public key to JWKS, then start issuing tokens signed with the new private key. Old tokens stay valid until expiry.

**mTLS for internal communication**: Traffic between Envoy and the Ingest service goes over mutual TLS. Both sides present certificates, so there's no way for an unauthenticated caller to bypass the gateway and hit Ingest directly.

**HMAC-SHA256 webhook signatures**: Every delivery includes two headers:

```
X-HarborHook-Signature: sha256=<hex>
X-HarborHook-Timestamp: <unix_timestamp>
```

The signature is `HMAC-SHA256(raw_body + timestamp, endpoint_secret)`. The timestamp is included in the signed message specifically to prevent replay attacks: if someone captures a valid delivery and resends it, the timestamp check (5-minute tolerance) will reject it. Receivers are expected to use constant-time comparison when verifying; standard string equality leaks timing information that makes brute-forcing the secret easier.

### Transparency

This was the part of the project I was most excited about, and it ended up being the most educational section to build.

The full observability stack runs in both Docker Compose and Kubernetes:

- **Prometheus** scrapes metrics from all services. Key metrics include throughput (`harborhook_events_published_total`), delivery success rate, p50/p95/p99 latency, NSQ backlog depth, DLQ growth rate, and retry rate broken down by reason.
- **Grafana** provides unified dashboards pulling from Prometheus, Tempo, and Loki. Pre-configured datasources mean it works out of the box.
- **Tempo** receives distributed traces via OpenTelemetry. Every request gets a trace that spans the full path: `PublishEvent → FanOut → NSQPublish` on the ingest side, and `NSQConsume → DeliverWebhook → HTTPPost → UpdateStatus` on the worker side. You can watch a single event move through the entire system.
- **Loki** aggregates structured JSON logs. Every log line includes a `trace_id` field, so you can jump from a trace in Tempo directly to the logs for that specific request in Loki.
- **Alertmanager** handles alert routing based on Prometheus rules. I wrote SLO-based alert rules that fire on error budget burn rate, high backlog depth, elevated DLQ growth, and p99 latency violations.

I also wrote operational runbooks for the most common incident scenarios: DLQ spikes, backlog growth, high latency, and key rotation. Having a runbook forces you to think through the failure mode completely before you're on-call and stressed about it.

The observability stack is one of those things that's easy to skip in a demo project. I'm glad I didn't. Being able to trace a single event from publish to delivery, correlate it with logs, and see the latency breakdown at each hop is super useful, and it made debugging the retry logic significantly easier during development.

### Scalability

Both the Ingest and Worker services are stateless, which makes horizontal scaling straightforward. Ingest scales with request rate; Workers scale with NSQ backlog depth. The default deployment runs 3 worker replicas. NSQ's consumer model means adding more workers automatically distributes the load, so there's no partition rebalancing and no coordination overhead.

`harborctl` is the CLI for operator tasks: creating endpoints and subscriptions, publishing test events, checking delivery status, listing DLQ entries, and replaying failures. Having a first-class CLI makes it easy to interact with the system from scripts and runbooks without needing a frontend.

## Other Features

- **Fake receiver**: A test webhook endpoint used in development and CI. It supports configurable failure injection (`FAIL_FIRST_N`) to test retry behavior, signature verification, and artificial latency. The E2E test suite uses it to validate the full delivery flow on every CI run.
- **Data seeding**: Scripts to populate realistic demo data in both Docker Compose and Kubernetes environments, useful for load testing and demos.
- **Multi-platform images**: Docker images are built for both amd64 and arm64, so the Kubernetes quickstart works on Apple Silicon without emulation.

## Limitations

- Single-region deployment only
- Rate limiting is naive (not Redis-backed token bucket)
- No multi-cluster federation
- Limited horizontal scaling optimization
- Self-signed certificates (cert-manager for production)

## Next Steps

- Circuit breakers for consistently failing endpoints
- Advanced retry logic (beyond exponential)
- A real frontend—one view for publishers, one for consumers
- Webhook payload transformation and templating
- Multi-region deployments with geo-routing
- Redis-backed token bucket rate limiting
- Built-in load testing framework
