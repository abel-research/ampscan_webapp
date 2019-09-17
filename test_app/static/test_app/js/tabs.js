
function setupTabs() {
    currentTab = "Home";
    document.getElementById("defaultTabOpen").click();
}

function getCurrentTab() {
    return currentTab;
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    // Each time a new tab is opened hide the overflow menus
    hideOverflowMenus();

    // If the old tab was "Align" then reveal all objects again
    if ((getCurrentTab() === "Align" && tabName !== "Align") || (getCurrentTab() === "Register" && tabName !== "Register")) {
        revealAllObjectsDisplayed();
        // Show obj manager
        document.getElementById("obj-manager").style.display = "block";
        showMain();
    }

    currentTab = tabName;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.className += " active";

    // If new tab is "Align" then only show aligning objects
    if (getCurrentTab() === "Align") {
        showAlignViews();
        updateAlign();
        // Hide obj manager
        document.getElementById("obj-manager").style.display = "none";
    }
    if (getCurrentTab() === "Register") {
        updateRegistration();
        // Hide obj manager
        document.getElementById("obj-manager").style.display = "none";
    } else {
        // If the new tab is not on registration
        document.getElementById("scalarBarContainer").style.display = "none";
    }
}
