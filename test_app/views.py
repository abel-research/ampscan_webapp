from django.shortcuts import render
from django.core.files.storage import FileSystemStorage
from django.http import FileResponse
from django.conf import settings
from django.http import JsonResponse

import os
from AmpScan import AmpObject, registration
from random import randrange
import vtk
import numpy as np

obj = None
sessions = {}
uploaded_file_url = ""


class AmpEnv:
    def __init__(self, *args, **kwargs):
        self.objs = []

    def add_obj(self, obj):
        self.objs.append(obj)


def generate_next_session():
    i = randrange(2**32)
    while str(i) in sessions:
        i = randrange(2**32)
    sessions[str(i)] = AmpEnv()
    return str(i)


def get_session(request):
    if "session" in request.POST:
        return request.POST["session"]
    else:
        raise ValueError("request does not have session id")

def register():
    
    obj2 = AmpObject(settings.BASE_DIR + "/media/stl_file.stl")
    obj = AmpObject(settings.BASE_DIR + "/media/stl_file_2.stl")

    c1 = [31.0, 73.0, 125.0]
    c3 = [170.0, 75.0, 65.0]
    c2 = [212.0, 221.0, 225.0]
    CMap1 = np.c_[[np.linspace(st, en) for (st, en) in zip(c1, c2)]]
    CMap2 = np.c_[[np.linspace(st, en) for (st, en) in zip(c2, c3)]]
    CMap = np.c_[CMap1[:, :-1], CMap2]
    CMapN2P = np.transpose(CMap)/255.0
    CMap02P = np.flip(np.transpose(CMap1)/255.0, axis=0)
    reg = registration(obj, obj2, steps = 5,smooth=1).reg
    #reg.addActor(CMap = self.CMap02P)
    reg.addActor(CMap = CMapN2P)


def downloads_view(request):
    
    fs = FileSystemStorage()
    response = FileResponse(fs.open(settings.BASE_DIR + uploaded_file_url, 'rb'))

    return response

def polydata_view(request):
    obj.calcVNorm()
    return JsonResponse({"verts":obj.vert.flatten().tolist(), 
                         "faces":(np.c_[np.full(obj.faces.shape[0], 3), obj.faces]).flatten().tolist(), 
                         "norm":obj.vNorm.flatten().tolist()})

def align_view(request):
    # AmpScan processing
    global obj
    obj.rotateAng([float(request.POST["x"]), float(request.POST["y"]), float(request.POST["z"])])
    obj.save(settings.BASE_DIR + uploaded_file_url)

    print(request.POST)
    return JsonResponse({"success": True})


def home_view(request):
    global uploaded_file_url, obj
    context = {}
    context["file_loaded"] = False

    sid = generate_next_session()
    context["session_id"] = sid

    if request.method == "POST" and request.FILES['user_file']:
        context["file_loaded"] = True
        user_file = request.FILES['user_file']
        fs = FileSystemStorage()
        filename = fs.save(user_file.name, user_file)
        uploaded_file_url = fs.url(filename)
        obj = AmpObject(settings.BASE_DIR + uploaded_file_url)
        obj.addActor()
        if os.path.splitext(uploaded_file_url)[1] == ".stl":
            # valid file
            context["valid_file"] = True
            context["obj_file_loc"] = uploaded_file_url

            return render(request, "home.html", context=context)
        else:   
            # Put if file is valid in context for render
            context["valid_file"] = False
            
    elif request.method == "GET":
        return render(request, "home.html", context=context)


def obj_viewer_view(request):
    return render(request, "obj_viewer.js")
