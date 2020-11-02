"""ampscan URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf.urls.static import static
from django.conf import settings

from test_app.views import home_view, obj_viewer_view,\
    rotate_view, polydata_view, upload_view,\
    icp_view, register_view, download_view, translate_view, centre_view, centre_relative_view, remove_view, csa_view,\
    register_export_view, measurements_view, summary_view, perimeter_view, widths_sag_view, widths_cor_view,\
    reg_bins_csv, reg_csv, smooth_view, trim_view, threeP_trim_view


urlpatterns = [
    path('admin', admin.site.urls),
    path('', home_view, name="home"),
    path('main.js', obj_viewer_view),
    path('download/polydata', polydata_view),
    path('download/stl_file', download_view),
    path('download/regbins', reg_bins_csv),
    path('download/regcsv', reg_csv),
    path('upload/scan', upload_view),
    path('process/align/rotate', rotate_view),
    path('process/align/translate', translate_view),
    path('process/align/centre', centre_view),
    path('process/align/centre_relative', centre_relative_view),
    path('process/align/icp', icp_view),
    path('process/register', register_view),
    path('process/register/export', register_export_view),
    path('process/remove', remove_view),
    path('analyse/csa', csa_view),
    path('analyse/perimeter', perimeter_view),
    path('analyse/widths/sag', widths_sag_view),
    path('analyse/widths/cor', widths_cor_view),
    path('analyse/measurements', measurements_view),
    path('analyse/summary', summary_view),
    path('home/smooth', smooth_view),
    path('home/trim', trim_view),
    path('home/trimP', threeP_trim_view),
]

# Only use in development
if settings.DEBUG:
    # Use Django as media server
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
