# Leads Management API

This project is an API for managing leads, built with **Hono**, **Drizzle ORM**, and **Neon DB**. The API allows users to retrieve, create, update, and manage leads with functionality to filter by query parameters such as name, source, and owner.

---

## Features
- **GET `/leads`**: Fetch paginated leads with optional filters (e.g., `query`, `source`, `owner`).
- **POST `/leads`**: Create a new lead.
- **PATCH `/leads/:leadId/stage`**: Update the stage of a specific lead.
- **PATCH `/leads/:leadId/owner`**: Update the owner of a specific lead.
