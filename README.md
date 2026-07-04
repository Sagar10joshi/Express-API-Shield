# 🛡️ Express API Shield

<p align="center">
  <strong>A composable, production-ready security middleware for Express.js applications.</strong>
</p>

<p align="center">
  Protect your APIs with a single, configurable middleware that combines authentication, rate limiting, request validation, attack detection, security headers, and more.
</p>

<p align="center">

![npm](https://img.shields.io/npm/v/express-api-shield?style=for-the-badge)
<!-- ![npm downloads](https://img.shields.io/npm/dm/express-api-shield?style=for-the-badge) -->
![license](https://img.shields.io/npm/l/express-api-shield?style=for-the-badge)
![typescript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)
![Express](https://img.shields.io/badge/Express-4%2B-black?style=for-the-badge\&logo=express)
![Node](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge\&logo=node.js\&logoColor=white)

</p>

Documentation: https://express-api-shield-documentation.vercel.app

---

## Why Express API Shield?

Modern Express applications typically require multiple security packages working together:

* Helmet
* Rate Limiter
* API Key Authentication
* IP Filtering
* Request Sanitization
* Attack Detection
* Request Validation
* Security Logging
* Request IDs

Managing all of these individually increases configuration complexity and often leads to inconsistent behavior.

**Express API Shield** provides a unified, composable security pipeline with consistent configuration, structured error handling, TypeScript support, and production-ready defaults.

Instead of installing and configuring several middleware packages independently, you can secure your application through a single middleware.

```javascript
import express from "express";
import apiShield from "express-api-shield";

const app = express();

app.use(
  apiShield({
    preset: "production"
  })
);
```

Simple.

Readable.

Production ready.

---

# Features

Express API Shield combines multiple security layers into one configurable middleware.

| Feature                       | Included |
| ----------------------------- | :------: |
| API Key Authentication        |     ✅    |
| Rate Limiting                 |     ✅    |
| Security Headers              |     ✅    |
| CORS Protection               |     ✅    |
| IP Allowlist                  |     ✅    |
| IP Blocklist                  |     ✅    |
| Trusted Proxy Support         |     ✅    |
| Request IDs                   |     ✅    |
| Request Fingerprinting        |     ✅    |
| User-Agent Blocking           |     ✅    |
| Request Sanitization          |     ✅    |
| SQL Injection Detection       |     ✅    |
| NoSQL Injection Detection     |     ✅    |
| XSS Detection                 |     ✅    |
| Command Injection Detection   |     ✅    |
| Path Traversal Detection      |     ✅    |
| Template Injection Detection  |     ✅    |
| Prototype Pollution Detection |     ✅    |
| Header Flood Protection       |     ✅    |
| Query Length Protection       |     ✅    |
| Deep Payload Protection       |     ✅    |
| Configuration Validation      |     ✅    |
| Plugin System                 |     ✅    |
| Hooks API                     |     ✅    |
| Custom Logging                |     ✅    |
| TypeScript Support            |     ✅    |
| Production Presets            |     ✅    |

---

# Built for Production

Express API Shield was designed with production deployments in mind.

* Modular middleware pipeline
* TypeScript-first API
* Structured error responses
* Config validation before startup
* Custom plugin architecture
* Request lifecycle hooks
* Security-focused defaults
* Fully testable architecture
* Clean middleware composition
* Zero runtime dependencies beyond required middleware integrations

Whether you're building a small REST API or a large production backend, Express API Shield provides a scalable security foundation.

---

# Installation

### npm

```bash
npm install express-api-shield
```

### pnpm

```bash
pnpm add express-api-shield
```

### yarn

```bash
yarn add express-api-shield
```

### bun

```bash
bun add express-api-shield
```

---

# Quick Start

```typescript
import express from "express";
import apiShield from "express-api-shield";

const app = express();

app.use(
  apiShield({
    preset: "production"
  })
);

app.get("/", (_, res) => {
  res.json({
    success: true
  });
});

app.listen(3000);
```

That's all you need to start protecting your Express application.

---

# A More Complete Example

```typescript
import express from "express";
import apiShield from "express-api-shield";

const app = express();

app.use(
  apiShield({
    preset: "production",

    apiKey: {
      enabled: true,
      keys: ["my-secret-api-key"]
    },

    hooks: {
      onBlocked(event) {
        console.log(event);
      }
    }
  })
);

app.get("/health", (_, res) => {
  res.json({
    status: "ok"
  });
});

app.listen(3000);
```

---

# Why Use Express API Shield?

Instead of this:

```javascript
app.use(helmet());

app.use(cors());

app.use(rateLimit(...));

app.use(apiKeyMiddleware());

app.use(customSanitizer());

app.use(customLogger());

app.use(ipFilter());

app.use(requestValidator());

app.use(requestId());
```

Use one middleware:

```javascript
app.use(
  apiShield({
    preset: "production"
  })
);
```

A single configuration.

A single middleware pipeline.

A consistent security model.

---

# Core Principles

Express API Shield is built around a few simple principles.

### Security First

Secure defaults should require minimal configuration.

### Composable

Enable only the features your application needs.

### Type Safe

Every configuration option is fully typed for an excellent TypeScript experience.

### Extensible

Hooks and plugins allow developers to customize behavior without modifying the library.

### Production Ready

Designed to work reliably behind reverse proxies, load balancers, and modern deployment platforms.

---

# Documentation

The README provides a quick overview of the library.

Complete documentation—including configuration options, middleware reference, plugin development, hooks, API reference, attack detection, and advanced examples—is available on the official documentation website.

> 📚 Documentation
>
> **https://express-api-shield-documentation.vercel.app**

(Replace this URL with your documentation website after deployment.)

---

**Continue to Part 2 → Architecture, Middleware Pipeline, Built-in Protections, Presets, and TypeScript Support.**


---

# Architecture

Express API Shield is built around a modular middleware pipeline.

Instead of one large middleware handling every responsibility, each security feature is implemented as an independent stage in the request lifecycle.

This architecture makes the library:

* Easy to maintain
* Easy to extend
* Highly testable
* Predictable
* Production friendly

Every middleware has a single responsibility and executes in a well-defined order.

---

# Middleware Pipeline

```
                        Incoming Request
                               │
                               ▼
                     Request ID Generation
                               │
                               ▼
                Trusted Proxy / Client IP Resolver
                               │
                               ▼
                 IP Allowlist / Blocklist Validation
                               │
                               ▼
                  User-Agent Validation & Blocking
                               │
                               ▼
                           CORS Handling
                               │
                               ▼
                         Rate Limiting
                               │
                               ▼
                     Body Size Validation
                               │
                               ▼
                  Header & Query Protection
                               │
                               ▼
                    API Key Authentication
                               │
                               ▼
                     Request Sanitization
                               │
                               ▼
               Suspicious Payload Detection
                               │
                               ▼
                     Security Headers
                               │
                               ▼
                        Custom Plugins
                               │
                               ▼
                        Express Routes
```

Every request flows through the same predictable security pipeline before reaching your application.

---

# Request Lifecycle

When a request enters Express API Shield, it goes through several stages:

1. Generate a unique request ID
2. Resolve the client IP (supports reverse proxies)
3. Validate IP allowlists and blocklists
4. Validate User-Agent
5. Handle CORS requests
6. Apply rate limiting
7. Validate body size
8. Protect against oversized headers and query strings
9. Authenticate API keys (optional)
10. Sanitize incoming payloads
11. Detect malicious requests
12. Apply security headers
13. Execute custom plugins
14. Continue to your Express route

If any middleware blocks the request, processing stops immediately and a consistent JSON error response is returned.

---

# Built-in Security Protections

Express API Shield includes protection against many common API attacks.

| Protection                 | Description                                     |
| -------------------------- | ----------------------------------------------- |
| SQL Injection              | Detects common SQL injection payloads           |
| NoSQL Injection            | Detects MongoDB operator injection attempts     |
| Cross-Site Scripting (XSS) | Blocks malicious script payloads                |
| Command Injection          | Detects shell command injection attempts        |
| Path Traversal             | Prevents directory traversal payloads           |
| Template Injection         | Detects server-side template injection patterns |
| Prototype Pollution        | Removes dangerous object properties             |
| Header Flood Protection    | Rejects excessive request headers               |
| Query Length Protection    | Prevents oversized URL attacks                  |
| Deep Payload Protection    | Limits excessive object nesting                 |
| Body Size Limits           | Rejects oversized request bodies                |
| IP Filtering               | Allowlist and blocklist support                 |
| User-Agent Blocking        | Blocks bots and unwanted clients                |
| Rate Limiting              | Protects APIs from abuse                        |
| API Key Authentication     | Protects private endpoints                      |
| Security Headers           | Adds secure HTTP response headers               |
| CORS                       | Built-in cross-origin protection                |

---

# Security Philosophy

Express API Shield follows a simple philosophy:

> **Reject malicious requests as early as possible.**

Instead of allowing dangerous requests to reach your business logic, the middleware validates and filters requests before your application processes them.

This reduces:

* Attack surface
* CPU usage
* Unnecessary database queries
* Log noise
* Unexpected runtime behavior

---

# Production Presets

Express API Shield includes built-in presets for common environments.

## Development

Optimized for local development.

* Request IDs
* Sanitization
* Logging enabled
* Relaxed security headers
* Suspicious requests logged instead of blocked
* Rate limiting disabled

```typescript
app.use(
  apiShield.development()
);
```

---

## Production

Recommended for most applications.

* Request IDs
* Security headers
* Rate limiting
* Trusted proxy support
* Sanitization
* Suspicious requests blocked
* Logging enabled

```typescript
app.use(
  apiShield.production()
);
```

---

## Strict

Maximum protection.

Ideal for:

* Banking APIs
* Internal services
* Enterprise systems
* Administrative dashboards

Includes:

* Smaller body limits
* Aggressive rate limiting
* Strict validation
* Security headers
* Full suspicious request blocking

```typescript
app.use(
  apiShield.strict()
);
```

---

# Configuration

Every feature can be enabled, disabled, or customized.

Example:

```typescript
import apiShield from "express-api-shield";

app.use(
    apiShield({

        preset: "production",

        apiKey: {
            enabled: true,
            keys: ["secret-key"]
        },

        rateLimit: {
            windowMs: 60000,
            max: 100
        },

        bodyLimit: "1mb",

        sanitize: true,

        suspiciousRequests: true

    })
);
```

Express API Shield exposes a fully typed configuration API for complete control over every middleware.

📚 **Complete Configuration Reference**

https://express-api-shield-documentation.vercel.app

---

# TypeScript Support

Express API Shield is written in TypeScript from the ground up.

No additional type packages are required.

Features include:

* Full IntelliSense
* Autocomplete
* Strict typing
* Generic Express support
* Request augmentation
* Typed plugins
* Typed hooks
* Typed logger interface

Example:

```typescript
import apiShield, {
    ApiShieldConfig
} from "express-api-shield";

const config: ApiShieldConfig = {
    preset: "production"
};

app.use(apiShield(config));
```

---

# Request Context

The middleware automatically augments the Express request object.

```typescript
app.get("/", (req, res) => {

    console.log(req.id);

    console.log(req.shield.ip);

    console.log(req.shield.startTime);

    console.log(req.shield.fingerprint);

});
```

This provides useful metadata for logging, tracing, and debugging.

---

# Structured Error Responses

Every blocked request follows the same response format.

```json
{
  "success": false,
  "code": "RATE_LIMITED",
  "reason": "Too many requests.",
  "requestId": "a1b2c3d4",
  "timestamp": "2026-07-03T12:00:00Z",
  "documentation": "https://express-api-shield-documentation.vercel.app"
}
```

Consistent responses make error handling easier for frontend applications and API consumers.

---

# Documentation

The README intentionally focuses on getting started.

Detailed documentation is available online.

* Configuration Reference
* Middleware Guide
* Plugin Development
* Hooks
* Error Codes
* Architecture
* Best Practices
* Security Recommendations
* Migration Guides

📚 **Documentation**

https://express-api-shield-documentation.vercel.app

---

**Continue to Part 3 → Plugins, Hooks, Logging, Performance, Testing, Best Practices, and Advanced Usage.**


---

# Extensible by Design

Express API Shield is designed to be more than a collection of middleware.

Its modular architecture allows developers to extend the request pipeline without modifying the library itself.

Whether you're adding custom authentication, audit logging, request validation, analytics, or organization-specific security rules, the plugin system integrates seamlessly with the existing pipeline.

---

# Plugins

Plugins execute after all built-in security checks have completed successfully.

Each plugin receives a fully typed context containing:

* Current configuration
* Logger instance
* Unified error helper (`fail()`)

## Creating a Plugin

```typescript
import { ShieldPlugin } from "express-api-shield";

export const requestTimer: ShieldPlugin = {
    name: "request-timer",

    setup({ logger }) {

        return (req, res, next) => {

            const start = Date.now();

            res.on("finish", () => {
                logger.info("Request completed", {
                    path: req.path,
                    duration: Date.now() - start
                });
            });

            next();
        };

    }
};
```

Register the plugin:

```typescript
app.use(
    apiShield({
        plugins: [
            requestTimer
        ]
    })
);
```

Plugins make it easy to keep project-specific logic outside the core library.

📚 **Plugin Documentation**

https://express-api-shield-documentation.vercel.app

---

# Request Lifecycle Hooks

Hooks provide lifecycle events without requiring custom middleware.

Available hooks include:

* `onRequest`
* `onResponse`
* `onBlocked`
* `onError`

Example:

```typescript
app.use(
    apiShield({

        hooks: {

            onRequest(req) {
                console.log("Incoming:", req.path);
            },

            onBlocked(event) {
                console.log(event);
            },

            onResponse(req, res) {
                console.log(res.statusCode);
            },

            onError(error) {
                console.error(error);
            }

        }

    })
);
```

Hooks are useful for:

* Monitoring
* Analytics
* Audit logging
* Observability
* Security dashboards
* Custom notifications

---

# Logging

Express API Shield supports custom loggers.

By default, logging can be enabled with:

```typescript
apiShield({
    logging: true
});
```

For complete control, provide your own logger implementation.

```typescript
apiShield({

    logging: {

        info(message, meta) {

        },

        warn(message, meta) {

        },

        error(message, meta) {

        }

    }

});
```

This makes integration straightforward with logging platforms such as:

* Winston
* Pino
* Bunyan
* Cloud Logging
* Datadog
* Elasticsearch
* OpenTelemetry

---

# API Key Authentication

Protect private APIs with built-in API key authentication.

```typescript
apiShield({

    apiKey: {

        enabled: true,

        keys: [

            "my-secret-key"

        ]

    }

});
```

For dynamic authentication, use an asynchronous validator.

```typescript
apiShield({

    apiKey: {

        enabled: true,

        async validate(key) {

            return await database.validateKey(key);

        }

    }

});
```

This allows API keys to be stored in:

* Databases
* Redis
* External authentication services
* Secret managers

---

# Request Fingerprinting

Enable request fingerprinting to identify clients more consistently.

```typescript
apiShield({

    fingerprint: true

});
```

Fingerprints can improve:

* Abuse detection
* Fraud prevention
* Security analytics
* Bot identification

---

# Ignore Routes

Exclude routes from the middleware.

```typescript
apiShield({

    ignore: [

        "/health",

        "/status"

    ]

});
```

This is useful for:

* Health checks
* Internal endpoints
* Metrics
* Monitoring systems

---

# Configuration Validation

Express API Shield validates configuration during initialization.

Instead of silently accepting invalid settings, helpful warnings are generated before the application starts serving requests.

Examples include:

* Invalid API key configuration
* Conflicting IP allowlists and blocklists
* Misconfigured body inspection
* Missing dependencies between middleware

Early validation helps prevent configuration mistakes from reaching production.

---

# Performance

Express API Shield executes middleware in a carefully ordered pipeline.

Features that are disabled are not included in the request lifecycle.

This minimizes unnecessary processing while allowing each application to enable only the protections it requires.

The library is designed with:

* Low runtime overhead
* Minimal allocations
* Predictable execution order
* Early request rejection
* Efficient middleware composition

---

# Testing

The project includes comprehensive automated tests covering multiple aspects of the library.

Current test coverage includes:

* Unit Tests
* Integration Tests
* Security Tests
* Attack Simulations
* Edge Cases
* Performance Benchmarks

Every middleware is tested independently as well as within the complete request pipeline.

---

# Best Practices

For production deployments, it is recommended to:

* Use the `production` preset.
* Enable HTTPS.
* Deploy behind a trusted reverse proxy.
* Rotate API keys regularly.
* Enable request logging.
* Monitor blocked requests.
* Keep dependencies up to date.
* Configure rate limits appropriate for your API.
* Restrict trusted proxies.
* Exclude only essential routes from protection.

---

# Documentation

This README provides a high-level overview of Express API Shield.

Complete documentation is available online, including:

* Full Configuration Reference
* Middleware Reference
* Plugin Development
* Hook API
* Error Codes
* Architecture Guide
* Security Recommendations
* Migration Guides
* Examples
* Frequently Asked Questions

📚 **Documentation**

https://express-api-shield-documentation.vercel.app

---

# Community

Contributions, feature requests, and bug reports are welcome.

If you discover a security issue, please follow the responsible disclosure process described in the Security Policy before creating a public issue.

---

**Continue to Part 4 → Roadmap, FAQ, Contributing, Security Policy, License, Acknowledgements, and final GitHub polish.**


---

# Roadmap

Express API Shield is actively evolving. The long-term goal is to become a comprehensive security framework for Express applications while maintaining a clean, composable developer experience.

Planned improvements include:

### Authentication & Authorization

* JWT validation middleware
* Webhook signature verification
* OAuth helper middleware
* Session protection utilities

### Advanced Security

* CSRF protection
* Honeypot routes
* Adaptive rate limiting
* Dynamic IP blocklists
* Bot detection
* Request anomaly detection
* SSRF detection
* LDAP injection detection
* XXE detection
* HTTP Parameter Pollution (HPP) detection
* Open Redirect detection
* GraphQL attack detection

### Performance

* Redis-backed rate limiter
* Custom rate limit stores
* Distributed request tracking
* Response caching helpers

### Monitoring & Analytics

* Metrics endpoint
* Built-in audit logger
* Security dashboard integration
* Request analytics
* Attack statistics
* Prometheus metrics
* OpenTelemetry support

### Developer Experience

* Additional presets
* CLI configuration validator
* More plugins
* More examples
* Documentation improvements
* Framework integrations

---

# Frequently Asked Questions

### Is Express API Shield a replacement for Helmet?

No.

Helmet is an excellent library focused on HTTP security headers.

Express API Shield uses security headers as one part of a broader security pipeline that also includes authentication, request validation, attack detection, sanitization, rate limiting, and extensibility.

---

### Does it replace express-rate-limit?

Express API Shield includes built-in rate limiting support while providing a unified configuration experience alongside other security features.

---

### Does it work with TypeScript?

Yes.

The library is written entirely in TypeScript and ships with first-class type definitions.

No additional typings are required.

---

### Can I use only the features I need?

Absolutely.

Every middleware can be enabled, disabled, or configured independently.

---

### Can I create custom middleware?

Yes.

The plugin system allows you to extend the pipeline without modifying the core library.

---

### Does it support Express 4?

Yes.

Express API Shield is designed for Express 4 and newer versions.

---

### Can I use it behind Nginx or Cloudflare?

Yes.

Trusted proxy support correctly resolves client IP addresses when deployed behind reverse proxies and load balancers.

---

### Does it modify my request body?

Only if sanitization is enabled.

Sanitization removes dangerous properties commonly used in prototype pollution attacks while preserving legitimate application data.

---

### Is it production ready?

Yes.

The library includes production presets, structured error handling, configuration validation, request lifecycle hooks, and a modular architecture suitable for production deployments.

---

# Documentation

The README intentionally focuses on helping you get started quickly.

Complete documentation is available on the official website.

### Documentation Sections

* Getting Started
* Installation
* Configuration Reference
* Middleware Reference
* Presets
* Plugin Development
* Hook API
* Error Codes
* Architecture
* Security Recommendations
* Examples
* Best Practices
* Migration Guides

📚 **Documentation**

**https://express-api-shield-documentation.vercel.app**

---

# Examples

Example projects are available for common use cases, including:

* Basic REST API
* Production API
* API Key Authentication
* Reverse Proxy Deployment
* Plugin Development
* Custom Logger
* Enterprise Configuration

More examples will continue to be added over time.

---

# Contributing

Contributions are welcome and greatly appreciated.

Whether you're fixing bugs, improving documentation, suggesting new features, or enhancing performance, your contributions help make Express API Shield better for everyone.

### Development

```bash
git clone https://github.com/Sagar10joshi/Express-API-Shield.git

cd express-api-shield

npm install

npm run build

npm test
```

### Before submitting a Pull Request

Please ensure that:

* All tests pass.
* New functionality includes appropriate tests.
* Code follows the existing project style.
* Documentation is updated when necessary.

---

# Reporting Security Issues

If you discover a security vulnerability, please **do not open a public GitHub issue**.

Instead, report the issue responsibly using the contact information provided in the Security Policy.

This allows vulnerabilities to be investigated and fixed before public disclosure.

---

# Compatibility

| Platform                 | Supported |
| ------------------------ | :-------: |
| Node.js 18+              |     ✅     |
| Express 4+               |     ✅     |
| TypeScript               |     ✅     |
| ECMAScript Modules (ESM) |     ✅     |
| CommonJS                 |     ✅     |

---

# Philosophy

Express API Shield follows a simple philosophy:

> **Secure applications should be easy to build.**

Developers should spend their time building products—not assembling and maintaining dozens of independent security middleware.

Express API Shield provides a consistent, extensible, and production-focused security foundation so you can focus on your application logic with confidence.

---

# License

This project is licensed under the **MIT License**.

See the `LICENSE` file for complete details.

---

# Support

If Express API Shield helps secure your applications, consider supporting the project by:

* Starring the repository on GitHub ⭐
* Reporting bugs
* Suggesting new features
* Improving documentation
* Contributing code
* Sharing the project with the community

Every contribution, no matter how small, helps improve the project.

---

# Acknowledgements

Express API Shield builds upon the excellent work of the open-source community.

Special thanks to the maintainers and contributors of:

* Express
* Helmet
* express-rate-limit
* TypeScript
* Vitest
* tsup

Their tools make projects like this possible.

---

# Maintainer

**Sagar Joshi**

GitHub: https://github.com/Sagar10joshi/Express-API-Shield

Documentation: https://express-api-shield-documentation.vercel.app

---

<p align="center">

Built with ❤️ for the Express.js community.

Secure APIs. Simple configuration. Production-ready by default.

</p>
