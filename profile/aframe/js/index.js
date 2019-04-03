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

// maybe removed
viewer.startUpdateProperty = function(model, name, view) {
  if (model) {
    return;
  } // TODO
  const property = model.properties[name];
  const endpoint = property.links[0].href;
  const type = property.type;
  const el = view.children[0];
  app.get(endpoint, function(err, data) {
    if (!err) {
      let text = view.getAttribute('text', 'value').value;
      text = `\n${text}\n${data})`;
      view.setAttribute('text', 'value', text);
      let value = JSON.parse(data)[name];

      switch (type) {
        case 'boolean':
          try {
            value = (value) ? 1 : 0;
            el.setAttribute('ui-toggle', 'value', value);
          // el.emit('change', {value: value});
          } catch (e) {
            console.error(`error: ${e}`);
          }
          break;

        case 'number':
        case 'integer':
          el.setAttribute('ui-slider', 'value', value);
          break;

        case 'string':
          this.log(data);
          if (semType === 'ColorProperty' || name === 'color') { // TODO
            el.setAttribute('ui-button', 'color', value);
          } else {
            el.setAttribute('ui-rotary', 'value', value.length);
          }
          break;
        default:
          self.log('TODO:');
      }
    }
  });
};


// TO relocate a-frame-io-widget.js ?
viewer.createPropertyElement = function(model, name) {
  const that = this;
  const property = model.properties[name];
  const type = property.type;
  const semType = property['@type'];
  let el = null;
  const endpoint = `${model.links[0].href}/${name}`;
  const view = document.createElement('a-text');
  const suffix = (property.title) ? `:\n(${property.title})` : '';
  view.setAttribute('value',
                    `\n${model.name}${suffix}`);
  view.setAttribute('color',
                    (property.readOnly) ? '#FFA0A0' : '#A0FFA0');
  view.setAttribute('width', 1);
  view.setAttribute('align', 'center');
  const id = `${this.count++}`;
  that.log(`createPropertyElement: ${type}/${semType}`);
  switch (type) {
    case 'boolean':
      el = document.createElement('a-entity');
      el.setAttribute('rotation', '90 0 0');
      el.setAttribute('scale', '.8 .8 .8');
      el.setAttribute('ui-toggle', 'value', 0);
      break;
    case 'number':
    case 'integer':
      el = document.createElement('a-entity');
      el.setAttribute('rotation', '90 0 0');
      el.setAttribute('scale', '.8 .8 .8');
      el.setAttribute('ui-slider', 'value', 0);
      el.setAttribute('ui-slider', 'min', 0);
      el.setAttribute('ui-slider', 'max', 100); // TODO
      break;
    case 'string':
      if (semType === 'ColorProperty' || name === 'color') { // TODO
        el = document.createElement('a-entity');
        el.setAttribute('ui-button', 'size', '0.1');
        el.setAttribute('rotation', '90 0 0');
        el.setAttribute('scale', '.8 .8 .8');
      } else {
        el = document.createElement('a-entity');
        el.setAttribute('ui-rotary', 'value', 0); // TODO: updateSchema
        el.setAttribute('rotation', '90 0 0');
        el.setAttribute('scale', '.8 .8 .8');
      }
      break;
    default:
      that.log(`TODO: ${type}`);
      el = document.createElement('a-box');
      el.setAttribute('scale', '.2 .2 .2');
      el.setAttribute('radius', '0.1');
      el.setAttribute('color', '#BADC0D');
  }
  el.setAttribute('position', '0 0.2 0');
  el.setAttribute('id', `widget-${id}`);
  el.addEventListener('change', function(e) {
    if (e.detail && !property.readOnly) {
      const payload = {};
      payload[name] = !!(e.detail.value !== 0);
      app.put(endpoint, payload, function(res, data) {
        if (res) {
          console.error(data);
        }
      });
    } else {
      that.startUpdateProperty(model, name, view);
    }
  });
  view.setAttribute('id', `view-${id}`);
  view.appendChild(el);

  return view;
};


viewer.updateThingView = function(err, data, model) {
  if (err) {
    throw err;
  }
  this.log(`updateThingView: ${data}`);
  this.log(data);
  this.log(model);
  for (const name in data) {
    const type = model.properties[name].type;
    const semType = model.properties[name]['@type'];
    const el = model.local[name].view.children[0];
    this.log(`updateThingView/prop/${name}:${type}`);
    switch (type) { // TODO: mapping design pattern
      case 'boolean':
        el.setAttribute('ui-toggle', 'value', data[name] ? 1 : 0);
        break;
      case 'number':
      case 'integer':
        this.log(`// TODO update in widget${data[name]}`);
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
        this.log(`TODO: callback: ${name} : ${type}`);
    }
  }
};


viewer.appendThing = function(model) {
  const that = viewer;
  const view = null;
  let propertyName = null;
  // that.log(`appendThing: ${model.type}`);
  // that.log(model);
  model.local = {};
  for (propertyName in model.properties) {
    const el = this.createPropertyElement(model, propertyName);
    try {
      el.emit('change');
    } catch (err) {
      console.error(`ignore: ${err}`);
    }
    el.object3D.rotateY(that.rotation[1]);
    el.object3D.rotateX(that.rotation[0]);
    const step = 8;
    el.object3D.translateZ(-4);
    this.rotation[1] += (2 * Math.PI / step) / Math.cos(that.rotation[0]);

    if (this.rotation[1] >= 2 * Math.PI) {
      that.rotation[1] = 2 * Math.PI - that.rotation[1];
      that.rotation[0] += 2 * Math.PI / 2 / 2 / step;
      // TODO : bottom
    }
    if (Math.abs(that.rotation[0]) >=
        Math.ceil(2 * Math.PI / 2 / 2 / step) * step) {
      this.rotation[0] = 0;
    }
    el.setAttribute('scale', '2 2 2');

    this.root.appendChild(el);
    model.local[propertyName] = {view: el};
  }

  app.poll(model, function(err, data) {
    that.updateThingView(err, data, model);
  });
  app.listenThing(model, function(err, data) {
    that.updateThingView(err, data, model);
  });

  return view;
};


viewer.handleResponse = function(err, data) {
  // this.log(`handleResponse: ${typeof data}`);
  if (err || !data) {
    console.error(err);
    throw err;
  }
  let model = data;

  if (typeof data === 'string' && data) {
    model = data && JSON.parse(data);
  }
  if (Array.isArray(model)) {
    let index;
    for (index = 0; index < model.length; index++) {
      viewer.handleResponse(err, model[index]);
    }
  } else {
    this.appendThing(model);
  }
};


viewer.query = function(endpoint) {
  if (!endpoint) {
    endpoint = localStorage.endpoint;
  }
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
