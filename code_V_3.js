/*
## AI Assistance Disclosure

This project was developed with assistance from generative AI tools:

- **Tool**: GPT-5.6 Luna  (OpenAI)
- **Dates**: September 15-30, 2026
- **Scope/Use**: Assistance with design of Green&Cream CSS theme, formatting DIV tags.
Used to help generate HTML dropdown menus, and to format HTML response creation in
JavaScript functions for User/Contact lists. 

All AI-generated code was reviewed, tested, and modified to meet 
assignment requirements. Final implementation reflects my understanding 
of the concepts.

*/


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




function addUser() {

    let newLoginInput = document.getElementById("userUserName");
    let newLogin = newLoginInput ? newLoginInput.value.trim() : "";

    let newPasswordInput = document.getElementById("userPW");
    let newPassword = newPasswordInput ? newPasswordInput.value.trim() : "";

    let newFirstNameInput = document.getElementById("userFirstName");
    let newFirstName = newFirstNameInput ? newFirstNameInput.value.trim() : "";

    let newLastNameInput = document.getElementById("userLastName");
    let newLastName = newLastNameInput ? newLastNameInput.value.trim() : "";

    let newAdminInput = document.getElementById("adminStatus");
    let newAdmin = newAdminInput ? newAdminInput.value : "";

    let newEnabledInput = document.getElementById("enabledStatus");
    let newEnabled = newEnabledInput ? newEnabledInput.value : "";

    let resultEl = document.getElementById("userAddResult");
    resultEl.innerHTML = "";




    if (!newLogin || !newPassword || !newFirstName || !newLastName ||
        newAdmin === "" || newEnabled === "") {

        resultEl.className = "text-warning small fw-semibold";
        resultEl.innerHTML =
            "<i class='bi bi-exclamation-triangle-fill me-1'></i> " +
            "Please enter all required information";
        return;
    }




    let jsonPayload = JSON.stringify({
        login: newLogin,
        password: newPassword,
        firstName: newFirstName,
        lastName: newLastName,
        admin: Number(newAdmin),
        enabled: Number(newEnabled)
    });



    let url = urlBase + "?action=admin";
    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    xhr.setRequestHeader(
        "Content-type",
        "application/json; charset=UTF-8"
    );


    try {
        xhr.onreadystatechange = function () {

            if (this.readyState === 4) {

                if (this.status === 201 || this.status === 200) {

                    resultEl.className =
                        "text-success-wcag small fw-semibold";

                    resultEl.innerHTML =
                        "<i class='bi bi-check-circle-fill me-1'></i> " +
                        "New user successfully created";

                    newLoginInput.value = "";
                    newPasswordInput.value = "";
                    newFirstNameInput.value = "";
                    newLastNameInput.value = "";
                    newAdminInput.value = "";
                    newEnabledInput.value = "";

                } else {

                    try {
                        let res = JSON.parse(xhr.responseText);

                        resultEl.className =
                            "text-danger-wcag small fw-semibold";

                        resultEl.innerHTML =
                            res.error || "Failed to create user";

                    } catch (e) {

                        resultEl.className =
                            "text-danger-wcag small fw-semibold";

                        resultEl.innerHTML =
                            "Error adding user";
                    }
                }
            }
        };

        xhr.send(jsonPayload);

    } catch (err) {

        resultEl.className =
            "text-danger-wcag small fw-semibold";

        resultEl.innerHTML = err.message;
    }
}



function toggleEnable(identifier, currentNum) {
    if (!identifier && identifier !== 0) return;

    let url = urlBase + "?action=admin&operation=toggle&id=" + identifier;



    let jsonPayload = JSON.stringify({ enabled: Number(currentNum) === 1 ? 0 : 1 });
    let xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");


    try {
        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                searchUsers();
            }
        };
        xhr.send(jsonPayload);
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
    xhr.setRequestHeader("Authorization", "Bearer " + identifier);
    xhr.setRequestHeader("X-User-Id", identifier);


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





function deleteContact(identifier) {
    if (!identifier && identifier !== 0) return;

    let url = urlBase + "?id=" + identifier;

    let xhr = new XMLHttpRequest();
    xhr.open("DELETE", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

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

                    //Generation of HTML response for search results used AI assistance, code was kept largely intact 
                    resultEl.innerHTML =
                        contacts.length === 0
                            ? "<span class='text-warning'>No contacts found</span>"
                            : contacts
                                .map(
                                    (c) =>
                                        `<div class="border rounded p-2 mb-2 text-start">
                                            <strong>${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</strong>
                                            (ID: ${escapeHtml(String(c.id))})<br>
                                            ${escapeHtml(c.email)} · ${escapeHtml(c.phoneNumber)}

                                            <div class="mt-2">
                                                <button
                                                    type="button"
                                                    class="btn"
                                                    style="color: #2f6b3f;"
                                                    onclick="deleteContact(${JSON.stringify(c.id)});"
                                                    title="Delete Contact">
                                                    <i class="bi bi-trash3-fill"></i>
                                                </button>

                                                <button
                                                    type="button"
                                                    class="btn"
                                                    style="color: #2f6b3f;"
                                                    onclick='updateContact(
                                                        ${JSON.stringify(c.id)},
                                                        ${JSON.stringify(c.firstName)},
                                                        ${JSON.stringify(c.lastName)},
                                                        ${JSON.stringify(c.email)},
                                                        ${JSON.stringify(c.phoneNumber)}
                                                    );'
                                                    title="Update Contact">
                                                    <i class="bi bi-person-up"></i>
                                                </button>
                                            </div>
                                        </div>`,
                                )
                                .join("");
                                ///////////////////////////////////////////////////////////////////////
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
                let targetP = document.getElementById("userList") ||
                    document.getElementsByTagName("p")[0];

                let users = Array.isArray(jsonObject.users)
                    ? jsonObject.users
                    : [];

                if (users.length === 0) {
                    if (targetP) {
                        targetP.innerHTML =
                            `<div class="text-secondary-contrast small italic py-2">
                                <i class="bi bi-info-circle me-1"></i>
                                No matching users found.
                            </div>`;
                    }
                    return;
                }

                let userList = "";

                for (let i = 0; i < users.length; i++) {

                    let u = users[i];

                    let userIdValue = u.id;
                    let firstName = u.firstName;
                    let lastName = u.lastName;
                    let login = u.login;
                    let admin = u.admin;
                    let enabled = u.enabled;

                    userList += `
                        <span class="badge bg-cream text-success border border-success px-3 py-2 fs-6 shadow-sm d-inline-flex align-items-center me-2 mb-2"
                              style="border-radius: 0;">

                            <span class="me-2">${firstName}</span>
                            <span class="me-2">${lastName}</span>
                            <span class="me-2">${login}</span>

                            <span class="me-2">
                                ${admin == 1 ? "Admin" : "User"}
                            </span>

                            <span class="me-2">
                                ${enabled == 1 ? "Enabled" : "Disabled"}
                            </span>

                            <button type="button"
                                    class="btn"
                                    style="color: #2f6b3f;"
                                    onclick="updatePassword(${JSON.stringify(userIdValue)});"
                                    title="Update Password">
                                <i class="bi bi-capslock-fill"></i>
                            </button>

                            <button type="button"
                             class="btn"
                             style="color: #2f6b3f;"
                             onclick="adminSearchContacts(${JSON.stringify(userIdValue)});"
                             title="Search Contacts">
                             <i class="bi bi-search"></i>
                             </button>

                            <button type="button"
                                    class="btn"
                                    style="color: #2f6b3f;"
                                    onclick="toggleEnable(${JSON.stringify(userIdValue)}, ${JSON.stringify(enabled)});"
                                    title="Enable/Disable">
                                <i class="bi bi-person-fill-lock"></i>
                            </button>

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



function updatePassword(identifier) {
    if (!identifier && identifier !== 0) return;

    let url = urlBase + "?action=admin&operation=passwordUpdate&id=" + identifier;


    let resultEl = document.getElementById("passwordUpdateResult");
    resultEl.innerHTML = "";

    let newUserPw = document.getElementById("newPW").value;

    let jsonPayload = JSON.stringify({ password: newUserPw });

    let xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

    try {
        xhr.onreadystatechange = function () {
            if (this.readyState === 4) {
                if (this.status === 201 || this.status === 200) {
                    resultEl.className = "text-success-wcag small fw-semibold";
                    resultEl.innerHTML =
                        "<i class='bi bi-check-circle-fill me-1'></i> Password successfully updated";
                    document.getElementById("newPW").value = "";
                    searchContacts();
                } else {
                    try {
                        let res = JSON.parse(xhr.responseText);
                        resultEl.className = "text-danger-wcag small fw-semibold";
                        resultEl.innerHTML = res.error || "Failed to update password";
                    } catch (e) {
                        resultEl.className = "text-danger-wcag small fw-semibold";
                        resultEl.innerHTML = "Error updating password";
                    }
                }
            }
        };
        xhr.send(jsonPayload);
    } catch (err) {
        console.error(err);
    }
}




function adminSearchContacts(identifier) {


    let resultEl = document.getElementById("contactSearchResultAdmin");
    resultEl.innerHTML = "";

    let url = urlBase + "?action=admin&operation=contactList&id=" + encodeURIComponent(identifier);



    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + userId);
    xhr.setRequestHeader("X-User-Id", userId);

    try {
        xhr.onreadystatechange = function () {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    let contacts = JSON.parse(xhr.responseText).contacts || [];

                    resultEl.className = "small fw-semibold";

                    //Generation of HTML response for search results used AI assistance, code was kept largely intact
                    resultEl.innerHTML =
                        contacts.length === 0
                            ? "<span class='text-warning'>No contacts found</span>"
                            : contacts
                                .map(
                                    (c) =>
                                        `<div class="border rounded p-2 mb-2 text-start">
                                            <strong>${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</strong>
                                            (ID: ${escapeHtml(String(c.id))})<br>
                                            ${escapeHtml(c.email)} · ${escapeHtml(c.phoneNumber)}


                                        </div>`,
                                )
                                .join("");
                                /////////////////////////////////////////////////////////////////////////////
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