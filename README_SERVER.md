Server Setup
============

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
First, we need to collect the static files so *uwsgi* can see them. 
We do this by `cd`ing into the root and running `collectstatic` as:
```bash
cd prosthetics
python manage.py collectstatic
```

Nginx
-----

We need to set up *nginx* to serve the page.
Install *nginx*, link the config file provided to the `custom/nginx/` directory. 
Assuming it's been installed for a user called `rsg`:

```bash
systemctl start nginx.service
sudo ln -s /home/rsg/prosthetics/custom/deploy/nginx/conf/prosthetics-prod.conf /etc/nginx/sites-available/.
sudo ln -s /home/rsg/prosthetics/custom/deploy/nginx/conf/prosthetics-prod.conf /etc/nginx/sites-enabled/.
systemctl restart nginx.service
```
Or, if you're on *Red Hat*, it's a lot less fun:
```bash
systemctl start nginx.service
sudo ln -s /home/rsg/prosthetics/custom/nginx/conf/prosthetics /etc/nginx/conf.d/prosthetics-prod.conf
systemctl restart nginx.service
```

UWSGI 
-----
Then we need *uwsgi* to serve the page for *nginx*.
Modify `uwsgi.ini` to point at the correct location for the static files. 
If you have installed for a user named `rsg`, then you shouldn't need to edit anything.
If you have modified it, you'll need to adjust the path to wherever `collectstatic` put them.

Launch a screen session then run *uwsgi* as:
```bash
screen
uwsgi --ini uwsgi.ini
[Ctrl-A, Ctrl-D]
```

SSL Certificate
---------------

We then need to set up the SSL certificate for the page using *letsencrypt*.
```bash
sudo certbot --nginx -d [your URL]
```
/etc/letsencrypt/live/prosthetics/fullchain.pem;
