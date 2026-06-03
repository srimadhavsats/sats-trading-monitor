# SATS High-Frequency Telemetry Pipeline - Technical Execution Roadmap

This document outlines the objective, non-speculative engineering milestones structured to scale infrastructure throughput, harden security perimeters, and implement high-availability state persistence layers.

## Phase 1: Ingestion Performance & Server Modernization (Current)
* **ASGI Server Migration:** Replace standard Uvicorn local development server loops with the high-throughput, Rust-based **Granian** runtime to maximize network request handling per second.
* **Environment Extraction:** Abstract all configuration states and remote data endpoints out of application modules into distinct `.env` parameters to ensure deployment environment isolation.
* **Network Handshake Hardening:** Enforce strict cross-origin header checks (CSWSH defense) and regular expression whitelisting across all active endpoint route parameters.

## Phase 2: Distributed State Persistence & Horizontal Scaling
* **Decoupled Cache Architecture:** Migrate the in-memory stateful rolling history array out of local application memory into an independent **Redis** data cache cluster layer.
* **Zero-Loss Replay Syncing:** Ensure client synchronization cycles pull historical ticks directly from the Redis cluster storage layer to prevent telemetry dropouts during backend process restarts.
* **State Management Abstracting:** Transition the frontend configuration states into structured web-storage persistence layers to lock user interface preferences seamlessly across independent browsing sessions.

## Phase 3: Tokenized Authentication & Granular Access Controls
* **Handshake Authentication:** Implement strict JSON Web Token (JWT) or HMAC-signed handshake authorization parameters across all active WebSocket channels.
* **Dynamic Throttling Windows:** Upgrade from simple fixed-window memory tables to a distributed Redis token-bucket algorithm to enforce precise, tiered API rate-limiting rules across public networks.
* **Input Validation Schemas:** Expand the parameter regular expression checks into comprehensive structural input sanitization blocks to completely mitigate advanced parameter injection vectors.

## Phase 4: Automated Verification & Infrastructure Observability
* **End-to-End Testing Suites:** Construct integration test pipelines using `pytest-asyncio` to programmatically mock full-duplex WebSocket data transmissions and exception dropouts.
* **Continuous Testing Pipeline:** Expand the GitHub Actions CI workflow to run automated linting, security audits (`bandit`), and unit testing across multiple target runtime setups (Python 3.13 and Python 3.14-dev).
* **Telemetry Metrics Exporting:** Implement structured Prometheus metric endpoints (`/metrics/system`) to track performance statistics such as connection volume, network latency, and processing times.
