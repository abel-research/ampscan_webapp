
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

    // If the old tab was "Align" then reveal all objects again and new tab is not the same
    if ((getCurrentTab() === "Align" || getCurrentTab() === "Register" || getCurrentTab() === "Analyse") &&
        tabName !== getCurrentTab()) {
        revealAllObjectsDisplayed();
        // Show obj manager
        document.getElementById("obj-manager").style.display = "block";
        document.getElementById("registrationGraphPanel").style.display = "none";
        document.getElementById("analyseGraphPanel").style.display = "none";

        showMainView();
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

    // Hide the registration controls
    document.getElementById("registrationControls").style.display = "none";

    // If new tab is "Align" then only show aligning objects
    if (getCurrentTab() === "Align") {
        showAlignViews();
        updateAlign();
        // Hide obj manager
        document.getElementById("obj-manager").style.display = "none";
    }

    // If the new tab is Register
    if (getCurrentTab() === "Register") {
        updateRegistration();
        // Hide obj manager
        document.getElementById("obj-manager").style.display = "none";
        // Bring in registration graph panel
        document.getElementById("registrationGraphPanel").style.display = "block";
    }

    // If the new tab is Analyse
    if (getCurrentTab() === "Analyse") {
        showAnalyseViews();
        updateAnalyse();
    }
    updateScalarVisiblity();
    updateDropdown();
}
