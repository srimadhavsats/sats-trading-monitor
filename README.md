# SATS High-Frequency Telemetry Pipeline

A resilient, real-time market data streaming pipeline utilizing stateful full-duplex WebSocket channels, automated data validation, and a high-precision telemetry visualization interface.

## 1. Architectural Overview

The application is structured as a decoupled micro-architecture designed for low-latency distribution of high-frequency market metrics.

* **Ingestion & Analytics Engine (Backend):** Built with FastAPI and powered by asynchronous orchestration routines (`asyncio`, `httpx`). It polls raw exchange data, evaluates transactional data anomalies (volume threshold checks), and computes intraday percentage price volatility spread indexes before broadcasting payloads.
* **Connection Coordinator (State Management):** A decentralized `ConnectionManager` that handles full-duplex client handshakes, tracks subscriber allocation metrics per channel, and enforces explicit security rails.
* **Visualization Layer (Frontend):** A modern React interface built on Vite that handles high-frequency data states, utilizes dynamic vector path plotting (SVG) for asset velocity charts, and implements client-side network resilience protocols.

## 2. Security Posture

* **Cross-Origin Validation (CSWSH Defense):** Strict origin-header verification occurs inside the active connection route to protect against Cross-Site WebSocket Hijacking vectors.
* **Input Sanitization Layer:** Structural path arguments are filtered through strict alphanumeric regular expression whitelists (`^[A-Za-z0-9\-]+$`) to prevent injection or path traversal attempts.
* **Environment Isolation:** Server endpoints, CORS permissions, and gateway configurations are fully abstracted out of operational logic into distinct environment configurations.

## 3. Environment Variable Matrix

A `.env` configuration file must be located inside the `/backend` directory to establish localized deployment environments. Refer to `backend/.env.example` for baseline schema boundaries:

| Variable Parameter | Data Type | Operational Purpose / Definition |
| :--- | :--- | :--- |
| `BYBIT_API_URL` | String (URL) | Upstream exchange data node endpoint address |
| `CONNECTION_TIMEOUT_SECONDS` | Float | Maximum duration permitted for socket requests before exception timeout |
| `STREAM_HEARTBEAT_DELAY` | Float | Active sleep interval pacing exchange polling routines |
| `ALLOWED_ORIGIN_PRIMARY` | String (URL) | Whitelisted cross-origin location authorized for client handshakes |
| `ALLOWED_ORIGIN_SECONDARY` | String (URL) | Secondary authorized development server cross-origin location |

## 4. Local Installation & Deployment Workflow

### Prerequisites
* Python 3.13+
* Node.js 18+

### Backend Service Initialization
1. Navigate to the backend workspace and initialize a virtual environment:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use: .\venv\Scripts\activate
  '''
2. Install necessary framework dependencies:
  ```
  pip install -r requirements.txt
  ```
3. Establish an active environment mapping: 
  ```
  cp .env.example .env
  ```
4. Run the development environment hot-reloader:
  ```
  fastapi dev main.py
  ```
### Frontend Interface Initialization
1. Move into the frontend directory:
  ```
  cd ../frontend
  ```
2. Install node dependencies:
  ```
  npm install
  ```
3. Boot up the local Vite development server:
  ```
  npm run dev
  ```
## 5. Automated Testing & Verification Suite
Continuous Integration rules are configured to execute automated test validation suites against the Python 3.13 runtime upon every remote code push event.
To execute the unit regression tests locally inside the virtual environment console, trigger the execution binary:
  ```
  cd backend
  pytest -v
  ```
  
The test runner will execute assertions across the following validation boundaries:
  
> test_calculate_volatility_spread_valid_bounds: Validates computation metrics under normal ranges.
  
> test_calculate_volatility_spread_zero_division_safety: Verifies zero-floor mathematical protections.
  
> test_evaluate_whale_activity_above_boundary: Verifies volume threshold alert triggers.
  
> test_evaluate_whale_activity_below_boundary: Assures standard range boundary evaluation.

*(Ensure the file updates are completely saved to disk by pressing **`Ctrl + S`** in your editor before proceeding).*

## ⚖️ License

This project is licensed under the **MIT License** - see the [LICENSE](https://github.com/srimadhavsats/sats-trading-monitor/blob/main/LICENSE) file for details.

> **Disclaimer:** This is a financial monitoring tool designed for technical analysis and market observation. Trading involves significant risk, and the author is not responsible for any financial losses incurred through the use of this software. Always verify market signals through multiple independent data points.
