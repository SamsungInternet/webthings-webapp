// -*- mode: js; js-indent-level:2; -*-
// SPDX-License-Identifier: MPL-2.0
/* Copyright 2018-present Samsung Electronics France
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/
 */
(function() {
  // 'use strict';
  const viewer = app.viewer;
  viewer.count = 0;


  viewer.log = !console.log || function(text) {
    if (!app.devel) {
      return;
    }
    console.log(text);
  };


  viewer.createBinaryView = function(li, property, name) {
    this.log(`createBinaryView:`);
    this.log(property);
    li.setAttribute('class', 'ui-li-static ui-li-1line-btn1');
    const div = document.createElement('div');
    div.setAttribute('class', 'ui-btn.ui-btn-box-s ui-toggle-container');

    const widget = li.local.widget = document.createElement('input');
    widget.setAttribute('type', 'checkbox');
    // TODO: widget.tau = tau.widget.ToggleSwitch(radio);
    widget.setAttribute('class', 'ui-toggle-switch');
    widget.setAttribute('data-tau-built', 'ToggleSwitch');
    widget.setAttribute('data-tau-name', 'ToggleSwitch');
    widget.setAttribute('aria-disabled', 'false');
    widget.setAttribute('data-tau-bound', 'ToggleSwitch');
    const endpoint = property.links[0].href;

    widget.addEventListener('click', function() {
      if (!property.readOnly) {
        const payload = {};
        payload[name] = !!(widget.checked);
        app.put(endpoint, payload, function(res, data) {
          if (res) {
            console.error(data);
          }
        });
      }
    });

    div.appendChild(widget);
    const handlerdiv = document.createElement('div');
    handlerdiv.setAttribute('class', 'ui-switch-handler');
    div.appendChild(handlerdiv);
    li.appendChild(div);
    return li;
  };


  viewer.createNumberView = function(li, property) {
    const widget = li.local.widget = document.createElement('button');
    if (property.readOnly) {
      widget.disable();
    }
    // widget.tau = tau.widget.Button(widget); //TODO
    widget.setAttribute('class', 'ui-btn ui-inline');
    widget.setAttribute('data-tau-built', 'Button');
    widget.setAttribute('data-tau-name', 'Button');
    widget.setAttribute('aria-disabled', 'false');
    widget.setAttribute('data-tau-bound', 'Button');
    widget.innerText = '?';
    widget.local = {};

    li.setAttribute('class', 'ui-li-static ui-li-1line-btn1');
    const div = document.createElement('div');
    div.setAttribute('class', 'ui-btn.ui-btn-box-s ui-toggle-container');
    div.appendChild(widget);
    li.appendChild(div);

    return li;
  };


  viewer.createPropertyView = function(model, name) {
    const that = this;
    const property = model.properties[name];
    const type = property.type;
    const semType = property['@type'];
    const view = document.createElement('li');
    view.tau = tau.widget.Listview(view);
    view.value = property.title;
    view.innerText = `${model.name}/${property.title}`;
    view.local = {};
    view.local.model = property;

    property.local = {};
    switch (property.type) { // TODO: mapping design pattern
      case 'boolean':
        property.local.view = that.createBinaryView(view, property, name);
        break;
      case 'number':
        property.local.view = that.createNumberView(view, property);
        break;
      default:
        view.setAttribute('class', 'ui-li-static');
    }
    const id = `${this.count++}`;
    that.log(`createPropertyElement: ${type}/${semType}`);
    view.setAttribute('id', `view-${id}`);

    return view;
  };

  viewer.updateThingView = function(err, data, model) {
    if (err) {
      throw err;
    }
    for (const name in data) {
      const type = model.properties[name].type;
      const semType = model.properties[name]['@type'];
      const el = model.local[name].view;
      // this.log(`// TODO: mapping design pattern:/prop/${name}:${type}`);
      let widget;
      switch (type) {
        case 'boolean':
          widget = el.getElementsByClassName('ui-toggle-switch')[0];
          widget.checked = !!(data[name]);
          break;
        case 'number':
        case 'integer':
          widget = el.getElementsByClassName('ui-btn ui-inline')[0];
          widget.innerText = data[name];
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
    const that = this;
    const view = null;
    let propertyName = null;
    that.log(`appendThing: ${model.type}`);
    this.root = document.getElementById('items');
    model.local = {};
    for (propertyName in model.properties) {
      try {
        const el = this.createPropertyView(model, propertyName);
        this.root.appendChild(el);
        model.local[propertyName] = {view: el};
      } catch (err) {
        console.error(`ignore: ${err}`);
      }
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
    const that = viewer;
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
        that.handleResponse(err, model[index]);
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
  viewer.start();
})();


