/* ==========================================================
   North Star Bakery - script.js

   1. Pre-order list (products.html): visitors add items to a
      list, change quantities, and remove items.
   2. Form validation (contact.html): checks the request form
      and shows messages next to each field.
   3. Browser storage (localStorage): remembers the pre-order
      list and, if the visitor agrees, their name and email.
   ========================================================== */

/* ---------- Data ---------- */

// Every product a visitor can add to their list (array of objects).
// Each id matches a data-product-id attribute in products.html.
const PRODUCTS = [
  { id: "country-sourdough", name: "Country sourdough", category: "Breads", price: "$8 to $11" },
  { id: "seeded-multigrain", name: "Seeded multigrain", category: "Breads", price: "$9 to $12" },
  { id: "baguettes", name: "Baguettes", category: "Breads", price: "$4 to $6" },
  { id: "sandwich-loaves", name: "Sandwich loaves", category: "Breads", price: "$7 to $9" },
  { id: "signature-loaf", name: "Signature Loaf", category: "Breads", price: "$12" },
  { id: "butter-croissants", name: "Butter croissants", category: "Pastries", price: "$3.75 to $5" },
  { id: "cardamom-knots", name: "Cardamom knots", category: "Pastries", price: "$4 to $4.50" },
  { id: "seasonal-danishes", name: "Seasonal danishes", category: "Pastries", price: "$4.25 to $5.50" },
  { id: "morning-buns-and-scones", name: "Morning buns and scones", category: "Pastries", price: "$3.50 to $4.75" },
  { id: "layer-cakes", name: "Layer cakes", category: "Cakes", price: "$38 to $85" },
  { id: "sheet-cakes-for-events", name: "Sheet cakes for events", category: "Cakes", price: "$60 to $140" },
  { id: "cupcakes", name: "Cupcakes", category: "Cakes", price: "$3.50 each" },
  { id: "cookies", name: "Cookies", category: "Cookies and treats", price: "$2.75 to $3.50" },
  { id: "bars-and-brownies", name: "Bars and brownies", category: "Cookies and treats", price: "$3.50 to $4.50" },
  { id: "party-trays", name: "Party trays", category: "Cookies and treats", price: "$30 to $75" }
];

// How many days' notice each request type needs (object).
const LEAD_TIME_DAYS = {
  "pre-order": 1,
  "custom-cake": 3,
  "event-order": 3
};

// Names used for localStorage keys (object).
const STORAGE_KEYS = {
  list: "northStarPreorderList",
  contact: "northStarContactInfo"
};

const MAX_QUANTITY = 24;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\d{3}-\d{3}-\d{4}$/;

// The visitor's list: an array of { id, quantity } objects.
let savedList = [];


/* ---------- Browser storage helpers ---------- */

function loadFromStorage(key, fallbackValue) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallbackValue;
  } catch (error) {
    // Storage can be blocked (private browsing) or hold bad data.
    return fallbackValue;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // If storage is unavailable, the page still works for this visit.
  }
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // Nothing to remove if storage is unavailable.
  }
}


/* ---------- Pre-order list logic ---------- */

function findProduct(productId) {
  return PRODUCTS.find(function (product) {
    return product.id === productId;
  });
}

function findListItem(productId) {
  return savedList.find(function (item) {
    return item.id === productId;
  });
}

function loadList() {
  const stored = loadFromStorage(STORAGE_KEYS.list, []);
  // Keep only entries that still match a real product.
  savedList = Array.isArray(stored)
    ? stored.filter(function (item) { return findProduct(item.id); })
    : [];
}

function saveList() {
  saveToStorage(STORAGE_KEYS.list, savedList);
}

function getTotalItemCount() {
  return savedList.reduce(function (total, item) {
    return total + item.quantity;
  }, 0);
}

function addToList(productId) {
  if (!findListItem(productId)) {
    savedList.push({ id: productId, quantity: 1 });
    saveList();
  }
  renderPage();
}

function changeQuantity(productId, amount) {
  const item = findListItem(productId);
  if (!item) {
    return;
  }
  item.quantity = Math.min(item.quantity + amount, MAX_QUANTITY);
  if (item.quantity <= 0) {
    removeFromList(productId);
    return;
  }
  saveList();
  renderPage();
}

function removeFromList(productId) {
  savedList = savedList.filter(function (item) {
    return item.id !== productId;
  });
  saveList();
  renderPage();
}

function clearList() {
  savedList = [];
  saveList();
  renderPage();
}

// Turns the list into plain text for the request form.
function formatListAsText() {
  return savedList.map(function (item) {
    return item.quantity + " x " + findProduct(item.id).name;
  }).join("\n");
}


/* ---------- Rendering the list ---------- */

function createButton(label, action, productId, extraClass) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = productId;
  if (extraClass) {
    button.className = extraClass;
  }
  return button;
}

function createListItem(item, editable) {
  const product = findProduct(item.id);
  const li = document.createElement("li");
  li.className = "saved-item";

  const details = document.createElement("div");
  details.className = "saved-details";
  const name = document.createElement("span");
  name.className = "saved-name";
  name.textContent = product.name;
  const price = document.createElement("span");
  price.className = "saved-price";
  price.textContent = product.price;
  details.append(name, price);
  li.append(details);

  if (!editable) {
    const quantity = document.createElement("span");
    quantity.className = "saved-qty-text";
    quantity.textContent = "Qty " + item.quantity;
    li.append(quantity);
    return li;
  }

  const controls = document.createElement("div");
  controls.className = "qty-controls";
  const minus = createButton("−", "decrease", item.id, "qty-button");
  minus.setAttribute("aria-label", "One fewer " + product.name);
  const count = document.createElement("span");
  count.className = "qty-value";
  count.textContent = item.quantity;
  const plus = createButton("+", "increase", item.id, "qty-button");
  plus.setAttribute("aria-label", "One more " + product.name);
  plus.disabled = item.quantity >= MAX_QUANTITY;
  controls.append(minus, count, plus);

  const remove = createButton("Remove", "remove", item.id, "link-button");
  remove.setAttribute("aria-label", "Remove " + product.name + " from my list");

  li.append(controls, remove);
  return li;
}

function renderList(listElement, editable) {
  if (!listElement) {
    return;
  }
  listElement.innerHTML = "";
  savedList.forEach(function (item) {
    listElement.append(createListItem(item, editable));
  });
}

function renderListCount() {
  const countText = document.getElementById("list-count");
  const actions = document.getElementById("list-actions");
  if (!countText) {
    return;
  }
  const total = getTotalItemCount();
  if (total === 0) {
    countText.textContent = "Your list is empty.";
  } else {
    countText.textContent = "You have " + total + (total === 1 ? " item" : " items") + " on your list.";
  }
  if (actions) {
    actions.hidden = total === 0;
  }
}

// Adds an "Add to my list" button to each product card once.
function createSaveButtons() {
  const cards = document.querySelectorAll("[data-product-id]");
  cards.forEach(function (card) {
    const productId = card.dataset.productId;
    if (!findProduct(productId) || card.querySelector(".save-button")) {
      return;
    }
    card.append(createButton("Add to my list", "add", productId, "save-button"));
  });
}

// Updates each card's button to show whether it's already saved.
function renderSaveButtons() {
  const buttons = document.querySelectorAll(".save-button");
  buttons.forEach(function (button) {
    const item = findListItem(button.dataset.id);
    const productName = findProduct(button.dataset.id).name;
    if (item) {
      button.textContent = "On my list (" + item.quantity + ")";
      button.classList.add("is-saved");
      button.setAttribute("aria-label", productName + " is on your list. Add one more.");
      button.dataset.action = "increase";
    } else {
      button.textContent = "Add to my list";
      button.classList.remove("is-saved");
      button.setAttribute("aria-label", "Add " + productName + " to my list");
      button.dataset.action = "add";
    }
  });
}

function renderContactList() {
  const panel = document.getElementById("contact-list");
  if (!panel) {
    return;
  }
  panel.hidden = savedList.length === 0;
  renderList(document.getElementById("contact-saved-items"), false);
}

function renderPage() {
  renderList(document.getElementById("saved-items"), true);
  renderListCount();
  renderSaveButtons();
  renderContactList();
}

// One click handler for every list button (event delegation).
function handleListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }
  const productId = button.dataset.id;
  const actions = {
    add: function () { addToList(productId); },
    increase: function () { changeQuantity(productId, 1); },
    decrease: function () { changeQuantity(productId, -1); },
    remove: function () { removeFromList(productId); }
  };
  const action = button.dataset.action;
  if (!actions[action]) {
    return;
  }
  const wasInList = button.closest(".saved-items") !== null;
  actions[action]();
  restoreFocus(action, productId, wasInList);
}

// The list is rebuilt after each change, so put keyboard focus back
// on the matching button instead of losing it.
function restoreFocus(action, productId, wasInList) {
  let selector = '.save-button[data-id="' + productId + '"]';
  if (wasInList) {
    selector = '.saved-items button[data-action="' + action + '"][data-id="' + productId + '"]';
  }
  const target = document.querySelector(selector) || document.getElementById("list-count");
  if (target) {
    if (target.id === "list-count") {
      target.setAttribute("tabindex", "-1");
    }
    target.focus();
  }
}

function setupPreorderList() {
  loadList();
  createSaveButtons();
  renderPage();

  document.addEventListener("click", handleListClick);

  const clearButton = document.getElementById("clear-list");
  if (clearButton) {
    clearButton.addEventListener("click", clearList);
  }

  // Keep the list in sync if it changes in another open tab.
  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEYS.list) {
      loadList();
      renderPage();
    }
  });
}


/* ---------- Form validation ---------- */

function getTodayAtMidnight() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

// Reads "YYYY-MM-DD" as a local date (not UTC).
function parseDateInput(value) {
  const parts = value.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function getRequestType() {
  const select = document.getElementById("request-type");
  return select ? select.value : "";
}

// One rule per field (object of functions). Each returns an error
// message, or an empty string when the value is fine.
const VALIDATION_RULES = {
  "name": function (value) {
    if (value === "") {
      return "Please enter your full name.";
    }
    if (value.length < 2) {
      return "Your name needs at least 2 characters.";
    }
    return "";
  },
  "email": function (value) {
    if (value === "") {
      return "Please enter your email address so we can reply.";
    }
    if (!EMAIL_PATTERN.test(value)) {
      return "Please enter an email in the format name@example.com.";
    }
    return "";
  },
  "phone": function (value) {
    if (value !== "" && !PHONE_PATTERN.test(value)) {
      return "Please use the format 612-555-0142, or leave this blank.";
    }
    return "";
  },
  "request-type": function (value) {
    return value === "" ? "Please choose what we can help with." : "";
  },
  "pickup-date": function (value) {
    const leadDays = LEAD_TIME_DAYS[getRequestType()];
    if (leadDays === undefined) {
      return ""; // General questions don't need a date.
    }
    if (value === "") {
      return "Please choose a pickup date for your order.";
    }
    const pickup = parseDateInput(value);
    const earliest = getTodayAtMidnight();
    earliest.setDate(earliest.getDate() + leadDays);
    if (pickup < getTodayAtMidnight()) {
      return "That date has already passed. Please choose a future date.";
    }
    if (pickup < earliest) {
      return "This order needs " + leadDays + (leadDays === 1 ? " day's" : " days'") +
        " notice. The earliest pickup is " + formatDate(earliest) + ".";
    }
    if (pickup.getDay() === 1) {
      return "We're closed on Mondays. Please choose another day.";
    }
    return "";
  },
  "item-details": function (value) {
    if (value === "") {
      return "Please tell us what you'd like to order or ask.";
    }
    if (value.length < 5) {
      return "Please add a little more detail (at least 5 characters).";
    }
    if (value.length > 1000) {
      return "Please keep this under 1,000 characters (you have " + value.length + ").";
    }
    return "";
  },
  "allergy-notes": function (value) {
    if (value.length > 500) {
      return "Please keep allergy notes under 500 characters (you have " + value.length + ").";
    }
    return "";
  }
};

function showError(field, message) {
  const errorElement = document.getElementById(field.id + "-error");
  field.setAttribute("aria-invalid", "true");
  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearError(field) {
  const errorElement = document.getElementById(field.id + "-error");
  field.removeAttribute("aria-invalid");
  if (errorElement) {
    errorElement.textContent = "";
  }
}

// Checks one field and shows or clears its message.
function validateField(field) {
  const rule = VALIDATION_RULES[field.id];
  if (!rule) {
    return true;
  }
  const message = rule(field.value.trim());
  if (message) {
    showError(field, message);
    return false;
  }
  clearError(field);
  return true;
}

// Checks every field and returns the ones that failed.
function validateForm(form) {
  const invalidFields = [];
  Object.keys(VALIDATION_RULES).forEach(function (fieldId) {
    const field = form.querySelector("#" + fieldId);
    if (field && !validateField(field)) {
      invalidFields.push(field);
    }
  });
  return invalidFields;
}

function showFormStatus(message, type) {
  const status = document.getElementById("form-status");
  if (!status) {
    return;
  }
  status.textContent = message;
  status.className = "form-status " + type;
  status.hidden = false;
}

function hideFormStatus() {
  const status = document.getElementById("form-status");
  if (status) {
    status.hidden = true;
  }
}


/* ---------- Remembering contact details ---------- */

function saveContactInfo(form) {
  const remember = form.querySelector("#remember-me");
  if (remember && remember.checked) {
    saveToStorage(STORAGE_KEYS.contact, {
      name: form.querySelector("#name").value.trim(),
      email: form.querySelector("#email").value.trim()
    });
  } else {
    removeFromStorage(STORAGE_KEYS.contact);
  }
}

function fillContactInfo(form) {
  const contact = loadFromStorage(STORAGE_KEYS.contact, null);
  if (!contact || !contact.name) {
    return null;
  }
  form.querySelector("#name").value = contact.name;
  form.querySelector("#email").value = contact.email || "";
  form.querySelector("#remember-me").checked = true;
  return contact;
}


/* ---------- Form events ---------- */

function handleSubmit(event) {
  event.preventDefault(); // Stop the form from sending until it's valid.
  const form = event.target;
  const invalidFields = validateForm(form);

  if (invalidFields.length > 0) {
    const count = invalidFields.length;
    showFormStatus(
      "Please fix the " + (count === 1 ? "highlighted field" : count + " highlighted fields") + " below, then try again.",
      "is-error"
    );
    invalidFields[0].focus();
    return;
  }

  const name = form.querySelector("#name").value.trim();
  const email = form.querySelector("#email").value.trim();
  saveContactInfo(form);

  showFormStatus(
    "Thank you, " + name + "! We received your request and will reply to " + email + " within one business day.",
    "is-success"
  );

  form.reset();
  fillContactInfo(form); // Put remembered details back after reset.
  document.getElementById("form-status").scrollIntoView({ behavior: "smooth", block: "center" });
}

function handleUseList() {
  const details = document.getElementById("item-details");
  const listText = formatListAsText();
  if (details.value.trim() === "") {
    details.value = listText;
  } else if (details.value.indexOf(listText) === -1) {
    details.value = details.value.trim() + "\n" + listText;
  }

  // A list means an order, so suggest the matching request type.
  const requestType = document.getElementById("request-type");
  if (requestType.value === "") {
    requestType.value = "pre-order";
  }
  validateField(details);
  details.focus();
}

function setupForm() {
  const form = document.getElementById("request-form");
  if (!form) {
    return;
  }

  const contact = fillContactInfo(form);
  if (contact) {
    showFormStatus("Welcome back, " + contact.name + "! We filled in your saved contact details.", "is-info");
  }

  form.addEventListener("submit", handleSubmit);

  // Pressing the mouse on "Send request" would normally make the field the
  // visitor just left show its error first. That message pushes the button
  // down before the mouse is released, so the click misses. Keeping focus
  // where it is lets the click land; handleSubmit then checks every field.
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.addEventListener("mousedown", function (event) {
    event.preventDefault();
  });

  // Check a field when the visitor leaves it, if they typed something.
  form.addEventListener("focusout", function (event) {
    const field = event.target;
    if (VALIDATION_RULES[field.id] && field.value.trim() !== "") {
      validateField(field);
    }
  });

  // Once a field shows an error, re-check it while the visitor fixes it.
  form.addEventListener("input", function (event) {
    const field = event.target;
    if (field.getAttribute("aria-invalid") === "true") {
      validateField(field);
    }
    if (field.id !== "remember-me") {
      hideFormStatus();
    }
  });

  // The pickup date rules depend on the request type.
  form.querySelector("#request-type").addEventListener("change", function () {
    const pickup = form.querySelector("#pickup-date");
    if (pickup.value !== "" || pickup.getAttribute("aria-invalid") === "true") {
      validateField(pickup);
    }
  });

  const useListButton = document.getElementById("use-list");
  if (useListButton) {
    useListButton.addEventListener("click", handleUseList);
  }
}


/* ---------- Start ---------- */

setupPreorderList();
setupForm();
