![ampscanlogo](https://github.com/abel-research/ampscan/blob/master/docs/ampscan_header.svg)

**Join AmpScan chat:** [![Join the chat at https://gitter.im/ampscan](https://badges.gitter.im/gitterHQ/gitter.svg)](https://gitter.im/ampscan)

ampscan is an open-source Python package for analysis and visualisation of digitised surface scan data, specifically for applications within Prosthetics and Orthotics, developed with the ABEL at the University of Southampton. These industries are increasingly using surface scanners as part of clinical practice to capture the patient's individual geometry to design personalised devices. ampscan gives researchers within this field access to powerful tools to analyse the collected scans to help inform clinical practice towards improved patient-outcomes. This package has been designed to be accessible for researchers and clinicians with only a limited knowledge of Python. The app can be accessed at on our dedicated [site](https://ampscan.io/). 

Acknowledgments
-------------------
The developers would like to acknowledge the [University of Southampton Research Software Group](https://rsgsoton.net/) for their support in developing the app. 


Running AmpScan Webapp
-------------------

Clone the repo using: `git clone https://github.com/abel-research/ampscan_webapp`

CD into directory using `cd ampscan_webapp`

(Optional) create new conda environment `conda create -n ampscan_environment python=3.6 pip --no-default-packages` and activate conda environment `conda activate ampscan_environment`

Install requirements with pip: `pip install -r requirements.txt`

Run development server using: `python manage.py runserver`

Now test it works by going to http://127.0.0.1:8000/ in your webbrowser.

Maintainer Notes
----------------

This app uses a Django framework.

vtk.js is used to render the scans in the browser.

As a future improvement, we may want to add a modules bundler such as webpack rather than importing vtk.js scripts from a URL.

Please see the Issues for new features and improvements planned or in progress.
