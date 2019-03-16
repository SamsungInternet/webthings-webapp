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

// TODO relocate
viewer.poll = function(thing, callback) {
  const self = this;
  const url = `${localStorage.url + thing.href}/properties`;
  self.log(`fetch: ${url}`);
  fetch(url,
        {headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.token}`,
        }}
  )
    .then(function(response) {
      self.log(`recieved:`);
      return response.json();
    })
    .then(function(json) {
      self.log(`parsed: ${json}`);
      self.log(json);
      if (callback) {
        callback((json === null), json);
      }
    });
};

// TODO relocate
viewer.startPoll = function(thing, callback, delay) {
  const self = this;
  if (!delay) {
    delay = 1000;
  }
  interval = setInterval(function() {
    if (app.pause) {
      self.log(`stopping: ${app.pause}`);
      inverval = clearInterval(interval);
    }
    self.poll(thing, callback);
  }, delay);
};


// TODO relocate
viewer.listenThing = function(thing, callback) {
  const self = this;
  const useWebsockets = true;
  let wsUrl = thing.links[thing.links.length - 1].href;
  wsUrl += `?jwt=${localStorage.token}`;
  let ws = null;
  // console.log(wsUrl);
  if (useWebsockets) {
    ws = new WebSocket(wsUrl);
    ws.onclose = function(evt) {
      self.log(wsUrl);
      self.log(evt);
      // CLOSE_ABNORMAL
      if (evt.code === 1006) {
        self.startPoll(thing, callback);
      }
    };
    ws.onmessage = function(evt) {
      if (app.pause) {
        ws.close();
      }
      if (callback) {
        let data = null;
        try {
          data = JSON.parse(evt.data).data;
        } catch (e) {
          self.log(`error: ${e}`);
        }
        callback((data == null), data);
      }
    };
  } else {
    self.startPoll(thing, callback);
  }
};

// TO relocate a-frame-io-widget.js ?
viewer.createPropertyElement = function(model, name) {
  const self = this;
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
  self.log(`createPropertyElement: ${type}/${semType}`);
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
      self.log(`TODO: ${type}`);
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
        if (!res) {
          console.error(data);
        }
      });
    } else {
      self.startUpdateProperty(model, name, view);
    }
  });
  view.setAttribute('id', `view-${id}`);
  view.appendChild(el);

  return view;
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
