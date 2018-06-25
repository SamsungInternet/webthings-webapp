// -*- mode: js; js-indent-level:2; -*-
// SPDX-License-Identifier: MPL-2.0
/* Copyright 2018-present Samsung Electronics France
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

(function() {
 // 'use strict';

var app = {
  isLoading: true,
  datacontent: document.querySelector('.textarea')
};

//TODO disable this if you want to hide log
app.log = console.log;

app.handleDocument = function(document)
{
  var parser = new DOMParser();
  //TODO: https://github.com/mozilla-iot/gateway/pull/1142
  //TODO: document.getElementById('token').textContent;
  var xpath = '/html/body/section/div[2]/code/text()';
  var iterator = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null );
  var thisNode = iterator.iterateNext();
  this.log("token: " + thisNode.textContent); //TODO
  localStorage['token'] = thisNode.textContent;
};

app.browse = function(url, callback)
{
  var self = this;
  if (localStorage['token'])
    return;
  this.log("browse: " + url);
  const delay = 50;
  window.authCount = 0;
  // TODO: https://github.com/mozilla-iot/gateway/pull/1149
  window.addEventListener("message", function(ev) {
    if (ev.data.message && ev.data.message.token) {
      localStorage['token'] = ev.data.message.token;
      window.authCount = 98;
    }
  });
  window.authWin = window.open(url);
  if (!window.authWin) {
    throw "Cant open window: " + url;
  }
  window.interval = setInterval(function () {
    // TODO: check if host alive using xhr
    if (window.authCount > 60) {
      window.clearInterval(window.interval);
      if (window.authWin) {
        window.authWin.close();
      }
      window.form.token.value = localStorage['token'];
      if (callback) callback();
    }
    window.authWin.postMessage({ message: "token" }, "*");
    try {
      url = (window.authWin && window.authWin.location
             && window.authWin.location.href )
        ? window.authWin.location.href : undefined;
      if (url && (url.indexOf('code=') >=0)) {
        self.handleDocument(window.authWin.document);
        window.authCount = 99;
      } else {
        window.authCount++;
        self.log("wait: " + url); //TODO
      }
    } catch(e) {
      self.log(e.message);
    }
  }, delay);
};

app.get = function(endpoint, callback)
{
  var url = window.form.url.value + endpoint;
  var token = localStorage['token'];
  var request = new XMLHttpRequest();
  request.addEventListener('load', function() {
    callback = callback || {};
    callback(null, this.responseText);
  });
  this.log(url); //TODO
  request.open('GET', url);
  request.setRequestHeader('Accept', 'application/json');
  request.setRequestHeader('Authorization', 'Bearer ' + token);
  request.send();
};

app.put = function(endpoint, payload, callback)
{
  var url = window.form.url.value + endpoint;
  var token = localStorage['token'];
  payload = JSON.stringify(payload);
  this.log(url);
  this.log(payload);
  var request = new XMLHttpRequest();
  request.addEventListener('load', function() {
    callback = callback || {};
    callback(null, this.responseText);
  });
    request.open('PUT', url);
  request.setRequestHeader('Content-Type', 'application/json');
  request.setRequestHeader('Accept', 'application/json');
  request.setRequestHeader('Authorization', 'Bearer ' + token);
  request.send(payload);
}

app.updateView = function(model, view)
{
  var self = this;
  if (model.type === "binarySensor"  || model.type === "onOffSwitch") {
    var endpoint = model.properties.on.href;
    this.get(endpoint, function(err, data) {
      view.local.widget.checked = !!(JSON.parse(data).on);
    });
  } else if (model.type === "multiLevelSensor") {
    this.get(model.properties.level.href, function(err, data) {
      view.local.widget.innerText = JSON.parse(data).level;
    });
  } else {
    console.log("TODO: implement " + model.type);
  }
};

app.createBinarySensorView = function(li, model)
{
  var self = this;
  li.setAttribute('class', 'ui-li-static ui-li-1line-btn1');
  var div = document.createElement('div');
  div.setAttribute('class', 'ui-btn.ui-btn-box-s ui-toggle-container');

  var widget = li.local.widget = document.createElement('input');
  widget.setAttribute('type', 'checkbox');
  //TODO: widget.tau = tau.widget.ToggleSwitch(radio);
  widget.setAttribute('class','ui-toggle-switch');
  widget.setAttribute('data-tau-built', "ToggleSwitch");
  widget.setAttribute('data-tau-name', "ToggleSwitch");
  widget.setAttribute('aria-disabled', "false");
  widget.setAttribute('data-tau-bound', "ToggleSwitch");
  var endpoint = model.properties.on.href;
  widget.addEventListener('click', function(){
    widget.disabled = true;
    self.get(model.properties.on.href, function(err, data) {
      widget.disabled = false;
      widget.checked = !! JSON.parse(data).on;
    });
  });
  div.appendChild(widget);
  var handlerdiv = document.createElement('div');
  handlerdiv.setAttribute('class', 'ui-switch-handler');
  div.appendChild(handlerdiv);
  li.appendChild(div);
  return li;
};

app.createOnOffSwitchView = function(li, model)
{
  var self = this;
  li.setAttribute('class', 'ui-li-static ui-li-1line-btn1');
  var div = document.createElement('div');
  div.setAttribute('class', 'ui-btn.ui-btn-box-s ui-toggle-container');

  var widget = li.local.widget = document.createElement('input');
  widget.setAttribute('type', 'checkbox');
  //TODO: widget.tau = tau.widget.ToggleSwitch(widget);
  widget.setAttribute('class','ui-toggle-switch');
  widget.setAttribute('data-tau-built', "ToggleSwitch");
  widget.setAttribute('data-tau-name', "ToggleSwitch");
  widget.setAttribute('aria-disabled', "false");
  widget.setAttribute('data-tau-bound', "ToggleSwitch");
  var endpoint = model.properties.on.href;
  widget.local = {};
  widget.addEventListener('click', function(){
    widget.disabled  = true;
    var wanted = (this.checked);
    widget.local.interval = setTimeout(function(){
      widget.disabled = false;
    }, 1000);
 
    self.log('wanted: ' + wanted);
    self.put(endpoint, { on: wanted }, function(res, data) {
      self.checked  = !! (JSON.parse(data).on)
      clearInterval(widget.local.interval);
      widget.disabled = false;
    });
  });
  div.appendChild(widget);
  var handlerdiv = document.createElement('div');
  handlerdiv.setAttribute('class', 'ui-switch-handler');
  div.appendChild(handlerdiv);
  li.appendChild(div);
  return li;
};

app.createMultiLevelSensorView = function(li, model)
{
  var self = this;
  var widget = li.local.widget = document.createElement('button');
  //widget.tau = tau.widget.Button(widget); //TODO
  widget.setAttribute('class','ui-btn ui-inline');
  widget.setAttribute('data-tau-built', "Button");
  widget.setAttribute('data-tau-name', "Button");
  widget.setAttribute('aria-disabled', "false");
  widget.setAttribute('data-tau-bound', "Button");
  widget.innerText = "?";
  widget.local = {};
  widget.addEventListener('click', function(){
    widget.local.interval = setTimeout(function(){
      if (widget.disabled) {
        self.put(model.properties.on.href, { on: true }, function(err, data) {
          data = JSON.parse(data);
          widget.disabled = false;
          widget.innerText = (data.on) ? "ON" : "OFF";
        });
      }
      widget.disabled = false;
    }, 2000);

    widget.disabled = true;
    self.get(model.properties.on.href, function(err, data) {
      data = JSON.parse(data);
      if (!data.on) {
        widget.innerText = "OFF";
      } else {
        self.get(model.properties.level.href, function(err, data) {
          data = JSON.parse(data);
          clearInterval(widget.local.interval);
          widget.disabled = false;
          widget.innerText = (data) ? data.level : "?";
        });
      }
    });
  });
  li.setAttribute('class', 'ui-li-static ui-li-1line-btn1');
  var div = document.createElement('div');
  div.setAttribute('class', 'ui-btn.ui-btn-box-s ui-toggle-container');
  div.appendChild(widget);
  li.appendChild(div);
  return li;
};

app.createView = function(model)
{
  var li = document.createElement('li');
  li.tau = tau.widget.Listview(li);
  li.value = model.name;
  li.innerText = model.name;
  li.local = {};
  li.local.model = model;

  model.local = {};
  if (model.type === "binarySensor") {
    model.local.view = this.createBinarySensorView(li, model);
  } else if (model.type === "onOffSwitch" || model.type === "dimmableColorLight") {
    model.local.view = this.createOnOffSwitchView(li, model);
  } else if (model.type == "multiLevelSensor") {
    model.local.view = this.createMultiLevelSensorView(li, model);
  } else {
    li.setAttribute('class', 'ui-li-static');
    this.log("TODO: implement " + model.type);
  }
  return li;
};

app.query = function(url)
{
  var self = this;
  url = (url) || window.form.url.value;
  this.log("query: " + url);
  this.get("/things", function(err, data) {
    if (err || !data) throw err;
    var items = data && JSON.parse(data) || [];
    var list = document.getElementById('items');
    list.innerHTML = "";  // Clean list
    var listWidget;
    for (var index=0; index < items.length; index++) {
      var model = items[index];
      var view = self.createView(model);
      self.updateView(model, view);
      list.appendChild(view);
      listWidget = tau.widget.Listview(list);
      listWidget.refresh();
    };
  });
};

app.request = function(base_url)
{
  var self = this;
  this.log("request: " + base_url);
  if (localStorage['token'] && localStorage['token'].length) {
    return self.query();
  }
  if (!base_url) throw "URL needed";
  var url = base_url;
  url += '/oauth/authorize' + '?';
  url += '&client_id=' + localStorage['client_id'];
  url += '&scope=' + '/things:readwrite';
  url += '&response_type=code';
  if (!window.location.hostname) {
    return this.browse(url, function(){
      self.query();
    });
  } else {
    var wurl = new URL(window.location);
    var searchParams = new URLSearchParams(wurl.search);
    var code = searchParams.get('code');
    let isCallback = (localStorage['state'] === 'callback' );
    console.log("isCallback" + isCallback);
    if (!code && !isCallback) {
      this.log( url );
      url += '&redirect_uri=' + encodeURIComponent(document.location);
      localStorage['state'] = 'callback';
      setTimeout(function(){
        window.location = url;
      }, 500);
    } else if (code && isCallback) {
      localStorage['state'] = 'token';
      var url = base_url + "/oauth/token" ;
      var params = {
        code: code,
        grant_type: 'authorization_code',
        client_id: localStorage['client_id'],
      };
      var request = new XMLHttpRequest();
      request.onreadystatechange = function() {
        if(request.readyState == 4 && request.status == 200) {
          localStorage['token'] = JSON.parse(request.responseText).access_token;
          var pos = window.location.href.indexOf("?");
          if (pos) {
            var loc = window.location.href.substring(0, pos);
            window.history.replaceState({}, document.title, loc);
          }
          self.query();
        }
      }
      request.open('POST', url, true);
      request.setRequestHeader('Content-type', 'application/json');
      request.setRequestHeader('Accept', 'application/json');
      request.setRequestHeader('Authorization', 'Basic '
                               +  window.btoa(localStorage['client_id']
                                              + ":" + localStorage['secret']));
      request.send(JSON.stringify(params));
    } else {
      localStorage['state'] = 'disconnected';
    }
  }
};

app.main = function()
{
  app.log("main: " + localStorage['state']);
  app.log("main: " + window.location.hostname);
  // TODO: OAuth update ids here, URLs using file:// will copy from default
  if (!localStorage['client_id'] || !localStorage['secret'] ) {
    if (!window.location.hostname) {
      localStorage['client_id'] = "local-token";
      localStorage['secret'] = "super secret";
    } else {
      //TODO: add GUI to overide default creds:
      localStorage['client_id'] = window.location.hostname;
      localStorage['secret'] = window.location.hostname;
    }
  }
  try {
    if (!localStorage['token']) {
      app.request(localStorage['url']);
    } else {
      app.query();
    }
  } catch(err) {
    this.log(err);
  }
};

window.onload = function() {

  var runButton = document.getElementById('run');
  runButton.addEventListener('click', function() {
    app.main();
  });

  var resetButton = document.getElementById('reset');
  resetButton.addEventListener('click', function() {
    document.form.url.value = '';
    document.form.token.value = '';
    localStorage.clear();
    app.log('token forgotten (need auth again)');
  });

  var aboutButton = document.getElementById('about');
  aboutButton.addEventListener('click', function() {
    window.open('README.md');
  });

  var urlInput = document.getElementById('url');
  if ( localStorage['url'] && localStorage['url'].length ) {
    window.form.url.value = localStorage['url']
  } else {
    window.form.value="http://gateway.local:8080";
  }
  urlInput.addEventListener('change', function() {
    this.value = this.value.replace(/\/$/, "");
    localStorage['url'] = this.value;
  });

  var tokenInput = document.getElementById('token');
  if ( localStorage['token'] && localStorage['token'].length ) {
    window.form.token.value = localStorage['token']
  }
  tokenInput.addEventListener('change', function() {
    this.value = this.value.replace(/\/$/, "");
    localStorage['token'] = this.value;
  });

  // add eventListener for tizenhwkey
  document.addEventListener('tizenhwkey', function(e) {
    if (e.keyName === "back") {
      try {
        tizen.application.getCurrentApplication().exit();
      } catch (ignore) {}
    }
  });

  // PWA
  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.register('service-worker.js').then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
    } catch(e) {
      console.log(e.message);
    }
  }

  // Autoconnect
  // TODO add settings page to disable (for debuging)
  app.main();
};

})();

