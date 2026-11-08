const { isDatabaseConfigured } = require("inla-s-db");
const { fail, mapError } = require("./lib/http");
const { requireCustomerModule, enrichPrincipal } = require("./middleware/auth");
const customers = require("./handlers/customers");
const contacts = require("./handlers/contacts");
const sales = require("./handlers/sales");
const history = require("./handlers/history");

exports.handler = async (event) => {
  try {
    if (!isDatabaseConfigured()) {
      return fail(500, "INTERNAL_ERROR", "DATABASE_URL is not configured.");
    }
    const denied = requireCustomerModule(event);
    if (denied) return denied;
    await enrichPrincipal(event);

    const key = event.routeKey;
    if (key === "GET /customers") return customers.list(event);
    if (key === "POST /customers") return customers.create(event);
    if (key === "GET /customers/{code}") return customers.get(event);
    if (key === "PUT /customers/{code}") return customers.update(event);
    if (key === "POST /customers/{code}/deactivate") return customers.deactivate(event);
    if (key === "POST /customers/{code}/activate") return customers.activate(event);
    if (key === "GET /customers/{code}/contacts") return contacts.list(event);
    if (key === "POST /customers/{code}/contacts") return contacts.create(event);
    if (key === "GET /customers/{code}/contacts/{contactId}") return contacts.get(event);
    if (key === "PUT /customers/{code}/contacts/{contactId}") return contacts.update(event);
    if (key === "POST /customers/{code}/contacts/{contactId}/deactivate") return contacts.deactivate(event);
    if (key === "GET /customers/{code}/sales") return sales.list(event);
    if (key === "POST /customers/{code}/sales") return sales.add(event);
    if (key === "POST /customers/{code}/sales/{salesUsername}/remove") return sales.remove(event);
    if (key === "GET /customers/{code}/history") return history.list(event);
    return fail(404, "NOT_FOUND", "Route not found.");
  } catch (error) {
    if (error.name === "ValidationError") return fail(400, "VALIDATION_ERROR", error.message);
    return mapError(error);
  }
};
