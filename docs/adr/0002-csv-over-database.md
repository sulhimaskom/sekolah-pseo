# ADR-0002: CSV over Database

## Status

Accepted

## Date

2026-01-07

## Context

The project needed a data storage solution for Indonesian school directory data. Considerations included:

- Database options (PostgreSQL, SQLite, MongoDB)
- File-based storage (CSV, JSON)
- Data portability requirements
- Infrastructure simplicity

## Decision

Use CSV files for data storage instead of a database management system.

## Consequences

### Positive

- Simple and portable data format
- Low overhead - no database server required
- Easy to version control and audit
- Simple ETL pipeline processing
- No infrastructure management needed

### Negative

- Limited query capabilities compared to databases
- Potential performance issues with large datasets
- No built-in indexing or relationship management
- Concurrent write handling requires additional logic

### Neutral

- Appropriate for static site generation use case
- Data can be exported to database if requirements change

## Status History

| Date       | Status   | Notes                            |
| ---------- | -------- | -------------------------------- |
| 2026-01-07 | Accepted | Initial decision for CSV storage |
