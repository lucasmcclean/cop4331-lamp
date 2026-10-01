const urlBase =
  typeof window !== "undefined" &&
    window.location &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.origin.includes("disc.quest"))
    ? "/api/index.php"
    : "https://disc.quest/api/index.php";

const loginUrlBase = urlBase;

let firstName = "";
let lastName = "";
let userId = 0;

// ============================================================
//  Helpers
// ============================================================

function field(id) {
  let el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function clearFields(...ids) {
  ids.forEach((id) => {
    let el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function setMessage(el, msg, ok) {
  if (!el) return;
  el.className = (ok ? "text-success-wcag" : "text-danger-wcag") + " small fw-semibold";
  el.innerHTML = msg;
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

// Every API failure funnels through here. Without it the UI reported the
// wrong thing: an expired session showed "Error searching contacts", and
// the raw 401 body ("Unauthorized") was printed into the page.
function showApiError(xhr, resultEl, fallback) {
  if (xhr.status === 401) {
    window.location.href = "SignIn.html";
    return;
  }

  let msg = fallback;
  try {
    msg = JSON.parse(xhr.responseText).error || fallback;
  } catch (e) {
    /* Non-JSON error body; keep the fallback text. */
  }

  setMessage(resultEl, escapeHtml(msg), false);
}

// Reads the row the clicked button belongs to. Keeping values in data-*
// attributes is what lets us render names safely: interpolating them into an
// inline onclick broke the attribute on any name containing an apostrophe.
function rowData(el, selector) {
  let row = el.closest(selector);
  return row ? row.dataset : null;
}

// ============================================================
//  Session
// ============================================================

function doLogin() {
  userId = 0;
  firstName = "";
  lastName = "";

  let login = field("loginName");
  let password = field("loginPassword");
  let resultEl = document.getElementById("loginResult");
  resultEl.innerHTML = "";

  if (!login || !password) {
    setMessage(
      resultEl,
      "<i class='bi bi-exclamation-triangle-fill me-1'></i> Please enter a username and password",
      false
    );
    return;
  }

  let xhr = new XMLHttpRequest();
  xhr.open("POST", loginUrlBase + "?action=login", true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 200) {
      let json = JSON.parse(this.responseText);
      userId = json.id;
      firstName = json.firstName;
      lastName = json.lastName;

      saveCookie();
      window.location.href = json.admin === 1 ? "AdminPage.html" : "ContactManager.html";
    } else {
      // A 403 here is a disabled account, which is worth showing verbatim.
      showApiError(this, resultEl, "Login failed");
    }
  };

  xhr.send(JSON.stringify({ login: login, password: password }));
}

// Display-only cookie used to render the header name. The PHP session
// HttpOnly cookie is the sole credential; the server re-checks every request.
function saveCookie() {
  let minutes = 20;
  let date = new Date();
  date.setTime(date.getTime() + minutes * 60 * 1000);
  document.cookie =
    "firstName=" +
    encodeURIComponent(firstName) +
    ",lastName=" +
    encodeURIComponent(lastName) +
    ",userId=" +
    userId +
    ";expires=" +
    date.toGMTString() +
    ";path=/";
}

function readCookie() {
  userId = -1;

  document.cookie.split(";").forEach((pair) => {
    pair.split(",").forEach((token) => {
      let idx = token.indexOf("=");
      let key = token.slice(0, idx).trim();
      let val = decodeURIComponent(token.slice(idx + 1).trim());

      if (key === "firstName") firstName = val;
      else if (key === "lastName") lastName = val;
      else if (key === "userId") userId = parseInt(val);
    });
  });

  if (userId < 0 || isNaN(userId)) {
    window.location.href = "index.html";
    return;
  }

  let userNameEl = document.getElementById("userName");
  if (!userNameEl) return;

  userNameEl.innerHTML =
    "<i class='bi bi-person-circle me-1' style='color: #2f6b3f;'></i> " +
    "<span style='color: #2f6b3f;'>Logged in as <strong></strong></span>";
  userNameEl.querySelector("strong").textContent = firstName + " " + lastName;
}

function doLogout() {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", urlBase + "?action=logout", true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  xhr.onload = function () {
    firstName = "";
    lastName = "";
    userId = 0;
    document.cookie = "firstName=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    window.location.href = "index.html";
  };

  xhr.send();
}

// ============================================================
//  Contacts
// ============================================================

function addAccount() {
  let login = field("newLogin");
  let password = field("newPassword");
  let newFirst = field("newFirstName");
  let newLast = field("newLastName");
  let resultEl = document.getElementById("signUpResult");
  resultEl.innerHTML = "";

  if (!login || !password || !newFirst || !newLast) {
    setMessage(
      resultEl,
      "<i class='bi bi-exclamation-triangle-fill me-1'></i> Please enter all required information",
      false
    );
    return;
  }

  let xhr = new XMLHttpRequest();
  xhr.open("POST", urlBase + "?action=register", true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 201 || this.status === 200) {
      setMessage(
        resultEl,
        "<i class='bi bi-check-circle-fill me-1'></i> New user successfully created",
        true
      );
      clearFields("newLogin", "newPassword", "newFirstName", "newLastName");
      setTimeout(function () {
        window.location.href = "SignIn.html";
      }, 1500);
    } else {
      showApiError(this, resultEl, "Failed to create user");
    }
  };

  xhr.send(
    JSON.stringify({
      firstName: newFirst,
      lastName: newLast,
      login: login,
      password: password,
    })
  );
}

function addContact() {
  let first = field("firstName");
  let last = field("lastName");
  let email = field("emailAdd");
  let phone = field("phoneNum");
  let resultEl = document.getElementById("contactAddResult");
  resultEl.innerHTML = "";

  if (!first || !last || !email || !phone) {
    setMessage(
      resultEl,
      "<i class='bi bi-exclamation-triangle-fill me-1'></i> Please enter all required information",
      false
    );
    return;
  }

  let xhr = new XMLHttpRequest();
  xhr.open("POST", urlBase, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 201 || this.status === 200) {
      setMessage(
        resultEl,
        "<i class='bi bi-check-circle-fill me-1'></i> New contact successfully created",
        true
      );
      clearFields("firstName", "lastName", "emailAdd", "phoneNum");
    } else {
      showApiError(this, resultEl, "Failed to create contact");
    }
  };

  xhr.send(
    JSON.stringify({
      firstName: first,
      lastName: last,
      email: email,
      phoneNumber: phone,
    })
  );
}

function searchContacts() {
  let search = field("searchValue");
  let resultEl = document.getElementById("contactSearchResult");
  resultEl.innerHTML = "";

  let xhr = new XMLHttpRequest();
  xhr.open("GET", urlBase + "?q=" + encodeURIComponent(search), true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 200) {
      let contacts = JSON.parse(this.responseText).contacts || [];
      resultEl.className = "mt-2 d-flex flex-wrap gap-2";

      if (contacts.length === 0) {
        resultEl.innerHTML = "<span class='text-warning'>No contacts found</span>";
        return;
      }

      resultEl.innerHTML = contacts
        .map(
          (c) => `<div class="border rounded p-2 mb-2 text-start" data-contact
                       data-id="${escapeHtml(String(c.id))}"
                       data-first="${escapeHtml(c.firstName)}"
                       data-last="${escapeHtml(c.lastName)}"
                       data-email="${escapeHtml(c.email)}"
                       data-phone="${escapeHtml(c.phoneNumber)}">
                      <strong>${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</strong>
                      (ID: ${escapeHtml(String(c.id))})<br>
                      ${escapeHtml(c.email)} · ${escapeHtml(c.phoneNumber)}
                      <div class="mt-2 d-flex gap-2">
                        <button type="button" class="btn btn-sm btn-outline-success"
                                onclick="editContact(this);" title="Edit Contact">
                          <i class="bi bi-pencil-square me-1"></i> Edit
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger"
                                onclick="deleteContact(this);" title="Delete Contact">
                          <i class="bi bi-trash3-fill me-1"></i> Delete
                        </button>
                      </div>
                    </div>`
        )
        .join("");
    } else {
      showApiError(this, resultEl, "Error searching contacts");
    }
  };

  xhr.send();
}

// Loads a search result into the edit form. Replaces the old
// "pick a field from a dropdown, type the value, then click the right
// contact" flow, which gave no hint about which row applied to.
function editContact(el) {
  let c = rowData(el, "[data-contact]");
  if (!c) return;

  document.getElementById("editContactId").value = c.id;
  document.getElementById("editFirstName").value = c.first;
  document.getElementById("editLastName").value = c.last;
  document.getElementById("editPhone").value = c.phone;
  document.getElementById("editEmail").value = c.email;
  document.getElementById("saveContactButton").disabled = false;

  let resultEl = document.getElementById("contactUpdateResult");
  resultEl.className = "small fw-semibold";
  resultEl.innerHTML =
    "<i class='bi bi-pencil-square me-1'></i> Editing contact " + escapeHtml(c.id);
}

function resetEditForm() {
  clearFields(
    "editContactId",
    "editFirstName",
    "editLastName",
    "editPhone",
    "editEmail"
  );
  document.getElementById("saveContactButton").disabled = true;
}

function updateContact() {
  let id = field("editContactId");
  let first = field("editFirstName");
  let last = field("editLastName");
  let phone = field("editPhone");
  let email = field("editEmail");
  let resultEl = document.getElementById("contactUpdateResult");
  resultEl.innerHTML = "";

  if (!id) {
    setMessage(
      resultEl,
      "<i class='bi bi-exclamation-triangle-fill me-1'></i> Choose a contact to edit first",
      false
    );
    return;
  }

  if (!first || !last || !phone || !email) {
    setMessage(
      resultEl,
      "<i class='bi bi-exclamation-triangle-fill me-1'></i> All fields are required",
      false
    );
    return;
  }

  let xhr = new XMLHttpRequest();
  xhr.open("PUT", urlBase + "?id=" + encodeURIComponent(id), true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 200 || this.status === 201) {
      setMessage(
        resultEl,
        "<i class='bi bi-check-circle-fill me-1'></i> Contact successfully updated",
        true
      );
      resetEditForm();
      searchContacts();
    } else {
      showApiError(this, resultEl, "Failed to update contact");
    }
  };

  xhr.send(
    JSON.stringify({
      firstName: first,
      lastName: last,
      email: email,
      phoneNumber: phone,
    })
  );
}

function deleteContact(el) {
  let c = rowData(el, "[data-contact]");
  if (!c) return;

  if (!confirm("Delete contact " + c.first + " " + c.last + "?")) return;

  let resultEl = document.getElementById("contactDeleteResult");
  resultEl.innerHTML = "";

  let xhr = new XMLHttpRequest();
  xhr.open("DELETE", urlBase + "?id=" + encodeURIComponent(c.id), true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 200) {
      setMessage(
        resultEl,
        "<i class='bi bi-check-circle-fill me-1'></i> Contact successfully deleted",
        true
      );
      searchContacts();
    } else {
      showApiError(this, resultEl, "Failed to delete contact");
    }
  };

  xhr.send();
}

// ============================================================
//  Admin
//
//  All admin actions are gated server-side by routes/admin.php, which
//  re-checks Admin = 1 AND Enabled = 1 on every request.
// ============================================================

function checkAdminAccess() {
  let resultEl = document.getElementById("adminAccessResult");
  if (!resultEl) return;

  let xhr = new XMLHttpRequest();
  xhr.open("GET", urlBase + "?action=admin&operation=userSearch&q=", true);

  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 200) {
      document.getElementById("adminConsole").classList.remove("d-none");
      return;
    }

    // Console stays hidden; explain why instead.
    showApiError(this, resultEl, "Admin access required");
  };

  xhr.send();
}

function searchUsers() {
  let search = field("searchUsersText");
  let resultEl = document.getElementById("userList");
  resultEl.innerHTML = "";

  let url =
    urlBase +
    "?action=admin&operation=userSearch&q=" +
    encodeURIComponent(search);

  let xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status !== 200) {
      showApiError(this, resultEl, "Error searching users");
      return;
    }

    let users = JSON.parse(this.responseText).users || [];
    resultEl.className = "mt-2 d-flex flex-wrap gap-2";

    if (users.length === 0) {
      resultEl.innerHTML =
        "<div class='small italic py-2'><i class='bi bi-info-circle me-1'></i> No matching users found.</div>";
      return;
    }

    resultEl.innerHTML = users
      .map(
        (u) => `<span class="badge bg-body-tertiary text-body border border-success px-3 py-2 fs-6 d-inline-flex align-items-center gap-2"
                      data-user data-id="${escapeHtml(String(u.id))}"
                      data-enabled="${escapeHtml(String(u.enabled))}">
                  <span>${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</span>
                  <span>${escapeHtml(u.login)}</span>
                  <span>${u.admin == 1 ? "Admin" : "User"}</span>
                  <span>${u.enabled == 1 ? "Enabled" : "Disabled"}</span>

                  <button type="button" class="btn btn-sm btn-outline-success"
                          onclick="updatePassword(this);" title="Change Password">
                    <i class="bi bi-key"></i>
                  </button>

                  <button type="button" class="btn btn-sm btn-outline-success"
                          onclick="adminSearchContacts(this);" title="View Entries">
                    <i class="bi bi-search"></i>
                  </button>

                  <button type="button" class="btn btn-sm btn-outline-warning"
                          onclick="toggleEnable(this);" title="Enable or disable">
                    <i class="bi bi-person-fill-lock"></i>
                  </button>
                </span>`
      )
      .join("");
  };

  xhr.send();
}

function toggleEnable(el) {
  let u = rowData(el, "[data-user]");
  if (!u) return;

  let next = u.enabled == "1" ? 0 : 1;
  let resultEl = document.getElementById("userToggleResult");
  resultEl.innerHTML = "";

  let xhr = new XMLHttpRequest();
  xhr.open(
    "PUT",
    urlBase + "?action=admin&operation=toggle&id=" + encodeURIComponent(u.id),
    true
  );
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 200) {
      setMessage(
        resultEl,
        "<i class='bi bi-check-circle-fill me-1'></i> User is now " +
          (next === 1 ? "enabled" : "disabled"),
        true
      );
      searchUsers();
    } else {
      showApiError(this, resultEl, "Failed to update user");
    }
  };

  xhr.send(JSON.stringify({ enabled: next }));
}

function updatePassword(el) {
  let u = rowData(el, "[data-user]");
  if (!u) return;

  let password = field("newPW");
  let resultEl = document.getElementById("passwordUpdateResult");
  resultEl.innerHTML = "";

  if (!password) {
    setMessage(
      resultEl,
      "<i class='bi bi-exclamation-triangle-fill me-1'></i> Enter a new password first",
      false
    );
    return;
  }

  let xhr = new XMLHttpRequest();
  xhr.open(
    "PUT",
    urlBase +
      "?action=admin&operation=passwordUpdate&id=" +
      encodeURIComponent(u.id),
    true
  );
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 200 || this.status === 201) {
      setMessage(
        resultEl,
        "<i class='bi bi-check-circle-fill me-1'></i> Password successfully updated",
        true
      );
      clearFields("newPW");
    } else {
      showApiError(this, resultEl, "Failed to update password");
    }
  };

  xhr.send(JSON.stringify({ password: password }));
}

function adminSearchContacts(el) {
  let u = rowData(el, "[data-user]");
  if (!u) return;

  let search = field("adminContactsSearch");
  let resultEl = document.getElementById("contactSearchResultAdmin");
  resultEl.innerHTML = "";

  let url =
    urlBase +
    "?action=admin&operation=contactList&id=" +
    encodeURIComponent(u.id) +
    "&q=" +
    encodeURIComponent(search);

  let xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status !== 200) {
      showApiError(this, resultEl, "Error loading contacts");
      return;
    }

    let contacts = JSON.parse(this.responseText).contacts || [];
    resultEl.className = "mt-2 d-flex flex-wrap gap-2";

    if (contacts.length === 0) {
      resultEl.innerHTML =
        "<span class='text-warning'>No matching contacts found</span>";
      return;
    }

    resultEl.innerHTML = contacts
      .map(
        (c) => `<div class="border rounded p-2 mb-2 text-start">
                  <strong>${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</strong>
                  (ID: ${escapeHtml(String(c.id))})<br>
                  ${escapeHtml(c.email)} · ${escapeHtml(c.phoneNumber)}
                </div>`
      )
      .join("");
  };

  xhr.send();
}

function addUser() {
  let login = field("userUserName");
  let password = field("userPW");
  let first = field("userFirstName");
  let last = field("userLastName");
  let admin = field("adminStatus");
  let enabled = field("enabledStatus");
  let resultEl = document.getElementById("userAddResult");
  resultEl.innerHTML = "";

  if (!login || !password || !first || !last || !admin || !enabled) {
    setMessage(
      resultEl,
      "<i class='bi bi-exclamation-triangle-fill me-1'></i> Please enter all required information",
      false
    );
    return;
  }

  let xhr = new XMLHttpRequest();
  xhr.open("POST", urlBase + "?action=admin", true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 201 || this.status === 200) {
      setMessage(
        resultEl,
        "<i class='bi bi-check-circle-fill me-1'></i> New user successfully created",
        true
      );
      clearFields(
        "userUserName",
        "userPW",
        "userFirstName",
        "userLastName"
      );
    } else {
      showApiError(this, resultEl, "Failed to create user");
    }
  };

  xhr.send(
    JSON.stringify({
      login: login,
      password: password,
      firstName: first,
      lastName: last,
      admin: Number(admin),
      enabled: Number(enabled),
    })
  );
}
