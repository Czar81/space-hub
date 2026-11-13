const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const errorResponse = (description: string) => ({
  description,
  content: { "application/json": { schema: ref("Error") } },
});
const json = (schema: object) => ({ "application/json": { schema } });
const idParam = (name = "id", description = "Resource id") => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "integer", minimum: 1 },
});
const secured = [{ bearerAuth: [] }];

const unauthorized = errorResponse("Missing, invalid or expired token");
const forbidden = errorResponse("The user role does not allow this action");
const badRequest = errorResponse("Validation error");
const notFound = errorResponse("Resource not found");

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "SpaceHub API",
    version: "2.1.0",
    description:
      "REST API to manage coworking spaces, bookings and memberships. A GraphQL endpoint with the same features is available at `/api/graphql` (HTTP), plus real-time availability subscriptions over WebSocket on the same path (graphql-ws protocol). Protected endpoints require a JWT in the `Authorization: Bearer <token>` header.",
  },
  servers: [{ url: "/", description: "Current server" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Spaces" },
    { name: "Bookings" },
    { name: "Memberships" },
  ],
  paths: {
    "/": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "The API is running",
            content: json({
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                message: { type: "string" },
              },
            }),
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new member account",
        description: "Creates a MEMBER user with a BASIC membership valid for 12 months.",
        requestBody: { required: true, content: json(ref("RegisterRequest")) },
        responses: {
          "201": { description: "User created", content: json(ref("AuthResponse")) },
          "400": badRequest,
          "409": errorResponse("Email already registered"),
          "429": errorResponse("Too many requests"),
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and receive a JWT",
        requestBody: { required: true, content: json(ref("LoginRequest")) },
        responses: {
          "200": { description: "Authenticated", content: json(ref("AuthResponse")) },
          "400": badRequest,
          "401": errorResponse("Invalid credentials"),
          "429": errorResponse("Too many requests"),
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Exchange a refresh token for a new token pair",
        description: "Only refresh tokens are accepted here, an access token is rejected.",
        requestBody: { required: true, content: json(ref("RefreshRequest")) },
        responses: {
          "200": { description: "New tokens", content: json(ref("AuthResponse")) },
          "400": badRequest,
          "401": errorResponse("Invalid or expired refresh token"),
        },
      },
    },
    "/api/spaces": {
      get: {
        tags: ["Spaces"],
        summary: "List active spaces",
        description:
          "Public. Inactive spaces never appear. Two availability filters, combinable:\n\n" +
          "- `date` keeps only spaces that are **free during the whole UTC day**: a space with any active booking that day (even a one hour one) is left out.\n" +
          "- `startTime` + `endTime` keep only spaces with no active booking overlapping that exact range. Use it to find a space for a few hours of a day that already has other bookings.\n\n" +
          "Canceled bookings never block a space.",
        parameters: [
          { name: "type", in: "query", schema: ref("SpaceType") },
          { name: "minCapacity", in: "query", schema: { type: "integer", minimum: 1 } },
          {
            name: "date",
            in: "query",
            description:
              "YYYY-MM-DD. Only spaces with no active booking at any time of that UTC day (free all day).",
            schema: { type: "string", format: "date" },
          },
          {
            name: "startTime",
            in: "query",
            description:
              "ISO 8601 date-time with offset. Start of the range the space must be free; requires `endTime`.",
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "endTime",
            in: "query",
            description: "ISO 8601 date-time with offset, after `startTime`; requires `startTime`.",
            schema: { type: "string", format: "date-time" },
          },
        ],
        responses: {
          "200": {
            description: "Spaces list",
            content: json({ type: "array", items: ref("Space") }),
          },
          "400": badRequest,
        },
      },
      post: {
        tags: ["Spaces"],
        summary: "Create a space (admin)",
        security: secured,
        requestBody: { required: true, content: json(ref("CreateSpaceRequest")) },
        responses: {
          "201": { description: "Space created", content: json(ref("Space")) },
          "400": badRequest,
          "401": unauthorized,
          "403": forbidden,
        },
      },
    },
    "/api/spaces/{id}": {
      parameters: [idParam("id", "Space id")],
      get: {
        tags: ["Spaces"],
        summary: "Get an active space",
        responses: {
          "200": { description: "Space detail", content: json(ref("Space")) },
          "400": badRequest,
          "404": notFound,
        },
      },
      put: {
        tags: ["Spaces"],
        summary: "Update a space (admin)",
        description: "Any subset of the space fields can be sent, at least one is required.",
        security: secured,
        requestBody: { required: true, content: json(ref("UpdateSpaceRequest")) },
        responses: {
          "200": { description: "Space updated", content: json(ref("Space")) },
          "400": badRequest,
          "401": unauthorized,
          "403": forbidden,
          "404": notFound,
        },
      },
      delete: {
        tags: ["Spaces"],
        summary: "Deactivate a space (admin)",
        description:
          "Soft delete: the space and its bookings are kept, it just stops appearing in searches.",
        security: secured,
        responses: {
          "200": { description: "Space deactivated", content: json(ref("Space")) },
          "400": badRequest,
          "401": unauthorized,
          "403": forbidden,
          "404": notFound,
        },
      },
    },
    "/api/bookings": {
      post: {
        tags: ["Bookings"],
        summary: "Create a booking",
        description:
          "Rejects ranges that overlap an active (non canceled) booking of the same space.",
        security: secured,
        requestBody: { required: true, content: json(ref("CreateBookingRequest")) },
        responses: {
          "201": { description: "Booking created", content: json(ref("Booking")) },
          "400": badRequest,
          "401": unauthorized,
          "404": errorResponse("Space not found or inactive"),
          "409": errorResponse("The space is not available at that time"),
        },
      },
      get: {
        tags: ["Bookings"],
        summary: "List bookings",
        description: "Members get their own bookings, admins get every booking.",
        security: secured,
        responses: {
          "200": {
            description: "Bookings list",
            content: json({ type: "array", items: ref("Booking") }),
          },
          "401": unauthorized,
        },
      },
    },
    "/api/bookings/{id}": {
      parameters: [idParam("id", "Booking id")],
      get: {
        tags: ["Bookings"],
        summary: "Get a booking",
        description: "Members can only read their own bookings (others return 404).",
        security: secured,
        responses: {
          "200": { description: "Booking detail", content: json(ref("Booking")) },
          "400": badRequest,
          "401": unauthorized,
          "404": notFound,
        },
      },
    },
    "/api/bookings/{id}/cancel": {
      parameters: [idParam("id", "Booking id")],
      patch: {
        tags: ["Bookings"],
        summary: "Cancel a booking",
        description: "Members can only cancel their own bookings, admins can cancel any.",
        security: secured,
        responses: {
          "200": { description: "Booking canceled", content: json(ref("Booking")) },
          "400": badRequest,
          "401": unauthorized,
          "404": notFound,
          "409": errorResponse("Booking is already canceled"),
        },
      },
    },
    "/api/memberships": {
      get: {
        tags: ["Memberships"],
        summary: "List active memberships (admin)",
        security: secured,
        responses: {
          "200": {
            description: "Memberships list",
            content: json({ type: "array", items: ref("Membership") }),
          },
          "401": unauthorized,
          "403": forbidden,
        },
      },
    },
    "/api/memberships/{userId}": {
      parameters: [idParam("userId", "User id")],
      patch: {
        tags: ["Memberships"],
        summary: "Update a user's membership plan (admin)",
        security: secured,
        requestBody: { required: true, content: json(ref("UpdateMembershipRequest")) },
        responses: {
          "200": { description: "Membership updated", content: json(ref("Membership")) },
          "400": badRequest,
          "401": unauthorized,
          "403": forbidden,
          "404": notFound,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          status: { type: "string", example: "error" },
          message: { type: "string" },
          details: { description: "Extra information, e.g. validation issues" },
        },
      },
      UserRole: { type: "string", enum: ["ADMIN", "MEMBER"] },
      SpaceType: {
        type: "string",
        enum: ["INDIVIDUAL_DESK", "PRIVATE_ROOM", "ENTERPRISE_SUITE"],
        description:
          "INDIVIDUAL_DESK = escritorio individual, PRIVATE_ROOM = sala privada, ENTERPRISE_SUITE = suite empresarial.",
      },
      BookingStatus: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELED"] },
      MembershipPlan: { type: "string", enum: ["BASIC", "PRO", "ENTERPRISE"] },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: ref("UserRole"),
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Jane Doe" },
          email: { type: "string", format: "email", example: "jane@example.com" },
          password: { type: "string", minLength: 8, maxLength: 72, example: "password123" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@spacehub.com" },
          password: { type: "string", example: "password123" },
        },
      },
      RefreshRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: { refreshToken: { type: "string" } },
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: ref("User"),
          token: { type: "string", description: "JWT access token (short lived)" },
          refreshToken: {
            type: "string",
            description: "JWT refresh token, use it in /api/auth/refresh",
          },
        },
      },
      Space: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          type: ref("SpaceType"),
          capacity: { type: "integer" },
          pricePerHour: { type: "integer", description: "Price per hour in USD" },
          location: { type: "string" },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateSpaceRequest: {
        type: "object",
        required: ["name", "type", "capacity", "pricePerHour", "location"],
        properties: {
          name: { type: "string", example: "Focus Room 3" },
          type: ref("SpaceType"),
          capacity: { type: "integer", minimum: 1, example: 6 },
          pricePerHour: { type: "integer", minimum: 1, example: 20 },
          location: { type: "string", example: "San José - Sede Centro" },
          isActive: { type: "boolean", default: true },
        },
      },
      UpdateSpaceRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          name: { type: "string" },
          type: ref("SpaceType"),
          capacity: { type: "integer", minimum: 1 },
          pricePerHour: { type: "integer", minimum: 1 },
          location: { type: "string" },
          isActive: { type: "boolean" },
        },
      },
      CreateBookingRequest: {
        type: "object",
        required: ["spaceId", "startTime", "endTime"],
        properties: {
          spaceId: { type: "integer", example: 1 },
          startTime: {
            type: "string",
            format: "date-time",
            description: "Must be in the future",
            example: "2030-01-15T10:00:00Z",
          },
          endTime: {
            type: "string",
            format: "date-time",
            description: "Must be after startTime",
            example: "2030-01-15T12:00:00Z",
          },
        },
      },
      Booking: {
        type: "object",
        properties: {
          id: { type: "integer" },
          userId: { type: "integer" },
          spaceId: { type: "integer" },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
          status: ref("BookingStatus"),
          totalPrice: {
            type: "string",
            example: "40",
            description: "pricePerHour x duration in hours (decimal serialized as string)",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          space: ref("Space"),
          user: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              email: { type: "string" },
            },
          },
        },
      },
      Membership: {
        type: "object",
        properties: {
          id: { type: "integer" },
          userId: { type: "integer" },
          plan: ref("MembershipPlan"),
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          user: ref("User"),
        },
      },
      UpdateMembershipRequest: {
        type: "object",
        required: ["plan"],
        properties: { plan: ref("MembershipPlan") },
      },
    },
  },
};
