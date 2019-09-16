


const vtk = parent.window.vtk;
const macro = vtk.macro;
const vtkParentClass = vtk.Common.Core.vtkLookupTable;

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {

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
  publicAPI.getTable = () => {
      return model.table;
  };

  //new force build method that traverses straight through the RGB colour space
    // rather then traversing through HSV and then converting to RGB for the colour map
  publicAPI.forceBuild = () =>{

        const maxIndex1 = model.numberOfColors + 1;
        const spacing = 1/maxIndex1;
        const u = model.colors.length;
        let rgba1 = [];
        for (let i = 0; i < maxIndex1; i++){
            let x = i * spacing;
            
            for (var j = 0; j < u; j++){
              if (model.colors[j][3] <= x && model.colors[j+1][3] > x){
                break
              }
            }
            const x0 = model.colors[j][3];
            const x1 = model.colors[j+1][3];
            for (let k = 0; k < 3; k++){
              const y0 = model.colors[j][k];
              const y1 = model.colors[j+1][k];
              rgba1[k] = y0 + (x - x0) * ((y1 - y0)/(x1 - x0));
            rgba1[3] = 255;
            
            model.table[i * 4] = rgba1[0] + 0.5;
            model.table[i * 4 + 1] = rgba1[1]+ 0.5;
            model.table[i * 4 + 2] = rgba1[2]+ 0.5;
            model.table[i * 4 + 3] = rgba1[3] + 0.5;

        }
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
    colors: [
             [37.0, 48.0, 94.0, 0.0],
             [212.0, 221.0, 225.0, 0.5],
             [170.0, 75.0, 65.0, 1.0]
            ],
    numberOfColors: 10
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