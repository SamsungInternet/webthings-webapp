// -*- mode: js; js-indent-level:2; -*-
// SPDX-License-Identifier: MPL-2.0
/* Copyright 2019-present Samsung Electronics France
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/
 */

const viewer = app.viewer;
app.viewerUrl = 'aframe.html'; // TODO
viewer.count = 0;

viewer.rotation = [ 0, 0, 0];
viewer.log = !console.log || function(text) {
  if (!app.devel) {
    return;
  }
  console.log(text);
  let value = 0;
  if (this.log && app.devel) {
    const el = document.getElementById('console');
    if (el.getAttribute('text')) {
      value = el.getAttribute('text').value || '';
    }
    if (value.length > 1024) {
      value = '(...)\n';
    }
    value = `${text}\n${value}`;
    el.setAttribute('text', 'value', value);
  }
};


viewer.updateThingView = function(err, data, model) {
  const self = this;
  if (err) {
    throw err;
  }
  self.log(`updateThingView: ${data}`);
  self.log(data);
  self.log(model);
  for (const name in data) {
    const type = model.properties[name].type;
    const semType = model.properties[name]['@type'];
    const el = model.local[name].view.children[0];
    self.log(`updateThingView/prop/${name}:${type}`);
    switch (type) { // TODO: mapping design pattern
      case 'boolean':
        el.setAttribute('ui-toggle', 'value', data[name] ? 1 : 0);
        break;
      case 'number':
      case 'integer':
        self.log(`// TODO update in widget${data[name]}`);
        el.setAttribute('ui-slider', 'value', data[name]);
        break;
      case 'string':
        if (semType === 'ColorProperty' || name === 'color') { // TODO
          el.setAttribute('ui-button', 'baseColor', data[name]);
        } else {
          el.setAttribute('ui-rotary', 'value', data[name].length);
        }
        break;
      default:
        self.log(`TODO: callback: ${name} : ${type}`);
    }
  }
};


viewer.appendThing = function(model) {
  const self = this;
  const view = null;
  let propertyName = null;
  // this.log(`appendThing: ${model.type}`);
  // this.log(model);
  model.local = {};
  for (propertyName in model.properties) {
    const el = this.createPropertyElement(model, propertyName);
    try {
      el.emit('change');
    } catch (err) {
      console.error(`ignore: ${err}`);
    }
    el.object3D.rotateY(this.rotation[1]);
    el.object3D.rotateX(this.rotation[0]);
    const step = 8;
    el.object3D.translateZ(-4);
    this.rotation[1] += (2 * Math.PI / step) / Math.cos(this.rotation[0]);

    if (this.rotation[1] >= 2 * Math.PI) {
      this.rotation[1] = 2 * Math.PI - this.rotation[1];
      this.rotation[0] += 2 * Math.PI / 2 / 2 / step;
      // TODO : bottom
    }
    if (Math.abs(this.rotation[0]) >=
        Math.ceil(2 * Math.PI / 2 / 2 / step) * step) {
      this.rotation[0] = 0;
    }
    el.setAttribute('scale', '2 2 2');

    this.root.appendChild(el);
    model.local[propertyName] = {view: el};
  }

  this.poll(model, function(err, data) {
    self.updateThingView(err, data, model);
  });
  this.listenThing(model, function(err, data) {
    self.updateThingView(err, data, model);
  });

  return view;
};


viewer.handleResponse = function(err, data) {
  const self = viewer;
  // self.log(`handleResponse: ${typeof data}`);
  if (err || !data) {
    console.error(err);
    throw err;
  }
  let model = data;

  if (typeof data === 'string' && data) {
    model = data && JSON.parse(data);
  }
  // self.log(JSON.stringify(model));
  if (Array.isArray(model)) {
    let index;
    for (index = 0; index < model.length; index++) {
      viewer.handleResponse(err, model[index]);
    }
  } else {
    self.appendThing(model);
  }
};


viewer.query = function(endpoint) {
  if (!endpoint) {
    endpoint = localStorage.endpoint;
  }
  // this.log(`log: query: ${endpoint}`);
  app.get(endpoint, viewer.handleResponse);
};


viewer.start = function() {
  this.log(`start: ${localStorage.url}`);
  if (!localStorage.url) {
    console.warn('Gateway token unset');
    window.location = app.loginUrl;
  } else {
    this.query();
  }
};
