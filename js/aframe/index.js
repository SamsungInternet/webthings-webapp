// -*- mode: js; js-indent-level:2; -*-
// SPDX-License-Identifier: MPL-2.0
/* Copyright 2019-present Samsung Electronics France
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/
 */

var viewer = {};
viewer.y = 0;

viewer.createViewUnknown = function(model)
{
  let view;
  //viewer.el.setAttribute('text', 'value', value);

  // https://github.com/gmarty/aframe-ui-components
  // https://github.com/caseyyee/aframe-ui-widgets
  // https://github.com/rdub80/aframe-gui
  var newEl = document.createElement( "a-sphere" );
  newEl.setAttribute( "position", "0 " + ( viewer.y += 0.3 ) + " 0" );
  newEl.setAttribute( "radius", "0.1" );
  newEl.setAttribute( "color", "lightblue" );
  var readwrite = true; // for now fixed
  if ( readwrite ){
    var halo = document.createElement( "a-sphere" );
    halo.setAttribute( "radius", "0.11" );
    halo.setAttribute( "opacity", 0.2 );
    newEl.appendChild( halo );
  }
  var nameEl = document.createElement( "a-entity" );
  nameEl.setAttribute( "text", "value", `\n${model.name} (${model.type})` );
  nameEl.setAttribute( "position", "0.7 0 0" );
  newEl.appendChild( nameEl );
  viewer.el.appendChild( newEl );

  return view;
}

viewer.createViewOnOffSwitch = function (model)
{
  // TODO: implement this
  return viewer.createViewUnknown(model);
}

viewer.createViewMultilevelSensor = function (model)
{
  // TODO: implement this
  return viewer.createViewUnknown(model);
}

viewer.createView = function(model)
{
  var view;
  console.log(model.type);
  if (model.type === "onOffSwitch"
      || model.type === "dimmableColorLight") {
    return this.createViewOnOffSwitch(model);
  } else if (model.type === "multilevelSensor") {
    return this.createViewMultilevelSensor(model);
  } else {
    return this.createViewUnknown(model);
  }
}

viewer.query = function(url, token)
{
  let self = this;
  app.get(url, token, function(err, data) {
    let items = data && JSON.parse(data) || [];
    let index;
    for (index=0; index < items.length; index++) {
      let model = items[index];
      model.local = {};
      model.local.view = self.createView(model);
    };
  });
}

