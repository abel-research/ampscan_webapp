from django.shortcuts import render
from django.core.files.storage import FileSystemStorage
from django.http import FileResponse
from django.conf import settings
from django.http import JsonResponse

import os
from AmpScan import AmpObject
from random import randrange

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


def downloads_view(request):
    fs = FileSystemStorage()
    response = FileResponse(fs.open(settings.BASE_DIR + uploaded_file_url, 'rb'))
    return response


def align_view(request):
    # AmpScan processing
    id = request.GET.get('id')
    if id is None:
        #create random session id and check if exsits
        #obj = AmpObject(settings.BASE_DIR + uploaded_file_url)
        #request.session[id] = obj
    else:
        #obj = request.session[id]
        # obj = AmpObject(settings.BASE_DIR + uploaded_file_url)
        obj.rotateAng([float(request.POST["x"]), float(request.POST["y"]), float(request.POST["z"])])
        obj.save(settings.BASE_DIR + uploaded_file_url)
        print(request.POST)
        return JsonResponse({"success": True})


def home_view(request):
    global uploaded_file_url
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
