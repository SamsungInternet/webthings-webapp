## WEBTHINGS WEBAPP: ##

Standalone application to browse "Webthings" connected to "Mozilla IoT Gateway"

## USAGE: ##

Setup "Mozilla IoT gateway", create default user

This "webapp" was designed to be used as into Tizen HTML5 runtime environment.

Page can also be tested also using regular browser (as long as CORS is enabled),
using a remote URL (ie: https://rzr.github.io/webthings-webapp/ )
or just load index.html from filesystem (using file:/// protocol).

```
chromium-browser --disable-web-security https://rzr.github.io/webthings-webapp/
```

Then update gateway's URL:
* http://gateway.local:8080 : for default location in local network
* https://$host.mozilla-iot.org : for public (if you haven't skipped the registation step)

For reference, It was tested on Tizen TM1 reference device.


## DEMO: ##

[![webthing-esp8266-webapp-20180602rzr](https://i.vimeocdn.com/video/704744529.jpg)](https://www.slideshare.net/SamsungOSG/the-complex-iot-equation-and-floss-solutions-101449596/10 "Demo video")

* https://www.slideshare.net/SamsungOSG/the-complex-iot-equation-and-floss-solutions-101449596/


## RESOURCES: ##

* https://iot.mozilla.org/
* https://s-opensource.org/category/internet-of-things/
* https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
* https://wiki.tizen.org/TM1
* https://wiki.tizen.org/index.php?title=User:Pcoval
