from django.shortcuts import render
from django.core.files.storage import FileSystemStorage
from django.http import FileResponse
from django.conf import settings
from django.http import JsonResponse

import os
from ampscan import AmpObject, registration, align, analyse
from random import randrange
import vtk
import numpy as np
import math
import logging

sessions = {}


class AmpObjectView:
    def __init__(self, ampObject, name, display=True, colour=(20, 20, 20), obj_type="scan"):
        self.name = name
        self.display = display
        self.colour = colour
        self.obj_type = obj_type
        self.ampObject = ampObject

    def property_response(self):
        return {
            "name": self.name,
            "display": self.display,
            "colour": self.colour,
            "type": self.obj_type,
        }
    


class AmpEnv:
    def __init__(self, obj_views=None):
        if obj_views == None:
            self.obj_views = {}
        else:
            outViews = {}
            for view in obj_views:
                for array in obj_views[view]["amp_obj"]:
                    if array != "values":
                        obj_views[view]["amp_obj"][array] = np.asarray(obj_views[view]["amp_obj"][array]).reshape([-1,3])
                outViews[view] = AmpObjectView(AmpObject(obj_views[view]["amp_obj"]), obj_views[view]["name"], obj_views[view]["display"], obj_views[view]["colour"], obj_views[view]["type"])
            self.obj_views = outViews

    def add_obj(self, ob, name, display=True, colour=(20, 20, 20), obj_type="scan"):
        self.obj_views[name] = (AmpObjectView(ob, name, display, colour, obj_type))
        print(list(self.obj_views.keys()))

    def get_obj(self, name):
        if name in self.obj_views.keys():
            return self.obj_views.get(name).ampObject
        else:
            # raise ValueError("Obj not found: %s \nCan be %s \nCurrent Sessions: %s\nCurrent Files: %s" % (str(name), str(self.obj_views.keys()), str([str(a.obj_views.keys()) for a in sessions.values()]), str(sessions.keys())))
            raise ValueError("Object not found")
    def remove_obj(self, name):
        del self.obj_views[name]

    def get_object_views(self):
        return self.obj_views.values()

    def get_object_view(self, name):
        return self.obj_views[name]

    def get_obj_views(self):
        return self.obj_views

    def add_object_view(self, name, view):
        self.obj_views[name] = view


def generate_next_session():
    """
    Generate session id randomly
    """
    i = randrange(2**31)
    while str(i) in sessions:
        i = randrange(2**31)
    sessions[str(i)] = AmpEnv()
    return str(i)


def get_session(request):
    """
    Retrieves the AmpEnv session from request
    """
    # if "session" in request.POST:
    #     sid = request.POST["session"]
    #     if sid in sessions:
    #         return sessions[sid]
    #     else:
    #         sessions[sid] = AmpEnv()
    #         return sessions[sid]
    # else:
    #     raise ValueError("request does not have session id")
    return AmpEnv(request.session["obj_views"])


def polydata_view(request):
    """
    View for requesting polydata
    """
    if request.method == "POST":
        draw_norms = (request.POST.get("norms") == "true")

        obj = get_session(request).get_obj(request.POST.get("objID"))
    else:
        raise Exception("Not POST request")

    response_dict = {"verts":obj.vert.flatten().tolist(),
                    "faces":(np.c_[np.full(obj.faces.shape[0], 3), obj.faces]).flatten().tolist()}

    # Filter out nans
    response_dict["verts"] = [i if not np.isnan(i) else 0 for i in response_dict["verts"]]
    response_dict["faces"] = [i if not np.isnan(i) else 0 for i in response_dict["faces"]]

    # Include norms if the request has it set to "true"
    if draw_norms:
        obj.calcVNorm()
        response_dict["norm"] = obj.vNorm.flatten().tolist()
        response_dict["norm"] = [i if not np.isnan(i) else 0 for i in response_dict["norm"]]

    # If the object is type "reg" then include scalars
    if get_session(request).get_object_view(request.POST.get("objID")).obj_type == "reg":
        response_dict["scalars"] = obj.values.flatten().tolist()
        response_dict["scalars"] = [i if not np.isnan(i) else 0 for i in response_dict["scalars"]]
    return JsonResponse(response_dict)


def register_view(request):
    """
    View for registration
    Requests to perform registration go here
    """

    baseline = get_session(request).get_obj(request.POST.get("baselineID"))
    target = get_session(request).get_obj(request.POST.get("targetID"))

    c1 = [31.0, 73.0, 125.0]
    c3 = [170.0, 75.0, 65.0]
    c2 = [212.0, 221.0, 225.0]
    CMap1 = np.c_[[np.linspace(st, en) for (st, en) in zip(c1, c2)]]
    CMap2 = np.c_[[np.linspace(st, en) for (st, en) in zip(c2, c3)]]
    CMap = np.c_[CMap1[:, :-1], CMap2]
    CMapN2P = np.transpose(CMap) / 255.0
    # CMap02P = np.flip(np.transpose(CMap1) / 255.0, axis=0)
    reg = registration(baseline, target, steps=3, smooth=1).reg
    # reg.addActor(CMap = self.CMap02P)
    reg.addActor(CMap=CMapN2P)

    name = "_regObject"
    ampEnv = get_session(request)
    ampEnv.add_obj(reg, name, obj_type="reg")
    request.session["obj_views"] = ampEnv.get_obj_views()

    if request.POST.get("absolute") == "true":
        for i in range(len(reg.values)):
            reg.values[i] = abs(reg.values[i])

    return JsonResponse({"newObjID": name})


def register_export_view(request):
    """
    Export reg object to new object with
    """
    ampEnv = get_session(request)
    obj = ampEnv.get_object_view("_regObject")
    ampEnv.add_object_view(request.POST.get("objID"), obj)
    ampEnv.remove_obj("_regObject")
    request.session["obj_views"] = ampEnv.get_obj_views()

    return JsonResponse({})


def rotate_view(request):
    """
    View for aligning
    """
    # AmpScan rotation
    obj = get_session(request).get_obj(request.POST.get("objID"))
    obj.rotateAng([float(request.POST["x"]), float(request.POST["y"]), float(request.POST["z"])])

    return JsonResponse({"success": True})


def translate_view(request):
    """
    View for aligning
    """
    # AmpScan translation
    obj = get_session(request).get_obj(request.POST.get("objID"))
    obj.translate([float(request.POST["x"]), float(request.POST["y"]), float(request.POST["z"])])

    return JsonResponse({"success": True})


def icp_view(request):
    """
    View for aligning
    """
    # TODO add options to adjust settings

    # AmpScan ICP alignment
    static = get_session(request).get_obj(request.POST.get("staticID"))
    moving = get_session(request).get_obj(request.POST.get("movingID"))
    al = align(moving, static, maxiter=10, method='linPoint2Plane').m

    new_name = request.POST.get("movingID")
    ampEnv = get_session(request)
    ampEnv.add_obj(al, new_name)
    request.session["obj_views"] = ampEnv.get_obj_views()

    return JsonResponse({"success": True, "newObjID": new_name})


def centre_view(request):
    """
    View for aligning
    """

    # AmpScan ICP alignment
    moving = get_session(request).get_obj(request.POST.get("movingID"))
    moving.centre()

    return JsonResponse({"success": True})


def centre_relative_view(request):
    """
    View for aligning
    """

    # AmpScan ICP alignment
    moving = get_session(request).get_obj(request.POST.get("movingID"))
    static = get_session(request).get_obj(request.POST.get("staticID"))

    moving.centreStatic(static)

    return JsonResponse({"success": True})


def trim_view(request):
    """
    View for aligning
    """

    # AmpScan ICP alignment
    obj = get_session(request).get_obj(request.POST.get("objID"))
    height = float(request.POST.get("height"))

    obj.planarTrim(height)

    return JsonResponse({"success": True})


def smooth_view(request):
    """
    View for aligning
    """

    # AmpScan ICP alignment
    obj = get_session(request).get_obj(request.POST.get("objID"))

    obj.lp_smooth()

    return JsonResponse({"success": True})


def csa_view(request):
    axis = 2
    if request.method == "POST":
        amp = get_session(request).get_obj(request.POST.get("objID"))
        slWidth = float(request.POST["sliceWidth"])

        # Find the brim edges
        ind = np.where(amp.faceEdges[:, 1] == -99999)[0]
        # Define max Z from lowest point on brim
        maxZ = amp.vert[amp.edges[ind, :], 2].min()
        # Create slices
        slices = np.arange(amp.vert[:, 2].min() + slWidth,
                           maxZ, slWidth)
        polys = analyse.create_slices(amp, slices, axis)
        PolyArea = analyse.calc_csa(polys)

        return JsonResponse({"xData": [i/len(PolyArea)*100 for i in range(len(PolyArea))], "yData": PolyArea.tolist()})


def perimeter_view(request):
    axis = 2
    if request.method == "POST":
        amp = get_session(request).get_obj(request.POST.get("objID"))
        slWidth = float(request.POST["sliceWidth"])

        # Find the brim edges
        ind = np.where(amp.faceEdges[:, 1] == -99999)[0]
        # Define max Z from lowest point on brim
        maxZ = amp.vert[amp.edges[ind, :], 2].min()
        # Create slices
        slices = np.arange(amp.vert[:, 2].min() + slWidth,
                           maxZ, slWidth)
        polys = analyse.create_slices(amp, slices, axis)
        poly_perimeter = analyse.calc_perimeter(polys)

        return JsonResponse({"xData": [i/len(poly_perimeter)*100 for i in range(len(poly_perimeter))], "yData": poly_perimeter.tolist()})


def widths_cor_view(request):
    axis = 2
    if request.method == "POST":
        amp = get_session(request).get_obj(request.POST.get("objID"))
        slWidth = float(request.POST["sliceWidth"])

        # Find the brim edges
        ind = np.where(amp.faceEdges[:, 1] == -99999)[0]
        # Define max Z from lowest point on brim
        maxZ = amp.vert[amp.edges[ind, :], 2].min()
        # Create slices
        slices = np.arange(amp.vert[:, 2].min() + slWidth,
                           maxZ, slWidth)
        polys = analyse.create_slices(amp, slices, axis)
        cor, sag = analyse.calc_widths(polys)
        return JsonResponse({"xData": [i/len(cor)*100 for i in range(len(cor))], "yData": cor.tolist()})


def widths_sag_view(request):
    axis = 2
    if request.method == "POST":
        amp = get_session(request).get_obj(request.POST.get("objID"))
        slWidth = float(request.POST["sliceWidth"])

        # Find the brim edges
        ind = np.where(amp.faceEdges[:, 1] == -99999)[0]
        # Define max Z from lowest point on brim
        maxZ = amp.vert[amp.edges[ind, :], 2].min()
        # Create slices
        slices = np.arange(amp.vert[:, 2].min() + slWidth,
                           maxZ, slWidth)
        polys = analyse.create_slices(amp, slices, axis)
        cor, sag = analyse.calc_widths(polys)
        return JsonResponse({"xData": [i/len(sag)*100 for i in range(len(sag))], "yData": sag.tolist()})


def summary_view(request):
    """Data table view"""
    axis = 2
    if request.method == "POST":
        amp = get_session(request).get_obj(request.POST.get("objID"))
        slWidth = float(request.POST["sliceWidth"])

        # Find the brim edges
        ind = np.where(amp.faceEdges[:, 1] == -99999)[0]
        # Define max Z from lowest point on brim
        maxZ = amp.vert[amp.edges[ind, :], 2].min()
        # Create slices
        slices = np.arange(amp.vert[:, 2].min() + slWidth,
                           maxZ, slWidth)
        polys = analyse.create_slices(amp, slices, axis)
        volume = analyse.est_volume(polys) * 0.001  # Convert to mm^3 -> ml

        return JsonResponse({"volume": volume})


def reg_bins_csv(request):
    if request.method == "POST":
        fs = FileSystemStorage()
        f = open(os.path.join(settings.MEDIA_ROOT, request.POST["session"]+".csv"), "w", newline="")
        analyse.generateRegBinsCsv(f, get_session(request).get_obj(request.POST.get("objID")),
                                  int(request.POST["numBins"]), float(request.POST["scalarMin"]), float(request.POST["scalarMax"]))
        f.close()
        return FileResponse(fs.open(request.POST["session"]+".csv"))


def reg_csv(request):
    if request.method == "POST":
        fs = FileSystemStorage()
        f = open(os.path.join(settings.MEDIA_ROOT, request.POST["session"]+".csv"), "w", newline="")
        analyse.generateRegCsv(f, get_session(request).get_obj(request.POST.get("objID")))
        f.close()
        return FileResponse(fs.open(request.POST["session"]+".csv"))


def home_view(request):
    """
    View for the home page
    """
    context = {}

    sid = generate_next_session()
    context["session_id"] = sid

    request.session["obj_views"] = {}
    print(request.session["obj_views"])
            
    if request.method == "GET":
        from django.middleware.csrf import get_token
        # don't use direct access to request.META.get('CSRF_COOKIE')
        # in this case django will NOT send a CSRF cookie. Use get_token function
        csrf_token = get_token(request)
        return render(request, "home.html", context=context)


def remove_view(request):
    if request.method == "POST":
        get_session(request).remove_obj(request.POST.get("objID"))
    return JsonResponse({"success": "true"})


def upload_view(request):
    """
    View for posting user uploads
    """
    if request.method == "POST" and request.FILES['user_file']:
        user_file = request.FILES['user_file']
        fs = FileSystemStorage()

        # Save uploaded file
        filename = fs.save(user_file.name.strip(), user_file)
        uploaded_file_url = fs.url(filename)

        # File system adds %20s instead of whitespace which causes problems
        uploaded_file_url = uploaded_file_url.replace("%20", " ")

        # print(settings.BASE_DIR)

        # Read in AmpObject from uploaded file
        file_loc = os.path.join(settings.BASE_DIR, os.path.abspath(uploaded_file_url[1:]))
        try:
            obj = AmpObject(file_loc)
        except ValueError:
            return JsonResponse({"corrupted": "true"})

        # Delete uploaded file once it's read in
        fs.delete(file_loc)

        # Get vtk actor (may be obsolete now)
        obj.addActor()

        # Get base name of file name
        basename = os.path.splitext(filename)[0]

        # Add object to session
        ampEnv = get_session(request)
        ampEnv.add_obj(obj, basename)
        views = ampEnv.get_obj_views()
        outViews = {}
        for view in views:
            outViews[view] = views[view].property_response()
            amp_obj = {
                "vert": list(obj.vert.flatten().tolist()),
                "faces": list(obj.faces.flatten().tolist()),
                # "values": obj.values.flatten().tolist()
            }
            outViews[view]["amp_obj"] = amp_obj
            raise Exception(type(outViews[view]["amp_obj"]))
        request.session["obj_views"] = outViews
        # raise Exception(get_session(request).get_obj_views())

        # Check file extension
        if os.path.splitext(uploaded_file_url)[1] == ".stl":
            # valid file
            json_response = JsonResponse({"objID": basename, "properties": get_session(request).get_object_view(basename).property_response()})
        else:
            json_response = JsonResponse({"success": "false"})
        return json_response
    return JsonResponse({"success": "false"})


def obj_viewer_view(request):
    """
    View for the object viewer javascipt script
    """
    context = {}
    return render(request, "static/test_app/js/main.js", context=context)


def object_list_view(request):
    """
    View for object list
    """
    response = []

    for obj_view in get_session(request).get_object_views():
        response.append(obj_view.property_response())

    return JsonResponse({"list":response})


def measurements_view(request):

    if request.method == "POST":
        obj = get_session(request).get_obj(request.POST.get("objID"))
        point = [float(request.POST["x"]), float(request.POST["y"]), float(request.POST["z"])]
        print(point)
        analyse.MeasurementsOut(obj, point)

        fs = FileSystemStorage()
        return FileResponse(fs.open("AmpScanReport.pdf"))


def download_view(request):
    if request.method == "POST":
        fs = FileSystemStorage()
        obj = get_session(request).get_obj(request.POST.get("objID"))
        path = os.path.join(settings.BASE_DIR, "media", request.POST.get("objID"))
        obj.save(path)

        response = FileResponse(fs.open(path))
        return response
