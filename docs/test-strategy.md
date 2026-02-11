# Test Strategy — CALTRC

## Test Framework & Tooling

| Tool | Purpose |
|------|---------|
| **Jest** (v29) | Unit and integration test runner |
| **Node.js assert / Jest matchers** | Assertions |
| **Jest mocks** | Stub external dependencies (API, data store) |

### Run tests locally

```bash
npm install
npm test
```

---

## Unit Tests — First Behaviors

| # | Behavior | Module | Priority |
|---|----------|--------|----------|
| 1 | Survey validation rejects incomplete surveys | Survey Module | High |
| 2 | Goal computation returns correct calorie target from survey input | Goal Engine | High |
| 3 | Food entry creation builds a valid entry object from input data | Food Logger | High |
| 4 | Barcode lookup returns macros for a known barcode (mocked API) | Food Logger | Medium |
| 5 | Daily summary correctly sums calories from logged entries | Goal Engine | Medium |

---

## Integration Tests — First Flows

| # | Flow | Modules Involved |
|---|------|-----------------|
| 1 | Submit survey → goal is computed and stored | Survey Module, Goal Engine, Data Store |
| 2 | Log food entry → daily summary reflects new entry | Food Logger, Goal Engine, Data Store |
| 3 | API endpoint round-trip: POST + GET returns consistent data | API Layer, all modules |

---

## Mocks & Stubs

| Dependency | Mock Strategy | Rationale |
|-----------|--------------|-----------|
| **OpenFoodFacts API** | Stub with static JSON responses in `tests/fixtures/` | Avoid network dependency; deterministic results |
| **Data Store** | In-memory implementation | Test isolation; no file I/O side effects |

---

## Test Data / Fixtures Strategy

Store fixtures in `tests/fixtures/`:

```
tests/
  fixtures/
    sampleSurvey.json       # Valid survey response
    incompleteSurvey.json    # Invalid (missing required fields)
    foodEntry.json           # Sample food entry
    barcodeResponse.json     # Mock OpenFoodFacts API response
```

Each test file imports fixtures rather than defining inline data, ensuring consistency across tests.

---

## CI Plan for M3

In M3 we will add a **GitHub Actions** workflow (`.github/workflows/test.yml`) that automatically runs `npm test` on every push and pull request targeting the `main` branch. The workflow will:
- Install Node.js 18
- Run `npm ci` for reproducible installs
- Execute `npm test` with the `--ci` flag for cleaner output
- Fail the build if any test fails, blocking the PR from merging

This ensures that no code reaches `main` without passing the full test suite.
