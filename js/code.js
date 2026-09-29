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
let isAdmin = false;

function doLogin() {
  firstName = "";
  lastName = "";
  isAdmin = false;

  let loginInput = document.getElementById("loginName");
  let passwordInput = document.getElementById("loginPassword");
  let login = loginInput ? loginInput.value.trim() : "";
  let password = passwordInput ? passwordInput.value.trim() : "";

  document.getElementById("loginResult").innerHTML = "";

  let jsonPayload = JSON.stringify({ login: login, password: password });
  let url = loginUrlBase + "?action=login";

  let xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  try {
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 200) {
          let jsonObject = JSON.parse(xhr.responseText);
          firstName = jsonObject.firstName;
          lastName = jsonObject.lastName;
          isAdmin = jsonObject.admin === 1;

          saveCookie();
          window.location.href = "ContactManager.html";
        } else {
          document.getElementById("loginResult").innerHTML =
            "<i class='bi bi-exclamation-circle-fill me-1'></i> Login failed";
        }
      }
    };
    xhr.send(jsonPayload);
  } catch (err) {
    document.getElementById("loginResult").innerHTML = err.message;
  }
}

// Display name and role only. The session cookie is HttpOnly and is the sole
// credential; admin.php re-checks the role server-side on every request.
function saveCookie() {
  let minutes = 20;
  let date = new Date();
  date.setTime(date.getTime() + minutes * 60 * 1000);
  document.cookie =
    "firstName=" +
    encodeURIComponent(firstName) +
    ",lastName=" +
    encodeURIComponent(lastName) +
    ",admin=" +
    (isAdmin ? "1" : "0") +
    ";expires=" +
    date.toGMTString() +
    ";path=/";
}

function readCookie() {
  let data = document.cookie;
  let splits = data.split(";");
  for (var i = 0; i < splits.length; i++) {
    let pair = splits[i].trim();
    let tokens = pair.split(",");
    for (var j = 0; j < tokens.length; j++) {
      let keyVal = tokens[j].trim().split("=");
      if (keyVal[0] === "firstName") {
        firstName = decodeURIComponent(keyVal[1] || "");
      } else if (keyVal[0] === "lastName") {
        lastName = decodeURIComponent(keyVal[1] || "");
      } else if (keyVal[0] === "admin") {
        isAdmin = keyVal[1] === "1";
      }
    }
  }

  if (!firstName) {
    window.location.href = "SignIn.html";
  } else {
    let userNameEl = document.getElementById("userName");
    if (userNameEl) {
      userNameEl.innerHTML = `<i class="bi bi-person-circle me-1 text-primary"></i> <span>Logged in as <strong class="text-white"></strong></span>`;
      userNameEl.querySelector("strong").textContent = firstName + " " + lastName;
    }

    let adminLink = document.getElementById("adminLink");
    if (adminLink) {
      adminLink.classList.toggle("d-none", !isAdmin);
    }
  }
}

function doLogout() {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", urlBase + "?action=logout", true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.onload = function () {
    firstName = "";
    lastName = "";
    isAdmin = false;
    document.cookie = "firstName=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie = "lastName=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie = "admin=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    window.location.href = "index.html";
  };
  xhr.send();
}

function addAccount() {
  let newLoginInput = document.getElementById("newLogin");
  let newLogin = newLoginInput ? newLoginInput.value.trim() : "";

  let newPasswordInput = document.getElementById("newPassword");
  let newPassword = newPasswordInput ? newPasswordInput.value.trim() : "";

  let newFirstNameInput = document.getElementById("newFirstName");
  let newFirstName = newFirstNameInput ? newFirstNameInput.value.trim() : "";

  let newLastNameInput = document.getElementById("newLastName");
  let newLastName = newLastNameInput ? newLastNameInput.value.trim() : "";

  let resultEl = document.getElementById("signUpResult");
  resultEl.innerHTML = "";

  if (!newLogin || !newPassword || !newFirstName || !newLastName) {
    resultEl.className = "text-warning small fw-semibold";
    resultEl.innerHTML =
      "<i class='bi bi-exclamation-triangle-fill me-1'></i> Please enter all required information";
    return;
  }

  let jsonPayload = JSON.stringify({
    firstName: newFirstName,
    lastName: newLastName,
    login: newLogin,
    password: newPassword,
  });
  let url = urlBase + "?action=register";

  let xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  try {
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 201 || this.status === 200) {
          resultEl.className = "text-success-wcag small fw-semibold";
          resultEl.innerHTML =
            "<i class='bi bi-check-circle-fill me-1'></i> New user successfully created";
          newLoginInput.value = "";
          newPasswordInput.value = "";
          newFirstNameInput.value = "";
          newLastNameInput.value = "";
          setTimeout(function () { window.location.href = "SignIn.html"; }, 1500);
          //searchColor();
        } else {
          try {
            let res = JSON.parse(xhr.responseText);
            resultEl.className = "text-danger-wcag small fw-semibold";
            resultEl.innerHTML = res.error || "Failed to create user";
          } catch (e) {
            resultEl.className = "text-danger-wcag small fw-semibold";
            resultEl.innerHTML = "Error adding user";
          }
        }
      }
    };
    xhr.send(jsonPayload);
  } catch (err) {
    resultEl.className = "text-danger-wcag small fw-semibold";
    resultEl.innerHTML = err.message;
  }
}

function addContact() {
  let newFirstNameInput = document.getElementById("firstName");
  let newFirstName = newFirstNameInput ? newFirstNameInput.value.trim() : "";

  let newLastNameInput = document.getElementById("lastName");
  let newLastName = newLastNameInput ? newLastNameInput.value.trim() : "";

  let newEmailInput = document.getElementById("emailAdd");
  let newEmail = newEmailInput ? newEmailInput.value.trim() : "";

  let newPhoneInput = document.getElementById("phoneNum");
  let newPhone = newPhoneInput ? newPhoneInput.value.trim() : "";

  let resultEl = document.getElementById("contactAddResult");
  resultEl.innerHTML = "";

  if (!newEmail || !newPhone || !newFirstName || !newLastName) {
    resultEl.className = "text-warning small fw-semibold";
    resultEl.innerHTML =
      "<i class='bi bi-exclamation-triangle-fill me-1'></i> Please enter all required information";
    return;
  }

  let jsonPayload = JSON.stringify({
    firstName: newFirstName,
    lastName: newLastName,
    email: newEmail,
    phoneNumber: newPhone,
  });
  let url = urlBase;

  let xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  try {
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 201 || this.status === 200) {
          resultEl.className = "text-success-wcag small fw-semibold";
          resultEl.innerHTML =
            "<i class='bi bi-check-circle-fill me-1'></i> New contact successfully created";
          newEmailInput.value = "";
          newPhoneInput.value = "";
          newFirstNameInput.value = "";
          newLastNameInput.value = "";
        } else {
          try {
            let res = JSON.parse(xhr.responseText);
            resultEl.className = "text-danger-wcag small fw-semibold";
            resultEl.innerHTML = res.error || "Failed to create contact";
          } catch (e) {
            resultEl.className = "text-danger-wcag small fw-semibold";
            resultEl.innerHTML = "Error adding contact";
          }
        }
      }
    };
    xhr.send(jsonPayload);
  } catch (err) {
    resultEl.className = "text-danger-wcag small fw-semibold";
    resultEl.innerHTML = err.message;
  }
}

function updateContact() {
  let newContactIDInput = document.getElementById("contactID");
  let newContactID = newContactIDInput ? newContactIDInput.value.trim() : "";

  let newFirstNameInput = document.getElementById("firstNameUpdate");
  let newFirstName = newFirstNameInput ? newFirstNameInput.value.trim() : "";

  let newLastNameInput = document.getElementById("lastNameUpdate");
  let newLastName = newLastNameInput ? newLastNameInput.value.trim() : "";

  let newEmailInput = document.getElementById("emailAddUpdate");
  let newEmail = newEmailInput ? newEmailInput.value.trim() : "";

  let newPhoneInput = document.getElementById("phoneNumUpdate");
  let newPhone = newPhoneInput ? newPhoneInput.value.trim() : "";

  let resultEl = document.getElementById("contactUpdateResult");
  resultEl.innerHTML = "";

  if (
    !newContactID ||
    !newEmail ||
    !newPhone ||
    !newFirstName ||
    !newLastName
  ) {
    resultEl.className = "text-warning small fw-semibold";
    resultEl.innerHTML =
      "<i class='bi bi-exclamation-triangle-fill me-1'></i> Please enter all required information";

    return;
  }

  let jsonPayload = JSON.stringify({
    firstName: newFirstName,
    lastName: newLastName,
    email: newEmail,
    phoneNumber: newPhone,
  });
  let url = urlBase + "?id=" + newContactID;

  let xhr = new XMLHttpRequest();
  xhr.open("PUT", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  try {
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 201 || this.status === 200) {
          resultEl.className = "text-success-wcag small fw-semibold";
          resultEl.innerHTML =
            "<i class='bi bi-check-circle-fill me-1'></i> Contact successfully updated";
          newEmailInput.value = "";
          newPhoneInput.value = "";
          newFirstNameInput.value = "";
          newLastNameInput.value = "";
          newContactID = "";
        } else {
          try {
            let res = JSON.parse(xhr.responseText);
            resultEl.className = "text-danger-wcag small fw-semibold";
            resultEl.innerHTML = res.error || "Failed to update contact";
          } catch (e) {
            resultEl.className = "text-danger-wcag small fw-semibold";
            resultEl.innerHTML = "Error updating contact";
          }
        }
      }
    };
    xhr.send(jsonPayload);
  } catch (err) {
    resultEl.className = "text-danger-wcag small fw-semibold";
    resultEl.innerHTML = "Error encountered here in catch block" + err.message;
  }
}

function deleteContact() {
  let deleteContactIDInput = document.getElementById("contactIdDelete");
  let deleteContactID = deleteContactIDInput
    ? deleteContactIDInput.value.trim()
    : "";

  let resultEl = document.getElementById("contactDeleteResult");
  resultEl.innerHTML = "";

  if (!deleteContactID) {
    resultEl.className = "text-warning small fw-semibold";
    resultEl.innerHTML =
      "<i class='bi bi-exclamation-triangle-fill me-1'></i> Please enter an ID to remove by";

    return;
  }

  let url = urlBase + "?id=" + deleteContactID;

  let xhr = new XMLHttpRequest();
  xhr.open("DELETE", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  try {
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 201 || this.status === 200) {
          resultEl.className = "text-success-wcag small fw-semibold";
          resultEl.innerHTML =
            "<i class='bi bi-check-circle-fill me-1'></i> Contact successfully deleted";
          deleteContactID = "";
        } else {
          try {
            let res = JSON.parse(xhr.responseText);
            resultEl.className = "text-danger-wcag small fw-semibold";
            resultEl.innerHTML = res.error || "Failed to delete contact";
          } catch (e) {
            resultEl.className = "text-danger-wcag small fw-semibold";
            resultEl.innerHTML = "Error deleting contact";
          }
        }
      }
    };
    xhr.send();
  } catch (err) {
    resultEl.className = "text-danger-wcag small fw-semibold";
    resultEl.innerHTML = err.message;
  }
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

function searchContacts() {
  let searchValueInput = document.getElementById("searchValue");
  let search = searchValueInput ? searchValueInput.value.trim() : "";

  let resultEl = document.getElementById("contactSearchResult");
  resultEl.innerHTML = "";

  let url = urlBase + "?q=" + encodeURIComponent(search);

  let xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  try {
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 200) {
          let contacts = JSON.parse(xhr.responseText).contacts || [];
          resultEl.className = "small fw-semibold";
          resultEl.innerHTML =
            contacts.length === 0
              ? "<span class='text-warning'>No contacts found</span>"
              : contacts
                  .map(
                    (c) =>
                      `<div class="border rounded p-2 mb-2 text-start">
                                <strong>${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</strong> (ID: ${escapeHtml(String(c.id))})<br>
                                ${escapeHtml(c.email)} · ${escapeHtml(c.phoneNumber)}
                            </div>`,
                  )
                  .join("");
        } else {
          resultEl.className = "text-danger-wcag small fw-semibold";
          resultEl.innerHTML = "Error searching contacts";
        }
      }
    };
    xhr.send();
  } catch (err) {
    resultEl.className = "text-danger-wcag small fw-semibold";
    resultEl.innerHTML = err.message;
  }
}

// ============================================================
//  Admin operations — all gated server-side by routes/admin.php
// ============================================================

// Shared XHR helper for the admin page. Every value that reaches the DOM goes
// through escapeHtml(); the API returns user-supplied names, so rendering them
// raw would be a stored XSS.
function adminRequest(method, url, payload, resultEl, onSuccess) {
  resultEl.innerHTML = "";

  let xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  try {
    xhr.onreadystatechange = function () {
      if (this.readyState !== 4) return;

      let res = {};
      try {
        res = JSON.parse(xhr.responseText);
      } catch (e) {}

      if (this.status === 200) {
        onSuccess(res);
        return;
      }

      // The server refused the request outright — not an admin, or a bad ID.
      if (this.status === 401) {
        window.location.href = "SignIn.html";
        return;
      }
      if (this.status === 403) {
        resultEl.className = "text-danger-wcag small fw-semibold";
        resultEl.innerHTML = "Admin access required.";
        return;
      }

      resultEl.className = "text-danger-wcag small fw-semibold";
      resultEl.innerHTML = escapeHtml(res.error || "Request failed (" + this.status + ")");
    };
    xhr.send(payload === undefined ? null : JSON.stringify(payload));
  } catch (err) {
    resultEl.className = "text-danger-wcag small fw-semibold";
    resultEl.innerHTML = escapeHtml(err.message);
  }
}

function adminId(fieldId) {
  let el = document.getElementById(fieldId);
  let id = el ? el.value.trim() : "";
  if (!id) return null;
  return id;
}

// Confirms admin rights on page load. The server is the authority; the cookie
// only decides whether the nav link is shown.
function checkAdminAccess() {
  let resultEl = document.getElementById("adminAccessResult");
  if (!resultEl) return;

  adminRequest("GET", urlBase + "?action=admin&operation=userSearch&q=", undefined, resultEl, function () {
    document.getElementById("adminConsole")?.classList.remove("d-none");
  });
}

function searchUsers() {
  let searchEl = document.getElementById("searchUsersValue");
  let search = searchEl ? searchEl.value.trim() : "";
  let resultEl = document.getElementById("userSearchResult");
  let url = urlBase + "?action=admin&operation=userSearch&q=" + encodeURIComponent(search);

  adminRequest("GET", url, undefined, resultEl, function (res) {
    let users = Array.isArray(res.users) ? res.users : [];

    if (users.length === 0) {
      resultEl.className = "small fw-semibold";
      resultEl.innerHTML = "<span class='text-warning'>No users found</span>";
      return;
    }

    let rows = users
      .map(
        (u) => `<tr>
          <td>${escapeHtml(String(u.id))}</td>
          <td>${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</td>
          <td>${escapeHtml(u.login)}</td>
          <td>${u.admin ? "Admin" : "User"}</td>
          <td>${u.enabled ? "Enabled" : "Disabled"}</td>
        </tr>`
      )
      .join("");

    resultEl.innerHTML = `<div class="table-responsive">
      <table class="table table-sm table-dark table-striped align-middle mb-0">
        <thead><tr><th>ID</th><th>Name</th><th>Login</th><th>Role</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  });
}

function viewUserContacts() {
  let id = adminId("viewUserId");
  let searchEl = document.getElementById("viewContactsSearch");
  let search = searchEl ? searchEl.value.trim() : "";
  let resultEl = document.getElementById("userContactsResult");
  if (!id) {
    resultEl.className = "text-warning small fw-semibold";
    resultEl.innerHTML = "Please enter a user ID";
    return;
  }

  let url =
    urlBase +
    "?action=admin&operation=contactList&id=" +
    encodeURIComponent(id) +
    "&q=" +
    encodeURIComponent(search);

  adminRequest("GET", url, undefined, resultEl, function (res) {
    let contacts = Array.isArray(res.contacts) ? res.contacts : [];

    if (contacts.length === 0) {
      resultEl.className = "small fw-semibold";
      resultEl.innerHTML = "<span class='text-warning'>This user has no contacts</span>";
      return;
    }

    let rows = contacts
      .map(
        (c) => `<tr>
          <td>${escapeHtml(String(c.id))}</td>
          <td>${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</td>
          <td>${escapeHtml(c.email)}</td>
          <td>${escapeHtml(c.phoneNumber)}</td>
        </tr>`
      )
      .join("");

    resultEl.innerHTML = `<div class="table-responsive">
      <table class="table table-sm table-dark table-striped align-middle mb-0">
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  });
}

function toggleUserEnabled() {
  let id = adminId("toggleUserId");
  let enabledEl = document.getElementById("toggleUserEnabled");
  let enabled = enabledEl ? enabledEl.value : "";
  let resultEl = document.getElementById("userToggleResult");

  if (!id) {
    resultEl.className = "text-warning small fw-semibold";
    resultEl.innerHTML = "Please enter a user ID";
    return;
  }
  if (enabled !== "0" && enabled !== "1") {
    resultEl.className = "text-warning small fw-semibold";
    resultEl.innerHTML = "Please choose a status";
    return;
  }

  let url = urlBase + "?action=admin&operation=toggle&id=" + encodeURIComponent(id);

  adminRequest("PUT", url, { enabled: Number(enabled) }, resultEl, function (res) {
    resultEl.className = "text-success-wcag small fw-semibold";
    resultEl.innerHTML = escapeHtml(res.message || "Updated");
  });
}

function changeUserPassword() {
  let id = adminId("passwordUserId");
  let passEl = document.getElementById("newUserPassword");
  let password = passEl ? passEl.value.trim() : "";
  let resultEl = document.getElementById("userPasswordResult");

  if (!id) {
    resultEl.className = "text-warning small fw-semibold";
    resultEl.innerHTML = "Please enter a user ID";
    return;
  }
  if (!password) {
    resultEl.className = "text-warning small fw-semibold";
    resultEl.innerHTML = "Please enter a new password";
    return;
  }

  let url = urlBase + "?action=admin&operation=passwordUpdate&id=" + encodeURIComponent(id);

  adminRequest("PUT", url, { password: password }, resultEl, function (res) {
    resultEl.className = "text-success-wcag small fw-semibold";
    resultEl.innerHTML = escapeHtml(res.message || "Password updated");
    if (passEl) passEl.value = "";
  });
}

function createAdminUser() {
  let loginEl = document.getElementById("newUserLogin");
  let passEl = document.getElementById("newUserAccountPassword");
  let firstEl = document.getElementById("newUserFirstName");
  let lastEl = document.getElementById("newUserLastName");
  let adminEl = document.getElementById("newUserIsAdmin");
  let enabledEl = document.getElementById("newUserIsEnabled");
  let resultEl = document.getElementById("createUserResult");

  let login = loginEl ? loginEl.value.trim() : "";
  let password = passEl ? passEl.value.trim() : "";
  let first = firstEl ? firstEl.value.trim() : "";
  let last = lastEl ? lastEl.value.trim() : "";

  if (!login || !password || !first || !last) {
    resultEl.className = "text-warning small fw-semibold";
    resultEl.innerHTML = "Please enter all required information";
    return;
  }

  adminRequest(
    "POST",
    urlBase + "?action=admin",
    {
      login: login,
      password: password,
      firstName: first,
      lastName: last,
      admin: adminEl && adminEl.checked ? 1 : 0,
      enabled: enabledEl && enabledEl.checked ? 1 : 0,
    },
    resultEl,
    function (res) {
      resultEl.className = "text-success-wcag small fw-semibold";
      resultEl.innerHTML = escapeHtml(res.message || "User created");
      [loginEl, passEl, firstEl, lastEl].forEach(function (el) {
        if (el) el.value = "";
      });
    }
  );
}
