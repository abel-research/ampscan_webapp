from django.shortcuts import render
from django.core.files.storage import FileSystemStorage
from django.http import FileResponse
from django.conf import settings
from django.http import JsonResponse

import os
from AmpScan import AmpObject, registration, align
from random import randrange
import vtk
import numpy as np

sessions = {}


class AmpObjectView:
    def __init__(self, name, ampObject, display=True, colour=(20, 20, 20)):
        self.name = name
        self.display = display
        self.colour = colour
        self.ampObject = ampObject

    def property_response(self):
        return {
            "name": self.name,
            "display": self.display,
            "colour": self.colour
        }


class AmpEnv:
    def __init__(self):
        self.obj_views = {}

    def add_obj(self, obj, name):
        self.obj_views[name] = (AmpObjectView(name, obj))

    def get_obj(self, name):
        if name in self.obj_views.keys():
            return self.obj_views.get(name).ampObject
        else:
            raise ValueError("Obj not found: {}".format(name))

    def get_object_views(self):
        return self.obj_views.values()

    def get_object_view(self, name):
        return self.obj_views[name]


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
    if "session" in request.POST:
        sid = request.POST["session"]
        if sid in sessions:
            return sessions[sid]
        else:
            sessions[sid] = AmpEnv()
            return sessions[sid]
    else:
        raise ValueError("request does not have session id")


def polydata_view(request):
    """
    View for requesting polydata
    """

    draw_norms = True
    if request.method == "POST":
        draw_norms = request.POST.get("norms")=="true"

        obj = get_session(request).get_obj(request.POST.get("objID"))
    else:
        raise Exception("Not POST request")

    responseDict = {"verts":obj.vert.flatten().tolist(), 
                    "faces":(np.c_[np.full(obj.faces.shape[0], 3), obj.faces]).flatten().tolist()}
    if draw_norms:
        obj.calcVNorm()
        responseDict["norm"] = obj.vNorm.flatten().tolist()

    return JsonResponse(responseDict)


def register_view(request):
    """
    View for registration (placeholder)
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
    reg = registration(baseline, target, steps=5, smooth=1).reg
    # reg.addActor(CMap = self.CMap02P)
    reg.addActor(CMap=CMapN2P)

    name = request.POST.get("baselineID") + "_reg"
    get_session(request).add_obj(reg, name)

    return JsonResponse({"objID": name})


def rotate_view(request):
    """
    View for aligning
    """
    # AmpScan rotation
    obj = get_session(request).get_obj(request.POST.get("objID"))
    obj.rotateAng([float(request.POST["x"]), float(request.POST["y"]), float(request.POST["z"])])

    return JsonResponse({"success": True})


def icp_view(request):
    """
    View for aligning
    """
    # AmpScan ICP alignment
    static = get_session(request).get_obj(request.POST.get("staticID"))
    moving = get_session(request).get_obj(request.POST.get("movingID"))
    al = align(moving, static, maxiter=10, method='linPoint2Plane').m

    new_name = request.POST.get("movingID")+"_al"
    get_session(request).add_obj(al, new_name)

    return JsonResponse({"success": True, "newObjID": new_name})


def home_view(request):
    """
    View for the home page
    """
    global uploaded_file_url, obj
    context = {}
            
    if request.method == "GET":
        return render(request, "home.html", context=context)


def upload_view(request):
    """
    View for posting user uploads
    """

    if request.method == "POST" and request.FILES['user_file']:
        user_file = request.FILES['user_file']
        fs = FileSystemStorage()

        # Save uploaded file
        filename = fs.save(user_file.name, user_file)
        uploaded_file_url = fs.url(filename)

        # Read in AmpObject from uploaded file
        obj = AmpObject(settings.BASE_DIR + uploaded_file_url)

        # Delete uploaded file
        fs.delete(settings.BASE_DIR + uploaded_file_url)

        # Get vtk actor (may be obsolete now)
        obj.addActor()

        # Get base name of file name
        basename = os.path.splitext(filename)[0]

        # Add object to session
        get_session(request).add_obj(obj, basename)

        # Check file extension
        if os.path.splitext(uploaded_file_url)[1] == ".stl":
            # valid file
            return JsonResponse({"success": True, "objID": basename, "properties": get_session(request).get_object_view(basename).property_response()})
        else:   
            return JsonResponse({"success": False})


def obj_viewer_view(request):
    """
    View for the object viewer javascipt script
    """
    context = {}

    sid = generate_next_session()
    context["session_id"] = sid
    return render(request, "obj_viewer.js", context=context)


def object_list_view(request):
    """
    View for object list
    """
    response = []

    for obj_view in get_session(request).get_object_views():
        response.append(obj_view.property_response())

    return JsonResponse({"list":response})
