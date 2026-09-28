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
                            "<i class='bi bi-exclamation-circle-fill me-1' style='color: #2f6b3f;'></i> User/Password combination incorrect";
                        return;
                    }

                    firstName = jsonObject.firstName;
                    lastName = jsonObject.lastName;

                    saveCookie();

                    if (jsonObject.admin === 1) {
                        window.location.href = "AdminPage.html";
                    } else {
                        window.location.href = "ContactManager.html";
                    }
                } else {
                    document.getElementById("loginResult").innerHTML =
                        "<span style='color: #2f6b3f'> <i class='bi bi-exclamation-circle-fill me-1' style='color: #2f6b3f;'></i> Login failed </span>";
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
        window.location.href = "index.html";
    } else {
        let userNameEl = document.getElementById("userName");
        if (userNameEl) {
            userNameEl.innerHTML = `
<i class="bi bi-person-circle me-1" style="color: #2f6b3f;"></i>
<span style="color: #2f6b3f;">
    Logged in as <strong style="color: #2f6b3f;"></strong>
</span>
  `;

            userNameEl.style.backgroundColor = "#f8f1e3";
            userNameEl.style.padding = "8px 12px";
            userNameEl.style.borderRadius = "8px";

            userNameEl.querySelector("strong").textContent = firstName + " " + lastName;
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
    let srchInput = document.getElementById("searchText");
    let srch = srchInput ? srchInput.value.trim() : "";


    let url = urlBase + (srch ? ("?q=" + encodeURIComponent(srch)) : "");


    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + userId);
    xhr.setRequestHeader("X-User-Id", userId);

    try {
        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {

                let jsonObject = JSON.parse(xhr.responseText);
                let targetP = document.getElementById("contactList") || document.getElementsByTagName("p")[0];
                let contacts = Array.isArray(jsonObject.contacts) ? jsonObject.contacts : [];


                if (contacts.length === 0) {
                    if (targetP) targetP.innerHTML = `<div class="text-secondary-contrast small italic py-2"><i class="bi bi-info-circle me-1"></i> No matching contacts found.</div>`;
                    return;
                }

                let contactList = "";

                for (let i = 0; i < contacts.length; i++) {

                    let c = contacts[i];
                    let contactId = c.id;
                    let firstName = c.firstName;
                    let lastName = c.lastName;
                    let email = c.email;
                    let phoneNumber = c.phoneNumber;

                    contactList += `<span class="badge bg-cream text-success border border-success px-3 py-2 fs-6 shadow-sm d-inline-flex align-items-center me-2 mb-2" style="border-radius: 0;">
                    <span class="me-2">${firstName}</span>
                    <span class="me-2">${lastName}</span>
                    <span class="me-2">${email}</span>
                    <span class="me-2">${phoneNumber}</span>
                    <button type="button" class="btn" style="color: #2f6b3f;" onclick="deleteContact(${contactId});" title="Delete Contact"><i class="bi bi-trash3-fill"></i></button>
                    <button type="button" class="btn" style="color: #2f6b3f;" onclick='updateContact(
                ${JSON.stringify(contactId)},
                ${JSON.stringify(firstName)},
                ${JSON.stringify(lastName)},
                ${JSON.stringify(email)},
                ${JSON.stringify(phoneNumber)}
            );'
            title="Update Contact"><i class="bi bi-person-up"></i></button>
                    </span>`;




                }

                if (targetP) {
                    targetP.innerHTML = contactList;
                }
            }
        };
        xhr.send();
    } catch (err) {
        resultSpan.innerHTML = err.message;
    }
}




function deleteContact(identifier) {
    if (!identifier && identifier !== 0) return;

    let param = (typeof identifier === 'number') ? ("id=" + identifier) : ("name=" + encodeURIComponent(identifier));
    let url = urlBase + "?" + param;

    let xhr = new XMLHttpRequest();
    xhr.open("DELETE", url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + userId);
    xhr.setRequestHeader("X-User-Id", userId);

    try {
        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                searchContacts();
            }
        };
        xhr.send();
    } catch (err) {
        console.error(err);
    }
}




function updateContact(identifier, firstname, lastname, newEmail, newPhone) {


    let updateTrait = document.getElementById("updateTrait").value;
    let updateValue = document.getElementById("updateValue").value;


    let firstnameFinal = firstname;
    let lastnameFinal = lastname;
    let emailFinal = newEmail;
    let phoneFinal = newPhone;

    let resultEl = document.getElementById("contactUpdateResult");
    resultEl.innerHTML = "";


    if (updateTrait == "firstNameUpdate") {
        firstnameFinal = updateValue;
    }

    if (updateTrait == "lastNameUpdate") {
        lastnameFinal = updateValue;
    }

    if (updateTrait == "emailUpdate") {
        emailFinal = updateValue;
    }

    if (updateTrait == "phoneUpdate") {
        phoneFinal = updateValue;
    }


    let jsonPayload = JSON.stringify({
        firstName: firstnameFinal,
        lastName: lastnameFinal,
        email: emailFinal,
        phoneNumber: phoneFinal,
    });





    let url = urlBase + "?id=" + identifier;

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
                    document.getElementById("updateValue").value = "";
                    searchContacts();
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






function searchUsers() {
    let srchInput = document.getElementById("searchUsersText");
    let srch = srchInput ? srchInput.value.trim() : "";

    let url = urlBase + "?action=admin&operation=userSearch" +
        (srch ? ("&q=" + encodeURIComponent(srch)) : "");

    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + userId);
    xhr.setRequestHeader("X-User-Id", userId);

    try {
        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {

                let jsonObject = JSON.parse(xhr.responseText);
                let targetP = document.getElementById("userList") || document.getElementsByTagName("p")[0];
                let users = Array.isArray(jsonObject.users) ? jsonObject.users : [];

                if (users.length === 0) {
                    if (targetP) targetP.innerHTML = `<div class="text-secondary-contrast small italic py-2"><i class="bi bi-info-circle me-1"></i> No matching users found.</div>`;
                    return;
                }

                let userList = "";

                for (let i = 0; i < users.length; i++) {

                    let u = users[i];
                    let userId = u.id;
                    let firstName = u.firstName;
                    let lastName = u.lastName;
                    let login = u.login;
                    let admin = u.admin;
                    let enabled = u.enabled;

                    userList += `<span class="badge bg-cream text-success border border-success px-3 py-2 fs-6 shadow-sm d-inline-flex align-items-center me-2 mb-2" style="border-radius: 0;">
                    <span class="me-2">${firstName}</span>
                    <span class="me-2">${lastName}</span>
                    <span class="me-2">${login}</span>
                    <span class="me-2">Admin: ${admin}</span>
                    <span class="me-2">Enabled: ${enabled}</span>
                    </span>`;

                }

                if (targetP) {
                    targetP.innerHTML = userList;
                }
            }
        };
        xhr.send();
    } catch (err) {
        resultSpan.innerHTML = err.message;
    }
}