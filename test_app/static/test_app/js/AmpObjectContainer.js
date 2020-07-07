/**
 * Objects that go in the objects dictionary
 * Store the objects actors
 */
class AmpObjectContainer {
    constructor(name, display, type, colour=[1, 1, 1], opacity=1) {
        this.name = name;
        this.display = display;
        this.type = type;
        this.colour = colour;
        this.opacity = opacity;

        this.polydata = null;
        this.values = null;
        this.checkbox = null;
        this.actor = null;
        // Note actor is set during polyUpdate
    }

    setActorVisibility(display) {
        this.actor.setVisibility(display);
        this.display = display;
        if (this.checkbox != null)
            this.checkbox.checked = display;
        refreshVTK();
        updateScalarVisiblity();
    }

    getActorVisibility() {
        return this.actor.getVisibility();
    }

    resetVisibility() {
        this.setActorVisibility(this.display);
    }

    toggleDisplay() {
        let display = this.checkbox.checked;

        this.display = display;
        this.setActorVisibility(display);
    }

    addDisplayCheckbox(checkbox) {
        var ob = this;
        this.checkbox = checkbox;
        checkbox.addEventListener("change", function(){
            ob.toggleDisplay();
            if (getCurrentTab() === "Analyse") {
                updateAnalyse();
            }
            updateScalarVisiblity();
        });
    }

    setActor(actor) {
        this.actor = actor;
    }

    resetColour() {
        this.setActorColour(this.colour[0], this.colour[1], this.colour[2]);
    }

    setActorColour(r, g, b) {
        this.actor.getProperty().setColor(r, g, b);
        this.actor.getProperty().setEdgeColor(r, g, b);
        refreshVTK();
    }

    changeColourTemp(colour) {
        // colour come in as hex e.g. #ff92aa
        const r = parseInt(colour.substr(1, 2), 16) / 255;
        const g = parseInt(colour.substr(3, 2), 16) / 255;
        const b = parseInt(colour.substr(5, 2), 16) / 255;
        this.setActorColour(r, g, b)
    }

    resetOpacity() {
        this.setActorOpacity(this.opacity);
    }

    setActorOpacity(opacity) {
        this.actor.getProperty().setOpacity(opacity);
        refreshVTK();
    }

    changeOpacityTemp(opacity) {
        // Opacity come in as 0-100
        this.setActorOpacity(opacity/100)
    }

    resetVis() {
        // Call to reset to defaults
        this.resetOpacity();
        this.resetColour();
        this.resetVisibility();
    }
}