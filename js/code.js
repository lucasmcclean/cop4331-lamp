const urlBase =
  typeof window !== "undefined" &&
  window.location &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.origin.includes("disc.quest"))
    ? "/api/index.php"
    : "https://disc.quest/api/index.php";

const loginUrlBase = urlBase;

let userId = 0;
let firstName = "";
let lastName = "";

function doLogin() {
  userId = 0;
  firstName = "";
  lastName = "";

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
          userId = jsonObject.id;

          if (userId < 1) {
            document.getElementById("loginResult").innerHTML =
              "<i class='bi bi-exclamation-circle-fill me-1'></i> User/Password combination incorrect";
            return;
          }

          firstName = jsonObject.firstName;
          lastName = jsonObject.lastName;

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
      } else if (keyVal[0] === "userId") {
        userId = parseInt(keyVal[1].trim());
      }
    }
  }

  if (userId < 0 || isNaN(userId)) {
    window.location.href = "FrontPage.html";
  } else {
    let userNameEl = document.getElementById("userName");
    if (userNameEl) {
      userNameEl.innerHTML = `<i class="bi bi-person-circle me-1 text-primary"></i> <span>Logged in as <strong class="text-white">${firstName} ${lastName}</strong></span>`;
    }
  }
}

function doLogout() {
  userId = 0;
  firstName = "";
  lastName = "";
  document.cookie = "firstName=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = "lastName=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  window.location.href = "index.html";
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
  xhr.setRequestHeader("Authorization", "Bearer " + userId);
  xhr.setRequestHeader("X-User-Id", userId);

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
  xhr.setRequestHeader("Authorization", "Bearer " + userId);
  xhr.setRequestHeader("X-User-Id", userId);

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
  xhr.setRequestHeader("Authorization", "Bearer " + userId);
  xhr.setRequestHeader("X-User-Id", userId);

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
  xhr.setRequestHeader("Authorization", "Bearer " + userId);
  xhr.setRequestHeader("X-User-Id", userId);

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
  xhr.setRequestHeader("Authorization", "Bearer " + userId);
  xhr.setRequestHeader("X-User-Id", userId);

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
