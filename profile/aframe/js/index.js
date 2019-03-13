// -*- mode: js; js-indent-level:2; -*-
// SPDX-License-Identifier: MPL-2.0
/* Copyright 2019-present Samsung Electronics France
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/
 */

const viewer = app.viewer;

viewer.count = 0;

viewer.rotation = [ 0, 0, 0];

viewer.verbose = !console.log || function(text) {
  console.log(text);
  let value = 0;
  if (this.log && app.debug) {
    value = this.log.getAttribute('text', value).value || '';
    value = `${value}\n${text}`;
    this.log.setAttribute('text', 'value', value);
  }
};

// TODO relocate
viewer.poll = function(thing, callback) {
  const self = this;
  const url = `${localStorage.url + thing.href}/properties`;
  self.verbose(`fetch: ${url}`);
  fetch(url,
        {headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.token}`,
        }}
  )
    .then(function(response) {
      self.verbose(`recieved:`);
      return response.json();
    })
    .then(function(json) {
      self.verbose(`parsed: ${json}`);
      self.verbose(json);
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
      self.verbose(`stopping: ${app.pause}`);
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
      self.verbose(wsUrl);
      self.verbose(evt);
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
          self.verbose(`error: ${e}`);
        }
        callback((data == null), data);
      }
    };
  } else {
    self.startPoll(thing, callback);
  }
};


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
  self.verbose(`createPropertyElement: ${type}/${semType}`);
  switch (type) {
    case 'boolean':
      el = document.createElement('a-entity');
      el.setAttribute('rotation', '90 0 0');
      el.setAttribute('ui-toggle', 'value', 0);
      break;
    case 'number':
    case 'integer':
      el = document.createElement('a-entity');
      el.setAttribute('rotation', '90 0 0');
      el.setAttribute('ui-slider', 'value', 0);
      el.setAttribute('ui-slider', 'min', 0);
      el.setAttribute('ui-slider', 'max', 100); // TODO
      break;
    case 'string':
      if (semType === 'ColorProperty' || name === 'color') { // TODO
        el = document.createElement('a-sphere');
        el.setAttribute('color', '#FF0000');
        el.setAttribute('radius', '0.1');
      } else {
        self.verbose(model);
        el = document.createElement('a-box');
        el.setAttribute('color', '#00FF00');
        el.setAttribute('scale', '.1 .1 .1');
      }
      break;
    default:
      self.verbose(`TODO: ${type}`);
      el = document.createElement('a-octahedron');
      el.setAttribute('color', '#FF0000');
      el.setAttribute('radius', '0.1');
  }
  el.setAttribute('position', '0 0.2 0');
  el.setAttribute('id', `widget-${id}`);
  el.addEventListener('change', function(e) {
    if (e.detail) {
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
          view.setAttribute('text', 'value',
                            `${view.getAttribute('text', 'value').value
                            }\n${t}\n${data})`);
          break;
        default:
          self.verbose('TODO:');
      }
    }
  });
};


viewer.updateThingView = function(err, data, model) {
  const self = this;
  if (err) {
    throw err;
  }
  self.verbose('updateThingView');
  self.verbose(model);
  for (const name in data) {
    self.verbose('updateThingView/prop/${name}');
    const type = model.properties[name].type;
    const el = model.local[name].view.children[0];
    switch (type) { // TODO: mapping design pattern
      case 'boolean':
        el.setAttribute('ui-toggle', 'value', data[name] ? 1 : 0);
        break;
      case 'number':
      case 'integer':
        // TODO update in widget
        el.setAttribute('ui-slider', 'value', data[name]);
        break;
      case 'string':
        el.setAttribute(name, data[name]); // TODO
        break;
      default:
        self.verbose(`TODO: callback: ${name} : ${type}`);
    }
  }
};


viewer.appendThing = function(model) {
  const self = this;
  const view = null;
  let propertyName = null;
  // this.verbose(`appendThing: ${model.type}`);
  // this.verbose(model);
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
    el.object3D.translateY(1.8);
    const step = 9;
    el.object3D.translateZ(-2);
    this.rotation[1] += (2 * Math.PI / step) / Math.cos(this.rotation[0]);

    if (this.rotation[1] >= 2 * Math.PI) {
      this.rotation[1] = 0;
      this.rotation[0] += 2 * Math.PI / 2 / 2 / step;
      // TODO : bottom
    }
    if (Math.abs(this.rotation[0]) >=
        Math.ceil(2 * Math.PI / 2 / 2 / step) * step) {
      this.rotation[0] = 0;
    }
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
  // self.verbose(`handleResponse: ${typeof data}`);
  if (err || !data) {
    console.error(err);
    throw err;
  }
  let model = data;

  if (typeof data === 'string' && data) {
    model = data && JSON.parse(data);
  }
  // self.verbose(JSON.stringify(model));
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
  // this.verbose(`log: query: ${endpoint}`);
  app.get(endpoint, viewer.handleResponse);
};


viewer.start = function() {
  this.verbose(`start: ${localStorage.url}`);
  if (!localStorage.url) {
    console.warn('Gateway token unset');
    window.location = 'index.html';
  } else {
    this.query();
  }
};
