![ampscanlogo](https://github.com/abel-research/ampscan/blob/master/docs/ampscan_header.svg)

**Join AmpScan chat:** [![Join the chat at https://gitter.im/ampscan](https://badges.gitter.im/gitterHQ/gitter.svg)](https://gitter.im/ampscan)

This is the webapp interface for the open-source Python package for analysis and visualisation of digitised surface scan data, AmpScan. 

Running AmpScan Webapp
-------------------

Pip install requirements.txt

Maintainer Notes
----------------

This app runs a Python server using Django to process the AmpScan operations.

On the front-end side, vtk.js is used to render the scans.

As a future improvement, we may want to add a modules bundler such as webpack rather than importing vtk.js scripts from a URL.
