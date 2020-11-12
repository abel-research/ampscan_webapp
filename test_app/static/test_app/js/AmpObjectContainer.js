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
        this.pickedPoints = [0, 0, 0];
        this.pickedActors = [0, 0, 0];
        this.picker = null;
        // Note actor is set during polyUpdate
    }

    setActorVisibility(display) {
        this.actor.setVisibility(display);
        for (let i = 0; i < 3; i++){
            if (this.pickedActors[i] === 0){
                continue
            }
            this.pickedActors[i].setVisibility(display);
        }
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

    addPicker(renderer) {
        this.picker = vtk.Rendering.Core.vtkPointPicker.newInstance();
        this.picker.setPickFromList(1);
        this.picker.initializePickList();
        this.picker.addPickList(this.actor);
        renderer.getRenderWindow().getInteractor().onRightButtonPress((callData) => {
            if (this.display === false) {return};
            if (selectedPoint === -1) {return};
            const pos = callData.position;
            const point = [pos.x, pos.y, 0.0];
            this.picker.pick(point, renderer);
            if (this.picker.getActors().length === 0) {return};
            const pickedPoint = this.picker.getPickedPositions()[0];
            this.pickedPoints[selectedPoint] = pickedPoint;
            if (this.pickedActors[selectedPoint] === 0){
                const sphere = vtk.Filters.Sources.vtkSphereSource.newInstance();
                sphere.setCenter(pickedPoint);
                sphere.setRadius(5);
                const sphereMapper = vtk.Rendering.Core.vtkMapper.newInstance();
                sphereMapper.setInputData(sphere.getOutputData());
                const sphereActor = vtk.Rendering.Core.vtkActor.newInstance();
                sphereActor.setMapper(sphereMapper);
                this.pickedActors[selectedPoint] = sphereActor
                let color = [0.0, 0.0, 0.0];
                color[selectedPoint] = 1;
                sphereActor.getProperty().setColor(color[0], color[1], color[2]);
                renderer.addActor(sphereActor);
            }
            else{
                
                const sphere = vtk.Filters.Sources.vtkSphereSource.newInstance();
                sphere.setCenter(pickedPoint);
                sphere.setRadius(5);
                const sphereMapper = vtk.Rendering.Core.vtkMapper.newInstance();
                sphereMapper.setInputData(sphere.getOutputData());
                this.pickedActors[selectedPoint].setMapper(sphereMapper);
            }
            renderer.getRenderWindow().render();


        });
    }
}