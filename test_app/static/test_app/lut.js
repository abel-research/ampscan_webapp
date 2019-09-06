


const vtk = parent.window.vtk;
const macro = vtk.macro;
const vtkParentClass = vtk.Common.Core.vtkLookupTable;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// Add module-level functions or api that you want to expose statically via
// the next section...

function moduleScopedMethod() {
  // do stuff
}

function moduleScopedStaticMethod()  {
// do more stuff
    console.log();
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  moduleScopedStaticMethod,
};

// ----------------------------------------------------------------------------
// vtkMyClass methods
// ----------------------------------------------------------------------------

function vtkNewLookupTable(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkNewLookupTable');

  // Capture "parentClass" api for internal use
  const superClass = Object.assign({}, publicAPI);

  // Public API methods
  publicAPI.exposedMethod = () => {
    // This is a publicly exposed method of this object
  };

  //new force build method that traverses straight through the RGB colour space
    // rather then traversing through HSV and then converting to RGB for the colour map
  publicAPI.forceBuild = () =>{

        const maxIndex1 = model.numberOfColors - 1;

        if(maxIndex1) {
            model.rIncLM = (model.lowerCol[0] - model.midCol[0]) / (maxIndex1);
            model.gIncLM = (model.lowerCol[1] - model.midCol[1]) / (maxIndex1);
            model.bIncLM = (model.lowerCol[2] - model.midCol[2]) / (maxIndex1);
            model.rIncMU = (model.upperCol[0] - model.midCol[0]) / (maxIndex1);
            model.gIncMU = (model.upperCol[1] - model.midCol[1]) / (maxIndex1);
            model.bIncMU = (model.upperCol[2] - model.midCol[2]) / (maxIndex1);
        }

        let rgba1 = [];
        for (let i = 0; i <=maxIndex1/2; i++){
            rgba1[0] = model.lowerCol[0] + (i * model.rIncLM);
            rgba1[1] = model.lowerCol[1] + (i * model.gIncLM);
            rgba1[2] = model.lowerCol[2] + (i * model.bIncLM);
            rgba1[3] = 255;

            model.table[i * 4] = rgba1[0] + 0.5;
            model.table[i * 4 + 1] = rgba1[1]+ 0.5;
            model.table[i * 4 + 2] = rgba1[2]+ 0.5;
            model.table[i * 4 + 3] = rgba1[3] + 0.5;

        }
        for (let i=0; i <=maxIndex1/2; i++){
            rgba1[0] = model.midCol[0] + (i * model.rIncMU);
            rgba1[1] = model.midCol[1] + (i * model.gIncMU);
            rgba1[2] = model.midCol[2] + (i * model.bIncMU);
            rgba1[3] = 255;
            model.table[(i+maxIndex1/2) * 4] = rgba1[0] + 0.5;
            model.table[(i+maxIndex1/2) * 4 + 1] = rgba1[1]+ 0.5;
            model.table[(i+maxIndex1/2) * 4 + 2] = rgba1[2]+ 0.5;
            model.table[(i+maxIndex1/2) * 4 + 3] = rgba1[3]+0.5;
        }
        superClass.buildSpecialColors();

        model.buildTime.modified();
    };

    publicAPI.build = () =>{
        publicAPI.forceBuild();
    };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
    //c1 and c2 are the lightest and darkest values for the colour map
    lowerCol: [212.0, 221.0, 225.0],
    midCol: [170.0, 75.0, 65.0],
    upperCol: [170.0, 75.0, 65.0],
    //the amount the red, green and blue values are incremented when creating the colour map
    rIncLM: 0,
    gIncLM: 0,
    bIncLM: 0,
    rIncMU: 0,
    gIncMU: 0,
    bIncMU: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.setArray(publicAPI, model, ['lowerCol', 'midCol', 'upperCol'],3);

  macro.getArray(publicAPI, model, ['lowerCol', 'midCol', 'upperCol']);

  macro.get(publicAPI, model, ['rIncLM', 'gIncLM', 'bIncLM','rIncMU', 'gIncMU', 'bIncMU']);

  // Inheritance
  vtkParentClass.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkNewLookupTable(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkNewLookupTable');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);