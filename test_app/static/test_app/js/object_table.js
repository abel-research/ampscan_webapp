
// ----------------------------------------------------------------------------
// Setup object panel
// ----------------------------------------------------------------------------

function hideOverflowMenus() {
    const menus = document.getElementsByClassName("overflowMenu");
    for (m in menus) {
        if (menus[m].style !== undefined)
            menus[m].style.display = "none";
    }
}

function addWrapperListener() {
    document.getElementById("wrapper").addEventListener("click", function () {
        hideOverflowMenus();
    });
}

function updateObjectTable() {
    var lastClicked = null;
    const objectTable = document.getElementById("objTable");

    // Clear table
    for(var i = objectTable.rows.length - 1; i > 0; i--) {
        objectTable.deleteRow(i);
    }


    // Create overflow menu
    const overflowMenu = document.createElement("div");

    overflowMenu.setAttribute("class", "overflowMenu");
    const saveButton = document.createElement("BUTTON");
    saveButton.innerHTML = "Save";

    const removeButton = document.createElement("BUTTON");
    removeButton.innerHTML = "Remove";
    removeButton.addEventListener("click", function() {
        removeObject(selectedObjID);
    })

    // Make save button call save on object
    var selectedObjID = null;
    saveButton.addEventListener("click", function() {
        saveObject(selectedObjID)
    });

    overflowMenu.appendChild(saveButton);
    overflowMenu.appendChild(removeButton);

    document.getElementById("obj-manager").appendChild(overflowMenu);


    // Create table from data received
    for (objID in objects){
        if (objID !== "_regObject") {
            var row = objectTable.insertRow(-1);

            row.setAttribute("class", "objectTableRow");

            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);

            // Add checkbox to display cell
            var showCheckbox = document.createElement("INPUT"); //Added for checkbox
            showCheckbox.type = "checkbox"; //Added for checkbox
            showCheckbox.checked = objects[objID].display;
            showCheckbox.id = objID.concat(" dropdown");

            // This is how the event to change visibility is added
            objects[objID].addDisplayCheckbox(showCheckbox);

            // Add overflow button to end of row
            const overflowButton = document.createElement("BUTTON");
            const overflowContainer = document.createElement("div");
            overflowContainer.appendChild(overflowButton);
            overflowContainer.setAttribute("class", "overflowContainer");

            overflowButton.setAttribute("class", "objectOverflowButton");
            overflowButton.setAttribute("id", "objectOverflowButton".concat(objID));
            // overflowButton.innerHTML = "..."
            overflowButton.addEventListener("click", function (event) {

                // Remove objectOverflowButton tag from from
                selectedObjID = event.target.id.substring(20);

                // Create overflow menu
                // const overflowMenu = document.getElementById("overflowMenu");

                // Logic to set location and visibility of overflow menu
                if (lastClicked == null) {
                    overflowMenu.style.display = "block";
                    lastClicked = event.target.parentElement.id;
                    event.target.parentElement.parentElement.appendChild(overflowMenu);
                } else if (lastClicked === event.target.id) {
                    if (overflowMenu.style.display === "block")
                        overflowMenu.style.display = "none";
                    else
                        overflowMenu.style.display = "block";
                } else {
                    overflowMenu.style.display = "block";
                    lastClicked = event.target.id;
                    event.target.parentElement.parentElement.appendChild(overflowMenu);
                }
                // Stops overflow from being hidden by click elsewhere on screen
                event.stopPropagation();
            });

            cell1.setAttribute("class", "objectTableCell");
            cell2.setAttribute("class", "objectTableCell");
            cell3.setAttribute("class", "objectTableCell");
            cell4.setAttribute("class", "overflowMenuCell");

            cell1.innerHTML = objects[objID].name;
            cell2.appendChild(showCheckbox);
            cell3.innerHTML = objects[objID].type;
            cell4.appendChild(overflowContainer);
        }
    }
}

/**
 * Returns true iff any reg objects are visible
 * @returns {boolean}
 */
function anyObjectsVisibleRegType() {
    for (const objID in objects) {
        if (objID !== "_regObject" && objects[objID].type === "reg" && objects[objID].getActorVisibility()) {
            console.log(objID);
            return true;
        }
    }
    return false;
}