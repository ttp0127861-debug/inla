const { json, fail } = require("../lib/http");
const { readBody, pathParam, parsePagination } = require("../lib/request");
const { loadCustomerForAccess } = require("../services/access");
const contactService = require("../services/contacts");
const { parseCreateContact, parseUpdateContact } = require("../services/validation");

async function list(event) {
  const code = pathParam(event, "code");
  const loaded = await loadCustomerForAccess(event, code);
  if (loaded.response) return loaded.response;
  const pagination = parsePagination(event.queryStringParameters || {});
  return json(200, await contactService.listContacts(loaded.customer.id, pagination));
}

async function create(event) {
  const code = pathParam(event, "code");
  const loaded = await loadCustomerForAccess(event, code);
  if (loaded.response) return loaded.response;
  const contact = await contactService.createContact(
    event,
    loaded.customer.id,
    parseCreateContact(readBody(event))
  );
  return json(201, { contact });
}

async function get(event) {
  const code = pathParam(event, "code");
  const contactId = pathParam(event, "contactId");
  const loaded = await loadCustomerForAccess(event, code);
  if (loaded.response) return loaded.response;
  const contact = await contactService.getContact(loaded.customer.id, contactId);
  if (!contact) return fail(404, "NOT_FOUND", "Contact not found.");
  return json(200, { contact });
}

async function update(event) {
  const code = pathParam(event, "code");
  const contactId = pathParam(event, "contactId");
  const loaded = await loadCustomerForAccess(event, code);
  if (loaded.response) return loaded.response;
  const existing = await contactService.getContact(loaded.customer.id, contactId);
  if (!existing) return fail(404, "NOT_FOUND", "Contact not found.");
  const contact = await contactService.updateContact(
    event,
    loaded.customer.id,
    contactId,
    parseUpdateContact(readBody(event))
  );
  return json(200, { contact });
}

async function deactivate(event) {
  const code = pathParam(event, "code");
  const contactId = pathParam(event, "contactId");
  const loaded = await loadCustomerForAccess(event, code);
  if (loaded.response) return loaded.response;
  const existing = await contactService.getContact(loaded.customer.id, contactId);
  if (!existing) return fail(404, "NOT_FOUND", "Contact not found.");
  const contact = await contactService.deactivateContact(event, loaded.customer.id, contactId);
  return json(200, { contact });
}

module.exports = { list, create, get, update, deactivate };
