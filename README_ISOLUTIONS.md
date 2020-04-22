iSolutions Server Setup
=======================

The iSolutions server is running two (or more!) copies of the site, to enable a proper `dev`->`prod` workflow.
For full deatails of the workflow, read [here](WORKFLOW.md).


Prerequisites
-------------

To install on a server, we need:
* *uwsgi*
* *nginx*
* *letsencrypt*/*certbot*
* *python 3*
* *pip*

If you're on Red Hat, this will involve installing developer tools so you can build *uwsgi*:
```bash
yum groupinstall "Development Tools"
```

Then install all the tools as:
```bash
apt install nginx python3 python3-devel python-certbot-nginx
pip3 install uwsgi
```


Installation
------------

Instead of simply having a single `prosthetics` repo, you should clone two- one to `prosthetics-prod`,
one to `proshetics-dev` and make sure one is running the development branch as 
```bash
mkdir /var/www
git clone https://git.soton.ac.uk/radii-devices/prosthetics.git /var/www/prosthetics-prod
git clone https://git.soton.ac.uk/radii-devices/prosthetics-custom.git custom

git clone https://git.soton.ac.uk/radii-devices/prosthetics.git /var/ww/prosthetics-dev
git clone https://git.soton.ac.uk/radii-devices/prosthetics-custom.git /var/www/prosthetics-dev/custom

cd /var/www/prosthetics-dev
git checkout Dev
```


### NPM

We need to install and build all the NPM packages as
```bash
cd /var/www/prosthetics-prod
npm install three
npm install webpack
npm run build
cd /var/www/prosthetics-dev
npm install three
npm install webpack
npm run build
```


### Static files

Then, we need to create the virtual environments, build migrations and collect the static files so *uwsgi* can see them. 
We do this by `cd`ing into the root and running `collectstatic` as:
```bash
cd /var/www/prosthetics-prod
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
python3 manage.py collectstatic
python3 manage.py makemigrations
python3 manage.py migrate
source deactivate

cd /var/www/prosthetics-prod
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
python3 manage.py collectstatic
python3 manage.py makemigrations
python3 manage.py migrate
```


Nginx
-----

We need to set up *nginx* to serve the page.
Install *nginx*, link the config files provided to the `custom/nginx/` directory. 

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
sudo ln -s /var/www/prosthetics-prod/custom/deploy/nginx/conf/prosthetics-prod.conf /etc/nginx/conf.d/.
sudo ln -s /var/wwww/prosthetics-dev/custom/deploy/nginx/conf/prosthetics-dev.conf /etc/nginx/conf.d/.
systemctl restart nginx.service
```

*iSolutions* builds of *Red Hat* will also require you to change the `iptables` rules:
```bash
sudo iptables -I INPUT -p tcp -m tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp -m tcp --dport 443 -j ACCEPT
sudo service iptables save
```
Please note that by default, these rules will be reset every 15min to ones not in the `iptables` save file.
You need to contact *iSolutions* to get them to suppress this behaviour.


UWSGI 
-----

Then we need *uwsgi* to serve the page for *nginx*.

If you are on an *iSolutions Red Hat* VM, your life is yet again harder. 
The server is restarted monthly, killing any running processes.
So you need to set up *uwsgi* to run as a system process, so make sure it is installed outside of your `venv`. You 
**need** to make sure you have installed *uwsgi* for *python 3*. Then set *uwsgi* up as a system service.

```bash
pip3 install uwsgi
```

Then copy the *uwsgi* setup file to the system services folder and start it up as:
```bash
sudo ln -s deploy/systemd/uwsgi.service /etc/systemd/system/.
sudo systemctl enable uwsgi
sudo systemctl start uwsgi
```
*uwsgi* will now be watching a directory and launching a site for any `.ini` file in that directory. 
Link the setup `.ini` files from to this directory as:
```bash
sudo mkdir /etc/uwsgi
sudo mkdir /etc/uwsgi/sites
sudo mkdir /var/log/uwsgi
sudo ln -s /var/www/prosthetics-prod/deploy/uwsgi/prosthetics-prod.ini /etc/uwsgi/sites/.
sudo ln -s /var/www/prosthetics-dev/deploy/uwsgi/prosthetics-dev.ini /etc/uwsgi/sites/.
```
These are set up for a 2-site system, with one 'development' and one 'production'


Logging Info
------------

Unless you changed it in the custom *nginx* file or the *uwsgi* file, logs should be in:
* `/var/log/nginx/prosthetics-prod.access.log`
* `/var/log/nginx/prosthetics-prod.error.log`
* `/var/log/nginx/prosthetics-dev.access.log`
* `/var/log/nginx/prosthetics-dev.error.log`
* `/var/log/uwsgi/prosthetics-prod.log`
* `/var/log/nginx/prosthetics-prod.log`
* `/var/log/nginx/prosthetics-dev.log`
* `/var/log/nginx/prosthetics-dev.log`


Updates
-------

When updating, you will need to:
1. Pull the latest version of the site from git
2. Activate the virtual environment and install any new requirements:
```bash
source venv/bin/activate
pip install -r requirements.txt
```
3. Install any new NPM requirements and rebuild:
```bash
npm install [NEW]
npm run build
```
4. Collect the new static files
```bash
python manage.py collectstatic
```
5. Restart UWSGI (by updating the ini file date)
```bash
touch --no-dereference deploy/uwsgi/prosthetics-prod.ini
```
