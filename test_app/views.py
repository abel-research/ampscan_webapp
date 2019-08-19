from django.shortcuts import render
from django.core.files.storage import FileSystemStorage
from django.http import FileResponse
from django.conf import settings
from django.http import JsonResponse

import os
from AmpScan import AmpObject

uploaded_file_url = ""
ang = 0

def downloads_view(request):
    fs = FileSystemStorage()
    response = FileResponse(fs.open(settings.BASE_DIR + uploaded_file_url, 'rb'))
    return response


def align_view(reqest):
    global ang
    # AmpScan processing
    obj = AmpObject(settings.BASE_DIR + uploaded_file_url)
    obj.rotateAng([0.1, 0, 0])
    ang += 0.1
    obj.save(settings.BASE_DIR + uploaded_file_url)
    return JsonResponse({"success": True, "ang": ang})


def home_view(request):
    global uploaded_file_url
    context = {}
    context["file_loaded"] = False
    if request.method == "POST" and request.FILES['user_file']:
        context["file_loaded"] = True
        user_file = request.FILES['user_file']
        fs = FileSystemStorage()
        filename = fs.save(user_file.name, user_file)
        uploaded_file_url = fs.url(filename)
        print(uploaded_file_url)
        if os.path.splitext(uploaded_file_url)[1] == ".stl":
            # valid file
            context["valid_file"] = True
            context["obj_file_loc"] = uploaded_file_url

            return render(request, "home.html", context=context)
        else:   
            # Put if file is valid in context for render
            context["valid_file"] = False

    return render(request, "home.html", context=context)

def obj_viewer_view(request):
    return render(request, "obj_viewer.js")
