/*! MapStick (backbone-mapstick) - v0.1.0 - 2015-07-22
* Copyright (c) 2015 Mike McIver; Distributed under MIT license */

(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  window.MapStick = function() {
    return {
      extend: Backbone.Model.extend
    };
  };

  MapStick.ChildViewContainer = (function() {
    function ChildViewContainer(views) {
      this._updateLength = bind(this._updateLength, this);
      this.apply = bind(this.apply, this);
      this.call = bind(this.call, this);
      this.remove = bind(this.remove, this);
      this.findByCid = bind(this.findByCid, this);
      this.findByIndex = bind(this.findByIndex, this);
      this.findByCustom = bind(this.findByCustom, this);
      this.findByModelCid = bind(this.findByModelCid, this);
      this.findByModel = bind(this.findByModel, this);
      this.add = bind(this.add, this);
      this._views = {};
      this._indexByModel = {};
      this._indexByCustom = {};
      this._methods = ["forEach", "each", "map", "find", "detect", "filter", "select", "reject", "every", "all", "some", "any", "include", "contains", "invoke", "toArray", "first", "initial", "rest", "last", "without", "isEmpty", "pluck"];
      _.each(this._methods, (function(_this) {
        return function(method) {
          return _this[method] = function() {
            var args;
            views = _.values(_this._views);
            args = [views].concat(_.toArray(arguments));
            return _[method].apply(_, args);
          };
        };
      })(this));
      this._updateLength();
      _.each(views, this.add);
    }

    ChildViewContainer.prototype.add = function(view, customIndex) {
      var model, viewCid;
      viewCid = view.cid;
      this._views[viewCid] = view;
      if (model = view.model) {
        this._indexByModel[model.cid] = viewCid;
      }
      if (customIndex) {
        this._indexByCustom[customIndex] = viewCid;
      }
      this._updateLength();
      return this;
    };

    ChildViewContainer.prototype.findByModel = function(model) {
      return this.findByModelCid(model.cid);
    };

    ChildViewContainer.prototype.findByModelCid = function(modelCid) {
      var viewCid;
      viewCid = this._indexByModel[modelCid];
      return this.findByCid(viewCid);
    };

    ChildViewContainer.prototype.findByCustom = function(index) {
      var viewCid;
      viewCid = this._indexByCustom[index];
      return this.findByCid(viewCid);
    };

    ChildViewContainer.prototype.findByIndex = function(index) {
      return _.values(this._views)[index];
    };

    ChildViewContainer.prototype.findByCid = function(cid) {
      return this._views[cid];
    };

    ChildViewContainer.prototype.remove = function(view) {
      var viewCid;
      viewCid = view.cid;
      if (view.model) {
        delete this._indexByModel[view.model.cid];
      }
      _.any(this._indexByCustom, (function(_this) {
        return function(cid, key) {
          if (cid === viewCid) {
            delete _this._indexByCustom[key];
            return true;
          }
        };
      })(this), this);
      delete this._views[viewCid];
      this._updateLength();
      return this;
    };

    ChildViewContainer.prototype.call = function(method) {
      return this.apply(method, _.tail(arguments));
    };

    ChildViewContainer.prototype.apply = function(method, args) {
      return _.each(this._views, (function(_this) {
        return function(view) {
          if (_.isFunction(view[method])) {
            return view[method].apply(view, args || []);
          }
        };
      })(this));
    };

    ChildViewContainer.prototype._updateLength = function() {
      return this.length = _.size(this._views);
    };

    return ChildViewContainer;

  })();

  MapStick.getOption = function(target, optionName) {
    if (!target || !optionName) {
      return null;
    } else if (target.options && (indexOf.call(target.options, optionName) >= 0) && (target.options[optionName] !== void 0)) {
      return target.options[optionName];
    } else {
      return target[optionName];
    }
  };

  MapStick.triggerMethod = function() {
    var getEventName, splitter, triggerMethod;
    splitter = /(^|:)(\w)/gi;
    getEventName = function(match, prefix, eventName) {
      return eventName.toUpperCase();
    };
    triggerMethod = (function(_this) {
      return function(event) {
        var method, methodName;
        methodName = 'on' + event.replace(splitter, getEventName);
        method = _this[methodName];
        if (_.isFunction(_this.trigger)) {
          _this.trigger.apply(_this, arguments);
        }
        if (_.isFunction(method)) {
          return method.apply(_this, _.tail(arguments));
        }
      };
    })(this);
    return triggerMethod;
  };

  MapStick.actAsCollection = function(object, listProperty) {
    var methods;
    methods = ['forEach', 'each', 'map', 'find', 'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke', 'toArray', 'first', 'initial', 'rest', 'last', 'without', 'isEmpty', 'pluck'];
    return _.each(methods, (function(_this) {
      return function(method) {
        return object[method] = function() {
          var args, list;
          list = _.values(_.result(_this, listProperty));
          args = [list].concat(_.toArray(arguments));
          return _[method].apply(_, args);
        };
      };
    })(this));
  };

  MapStick.decodePathString = function(string) {
    if (google.maps.geometry) {
      if (string && _.isString(string) && string !== "") {
        return google.maps.geometry.encoding.decodePath(string);
      } else {
        return [];
      }
    } else {
      return console.error("please include google.maps.geometry library");
    }
  };

  MapStick.encodePathString = function(array) {
    if (google.maps.geometry) {
      if (array) {
        return google.maps.geometry.encoding.encodePath(array);
      }
    } else {
      return console.error("please include google.maps.geometry library");
    }
  };

  MapStick.isClockwise = function(path) {
    var l, previous_lat, previous_lng, r;
    if (!_.isArray(path)) {
      path = path.getArray();
    }
    path.push(path[0]);
    l = 0;
    r = 0;
    previous_lat = null;
    previous_lng = null;
    _.each(path, function(latlng) {
      var lat, lng;
      lng = latlng.lng();
      lat = latlng.lat();
      if (previous_lng && previous_lat) {
        l += lng * previous_lat;
        r += lat * previous_lng;
      }
      previous_lng = lng;
      return previous_lat = lat;
    });
    return l - r > 0;
  };

  MapStick.Overlay = (function(superClass) {
    extend(Overlay, superClass);

    Overlay.prototype.googleOverlayType = function() {
      return this.overlayType.split("_").map(function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }).join("");
    };

    Overlay.prototype.googleDrawingOverlayType = function() {
      return google.maps.drawing.OverlayType["" + (this.overlayType.split("_").map(function(string) {
        return string.toUpperCase();
      }).join(""))];
    };

    Overlay.prototype.defaultOptions = {};

    Overlay.prototype.properties = [];

    Overlay.prototype.overlayEvents = {};

    Overlay.prototype.viewOptions = ['model', 'events', 'map'];

    Overlay.prototype.bindings = {};

    Overlay.prototype.defaultOverlayEvents = [];

    Overlay.prototype.modelEvents = {};

    Overlay.prototype.triggerMethod = MapStick.triggerMethod;

    Overlay.prototype.showing = false;

    Overlay.prototype.buildOverlay = function(options) {
      return new google.maps[this.googleOverlayType()](options);
    };

    function Overlay(options) {
      var content_view;
      if (options == null) {
        options = {};
      }
      this.getDrawnOptions = bind(this.getDrawnOptions, this);
      this.abandonOverlay = bind(this.abandonOverlay, this);
      this.saveOverlay = bind(this.saveOverlay, this);
      this.stopDrawing = bind(this.stopDrawing, this);
      this.completeDraw = bind(this.completeDraw, this);
      this.cancelDraw = bind(this.cancelDraw, this);
      this.handleKey = bind(this.handleKey, this);
      this.draw = bind(this.draw, this);
      this.render = bind(this.render, this);
      this.clearListeners = bind(this.clearListeners, this);
      this.remove = bind(this.remove, this);
      this.hide = bind(this.hide, this);
      this.show = bind(this.show, this);
      this.set = bind(this.set, this);
      this.get = bind(this.get, this);
      this.triggerOverlayEvent = bind(this.triggerOverlayEvent, this);
      this.setBoundOverlayAttributes = bind(this.setBoundOverlayAttributes, this);
      this.setBoundModelAttributes = bind(this.setBoundModelAttributes, this);
      this.listenToBoundOverlayEvents = bind(this.listenToBoundOverlayEvents, this);
      this.listenToBoundModelChanges = bind(this.listenToBoundModelChanges, this);
      this.bindPosition = bind(this.bindPosition, this);
      this.setBindings = bind(this.setBindings, this);
      this.listenToModel = bind(this.listenToModel, this);
      this.attachOverlayEvents = bind(this.attachOverlayEvents, this);
      this.buildOverlay = bind(this.buildOverlay, this);
      this.googleDrawingOverlayType = bind(this.googleDrawingOverlayType, this);
      this.googleOverlayType = bind(this.googleOverlayType, this);
      this.cid = _.uniqueId('overlay');
      this.options = _.extend({}, _.result(this, 'options'), _.isFunction(options) ? options.call(this) : options);
      this.overlayOptions = _.pick(options, this.properties);
      _.defaults(this.overlayOptions, this.defaultOptions);
      this[this.overlayType] = this.overlay = this.buildOverlay(this.overlayOptions);
      _.extend(this, _.pick(options, this.viewOptions));
      this.attachOverlayEvents();
      this.listenToModel();
      this.setBindings();
      if (_.isFunction(this.initialize)) {
        this.initialize(this.options);
      }
      this.model.on("destroy", this.remove);
      if (this.overlayType === "info_window") {
        if (content_view = this.options.content_view) {
          this.setContentView(content_view);
        }
      } else {
        this.model.on("draw", this.draw);
      }
    }

    Overlay.prototype.attachOverlayEvents = function() {
      return _.each(this.overlayEventNames, (function(_this) {
        return function(event_name) {
          return google.maps.event.addListener(_this.overlay, event_name, function(e) {
            if (_.isFunction(_this.trigger)) {
              _this.trigger(event_name, e);
            }
            return _this.triggerOverlayEvent(event_name, e);
          });
        };
      })(this));
    };

    Overlay.prototype.listenToModel = function() {
      if (this.model) {
        return _.each(this.modelEvents, (function(_this) {
          return function(function_name, event_name) {
            var method;
            if (_.isFunction(method = _this[function_name])) {
              return _this.model.on(event_name, method);
            }
          };
        })(this));
      }
    };

    Overlay.prototype.setBindings = function() {
      return _.each(this.bindings, (function(_this) {
        return function(opts, overlay_attribute) {
          var model_attributes;
          if (_.isString(opts)) {
            opts = {
              attribute: opts,
              overlayChanged: true
            };
          }
          if (_.isObject(opts)) {
            opts.overlay_attribute = overlay_attribute;
            if (overlay_attribute === "position" && _.isString(opts.lat) && _.isString(opts.lng)) {
              return _this.bindPosition(opts);
            } else if (model_attributes = opts.attributes || opts.attribute) {
              if (_.isString(model_attributes)) {
                opts.attributes = model_attributes = [model_attributes];
              }
              _this.setBoundOverlayAttributes(opts);
              _this.listenToBoundModelChanges(opts);
              if (indexOf.call(_this.twoWayProperties, overlay_attribute) >= 0) {
                return _this.listenToBoundOverlayEvents(opts);
              }
            }
          }
        };
      })(this));
    };

    Overlay.prototype.bindPosition = function(opts) {
      var lat_attr, lng_attr, overlay_events, setLatLng;
      if (opts == null) {
        opts = {};
      }
      lat_attr = opts.lat;
      lng_attr = opts.lng;
      setLatLng = (function(_this) {
        return function() {
          if (_this.model.has(lat_attr) && _this.model.has(lng_attr)) {
            return _this.set({
              position: new google.maps.LatLng(_this.model.get(lat_attr), _this.model.get(lng_attr))
            });
          }
        };
      })(this);
      setLatLng();
      this.model.on("change:" + lat_attr + " change:" + lng_attr, (function(_this) {
        return function(model, value, arg) {
          var m_change;
          m_change = (arg != null ? arg : {}).mapstickChange;
          if (!m_change) {
            return setLatLng();
          }
        };
      })(this));
      overlay_events = opts.overlayEvents || this.defaultOverlayEvents;
      return _.each(overlay_events, (function(_this) {
        return function(event_name) {
          return google.maps.event.addListener(_this.overlay, event_name, function(e) {
            var latlng, pos;
            if (pos = _this.get("position")) {
              latlng = {};
              latlng[lat_attr] = pos.lat();
              latlng[lng_attr] = pos.lng();
              return _this.model.set(latlng, {
                mapstickChange: true
              });
            }
          });
        };
      })(this));
    };

    Overlay.prototype.listenToBoundModelChanges = function(opts) {
      var model_attributes, observers;
      if (opts == null) {
        opts = {};
      }
      model_attributes = opts.attributes;
      observers = model_attributes.map(function(ob) {
        return "change:" + ob;
      }).join(" ");
      return this.model.on(observers, (function(_this) {
        return function(model, value, arg) {
          var m_change;
          m_change = (arg != null ? arg : {}).mapstickChange;
          if (!m_change) {
            return _this.setBoundOverlayAttributes(opts);
          }
        };
      })(this));
    };

    Overlay.prototype.listenToBoundOverlayEvents = function(opts) {
      var events, overlay_attribute;
      if (opts == null) {
        opts = {};
      }
      overlay_attribute = opts.overlay_attribute;
      if (events = opts.overlayEvents) {
        if (_.isString(events)) {
          events = [events];
        }
      }
      if (events == null) {
        events = this.defaultOverlayEvents;
      }
      return _.each(events, (function(_this) {
        return function(event_name) {
          return google.maps.event.addListener(_this.overlay, event_name, function(e) {
            if (event_name === "drawn") {
              if (overlay_attribute === "paths") {
                _this._listenToPaths(opts);
              } else if (overlay_attribute === "path") {
                _this._listenToPath(opts);
              }
            }
            return _this.setBoundModelAttributes(opts, e);
          });
        };
      })(this));
    };

    Overlay.prototype.setBoundModelAttributes = function(opts, e) {
      var data, model_attributes, on_set, overlay_attribute, result;
      if (opts == null) {
        opts = {};
      }
      if (opts.overlayChanged) {
        overlay_attribute = opts.overlay_attribute;
        model_attributes = opts.attributes;
        if (overlay_attribute === "paths") {
          data = this.overlay.getPaths();
        } else if (overlay_attribute === "path") {
          data = this.overlay.getPath();
        } else {
          data = this.get(overlay_attribute);
        }
        result = {};
        on_set = opts.overlayChanged;
        if (_.isFunction(on_set)) {
          result = on_set(data, e);
        } else if (_.isString(on_set) && _.isFunction(this[on_set])) {
          result = this[on_set](data, e);
        } else if (on_set === true && model_attributes.length === 1) {
          result[model_attributes[0]] = data;
        }
        return this.model.set(result, {
          mapstickChange: true
        });
      }
    };

    Overlay.prototype.setBoundOverlayAttributes = function(opts) {
      var model_attributes, model_data, on_get, overlay_attribute, overlay_options, result;
      if (opts == null) {
        opts = {};
      }
      model_attributes = opts.attributes;
      overlay_attribute = opts.overlay_attribute;
      model_data = {};
      _.each(model_attributes, (function(_this) {
        return function(attr) {
          return model_data[attr] = _this.model.get(attr);
        };
      })(this));
      overlay_options = {};
      if (on_get = opts.modelChanged) {
        result = null;
        if (_.isFunction(on_get)) {
          result = on_get(model_data);
        } else if (_.isFunction(this[on_get])) {
          result = this[on_get](model_data);
        }
        overlay_options[overlay_attribute] = result;
      } else if (model_attributes.length === 1) {
        overlay_options[overlay_attribute] = this.model.get(model_attributes[0]);
      }
      this.set(overlay_options);
      if (overlay_attribute === "paths") {
        return this._listenToPaths(opts);
      } else if (overlay_attribute === "path") {
        return this._listenToPath(opts);
      }
    };

    Overlay.prototype.triggerOverlayEvent = function(event_name, e) {
      var event, method;
      if (event = this.overlayEvents[event_name]) {
        method = this[event];
        if (_.isFunction(method)) {
          method(e);
        } else {
          console.error("no such handler for event: '" + event_name + "'");
        }
      }
      method = this["on" + (event_name.split("_").map(function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }).join(""))];
      if (_.isFunction(method)) {
        return method(e);
      }
    };

    Overlay.prototype.get = function(attribute) {
      return this.overlay.get(attribute);
    };

    Overlay.prototype.set = function(attribute, value) {
      if (_.isObject(attribute)) {
        return this.overlay.setOptions(attribute);
      } else if (_.isString(attribute)) {
        return this.overlay.set(attribute, value);
      } else {
        return console.error("can't set that");
      }
    };

    Overlay.prototype.show = function(map) {
      this.showing = true;
      if (map) {
        this.map = map;
      }
      return this.set("map", this.map);
    };

    Overlay.prototype.hide = function() {
      this.showing = false;
      return this.set("map", null);
    };

    Overlay.prototype.remove = function() {
      this.clearListeners();
      return this.set("map", null);
    };

    Overlay.prototype.clearListeners = function() {
      if (this.overlay) {
        return google.maps.event.clearListeners(this.overlay);
      }
    };

    Overlay.prototype.render = function() {
      if (this.showing) {
        return this.overlay.setMap(this.map);
      }
    };

    Overlay.prototype.draw = function(map) {
      if (map == null) {
        map = this.map;
      }
      if (google.maps.drawing) {
        this._cancelled = false;
        if (MapStick.drawingManager == null) {
          MapStick.drawingManager = new google.maps.drawing.DrawingManager({
            map: map,
            drawingControl: false
          });
        }
        MapStick.drawingManager.setMap(map);
        MapStick.drawingManager.setDrawingMode(this.overlayType);
        google.maps.event.clearInstanceListeners(MapStick.drawingManager);
        return google.maps.event.addListener(MapStick.drawingManager, "overlaycomplete", (function(_this) {
          return function(e) {
            if (MapStick.drawingManager.getDrawingMode()) {
              _this.stopDrawing();
            }
            if (_this._cancelled) {
              return _this.abandonOverlay(e.overlay);
            } else {
              return _this.saveOverlay(e.overlay);
            }
          };
        })(this));
      } else {
        return console.error("please include google.maps.drawing library");
      }
    };

    Overlay.prototype.handleKey = function(e) {
      if (e.keyCode === 27) {
        this.cancelDraw();
      }
      if (e.keyCode === 13) {
        return this.completeDraw();
      }
    };

    Overlay.prototype.cancelDraw = function(e) {
      this._cancelled = true;
      return this.stopDrawing();
    };

    Overlay.prototype.completeDraw = function(e) {
      this._cancelled = false;
      return this.stopDrawing();
    };

    Overlay.prototype.stopDrawing = function() {
      if (this._key_listener) {
        google.maps.event.removeListener(this._key_listener);
      }
      MapStick.drawingManager.setDrawingMode(null);
      return MapStick.drawingManager.setMap(null);
    };

    Overlay.prototype.saveOverlay = function(overlay) {
      this.overlay.setOptions(this.getDrawnOptions(overlay));
      this.model.trigger("overlay:drawn");
      google.maps.event.trigger(this.overlay, "drawn");
      overlay.setMap(null);
      return this.show();
    };

    Overlay.prototype.abandonOverlay = function(overlay) {
      this.model.trigger("overlay:cancelled");
      google.maps.event.trigger(this.overlay, "cancelled");
      return overlay.setMap(null);
    };

    Overlay.prototype.getDrawnOptions = function(overlay) {
      return {};
    };

    return Overlay;

  })(Backbone.View);

  MapStick.Marker = (function(superClass) {
    extend(Marker, superClass);

    function Marker() {
      this.getDrawnOptions = bind(this.getDrawnOptions, this);
      return Marker.__super__.constructor.apply(this, arguments);
    }

    Marker.prototype.overlayType = "marker";

    Marker.prototype.overlayEventNames = ["animation_changed", "click", "clickable_changed", "cursor_changed", "dblclick", "drag", "dragend", "draggable_changed", "dragstart", "flat_changed", "icon_changed", "mousedown", "mouseout", "mouseover", "mouseup", "position_changed", "rightclick", "shape_changed", "title_changed", "visible_changed", "zindex_changed"];

    Marker.prototype.defaultOverlayEvents = ["drag", "dragend", "dragstart", "drawn"];

    Marker.prototype.twoWayProperties = ["position"];

    Marker.prototype.properties = ["anchorPoint", "animation", "clickable", "crossOnDrag", "cursor", "draggable", "icon", "map", "opacity", "optimized", "position", "shape", "title", "visible", "zIndex"];

    Marker.prototype.getDrawnOptions = function(overlay) {
      return {
        position: overlay.getPosition()
      };
    };

    return Marker;

  })(MapStick.Overlay);

  MapStick.OverlayWithPath = (function(superClass) {
    extend(OverlayWithPath, superClass);

    function OverlayWithPath() {
      this._listenToPath = bind(this._listenToPath, this);
      this.getDrawnOptions = bind(this.getDrawnOptions, this);
      this.setOverlayPathFromEncodedString = bind(this.setOverlayPathFromEncodedString, this);
      this.getEncodedPathFromOverlay = bind(this.getEncodedPathFromOverlay, this);
      return OverlayWithPath.__super__.constructor.apply(this, arguments);
    }

    OverlayWithPath.prototype.defaultOptions = {
      path: new google.maps.MVCArray
    };

    OverlayWithPath.prototype.getEncodedPathFromOverlay = function() {
      return MapStick.encodePathString(this.overlay.getPath());
    };

    OverlayWithPath.prototype.setOverlayPathFromEncodedString = function(string) {
      return this.overlay.setPath(MapStick.decodePathString(string));
    };

    OverlayWithPath.prototype.getDrawnOptions = function(overlay) {
      return {
        path: overlay.getPath()
      };
    };

    OverlayWithPath.prototype._listenToPath = function(opts) {
      var path;
      if (opts == null) {
        opts = {};
      }
      path = this.overlay.getPath();
      return _.each(["insert_at", "remove_at", "set_at"], (function(_this) {
        return function(event_name) {
          return google.maps.event.addListener(path, event_name, function(e) {
            return _this.setBoundModelAttributes(opts, e);
          });
        };
      })(this));
    };

    return OverlayWithPath;

  })(MapStick.Overlay);

  MapStick.Polyline = (function(superClass) {
    extend(Polyline, superClass);

    function Polyline() {
      this.getBounds = bind(this.getBounds, this);
      return Polyline.__super__.constructor.apply(this, arguments);
    }

    Polyline.prototype.overlayType = "polyline";

    Polyline.prototype.overlayEventNames = ["click", "dblclick", "drag", "dragend", "dragstart", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "rightclick"];

    Polyline.prototype.defaultOverlayEvents = ["drag", "dragend", "drawn"];

    Polyline.prototype.twoWayProperties = ["path"];

    Polyline.prototype.properties = ["clickable", "draggable", "editable", "geodesic", "icons", "map", "path", "strokeColor", "strokeOpacity", "strokeWeight", "visible", "zIndex"];

    Polyline.prototype.getBounds = function() {
      var bounds;
      bounds = new google.maps.LatLngBounds();
      this.overlay.getPath().forEach(function(point) {
        return bounds.extend(point);
      });
      return bounds;
    };

    return Polyline;

  })(MapStick.OverlayWithPath);

  MapStick.Polygon = (function(superClass) {
    extend(Polygon, superClass);

    function Polygon() {
      this.getBounds = bind(this.getBounds, this);
      this._listenToPaths = bind(this._listenToPaths, this);
      this.setOverlayPathsFromEncodedStrings = bind(this.setOverlayPathsFromEncodedStrings, this);
      this.getEncodedPathsFromOverlay = bind(this.getEncodedPathsFromOverlay, this);
      this.finishExclusion = bind(this.finishExclusion, this);
      this.drawExclusion = bind(this.drawExclusion, this);
      return Polygon.__super__.constructor.apply(this, arguments);
    }

    Polygon.prototype.overlayType = "polygon";

    Polygon.prototype.overlayEventNames = ["click", "dblclick", "drag", "dragend", "dragstart", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "rightclick"];

    Polygon.prototype.defaultOverlayEvents = ["drag", "dragend", "drawn"];

    Polygon.prototype.twoWayProperties = ["paths"];

    Polygon.prototype.properties = ["zIndex", "visible", "strokeWeight", "strokePosition", "strokeOpacity", "strokeColor", "paths", "map", "geodesic", "fillOpacity", "fillColor", "editable", "draggable", "clickable"];

    Polygon.prototype.drawExclusion = function() {
      if (google.maps.drawing) {
        if (MapStick.drawingManager == null) {
          MapStick.drawingManager = new google.maps.drawing.DrawingManager({
            map: this.map,
            drawingControl: false
          });
        }
        MapStick.drawingManager.setDrawingMode("polygon");
        google.maps.event.clearInstanceListeners(MapStick.drawingManager);
        return google.maps.event.addListener(MapStick.drawingManager, "polygoncomplete", (function(_this) {
          return function(polygon) {
            return _this.finishExclusion(polygon);
          };
        })(this));
      } else {
        return console.error("please include google.maps.drawing library");
      }
    };

    Polygon.prototype.finishExclusion = function(polygon) {
      var path, paths;
      path = polygon.getPath();
      if (MapStick.isClockwise(path) === MapStick.isClockwise(this.overlay.getPath())) {
        path = new google.maps.MVCArray(path.getArray().reverse());
      }
      paths = this.overlay.getPaths();
      paths.push(path);
      this.overlay.setPaths(paths);
      polygon.setMap(null);
      MapStick.drawingManager.setDrawingMode(null);
      return google.maps.event.trigger(this.overlay, "drawn");
    };

    Polygon.prototype.getEncodedPathsFromOverlay = function() {
      return _.collect(this.overlay.getPaths().getArray(), (function(_this) {
        return function(path) {
          return MapStick.encodePathString(path);
        };
      })(this));
    };

    Polygon.prototype.setOverlayPathsFromEncodedStrings = function(paths) {
      if (_.isString(paths)) {
        paths = paths.split(",");
      }
      paths = _.collect(paths, (function(_this) {
        return function(string) {
          return MapStick.decodePathString(string);
        };
      })(this));
      return this.overlay.setPaths(paths);
    };

    Polygon.prototype._listenToPaths = function(opts) {
      var paths;
      if (opts == null) {
        opts = {};
      }
      paths = this.overlay.getPaths();
      return _.each(["insert_at", "remove_at", "set_at"], (function(_this) {
        return function(event_name) {
          return paths.forEach(function(path) {
            return google.maps.event.addListener(path, event_name, function(e) {
              return _this.setBoundModelAttributes(opts);
            });
          });
        };
      })(this));
    };

    Polygon.prototype.getBounds = function() {
      var bounds;
      bounds = new google.maps.LatLngBounds();
      this.overlay.getPaths().forEach(function(path) {
        return path.forEach(function(point) {
          return bounds.extend(point);
        });
      });
      return bounds;
    };

    return Polygon;

  })(MapStick.OverlayWithPath);

  MapStick.Rectangle = (function(superClass) {
    extend(Rectangle, superClass);

    function Rectangle() {
      this.getDrawnOptions = bind(this.getDrawnOptions, this);
      return Rectangle.__super__.constructor.apply(this, arguments);
    }

    Rectangle.prototype.overlayType = "rectangle";

    Rectangle.prototype.overlayEventNames = ["bounds_changed", "click", "dblclick", "drag", "dragend", "dragstart", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "rightclick"];

    Rectangle.prototype.defaultOverlayEvents = ["drag", "dragend", "dragstart", "drawn"];

    Rectangle.prototype.twoWayProperties = ["bounds"];

    Rectangle.prototype.properties = ["bounds", "clickable", "draggable", "editable", "fillColor", "fillOpacity", "map", "strokeColor", "strokeOpacity", "strokePosition", "strokeWeight", "visible", "zIndex"];

    Rectangle.prototype.getDrawnOptions = function(overlay) {
      return {
        bounds: overlay.getBounds()
      };
    };

    return Rectangle;

  })(MapStick.Overlay);

  MapStick.Circle = (function(superClass) {
    extend(Circle, superClass);

    function Circle() {
      this.getDrawnOptions = bind(this.getDrawnOptions, this);
      return Circle.__super__.constructor.apply(this, arguments);
    }

    Circle.prototype.overlayType = "circle";

    Circle.prototype.overlayEventNames = ["center_changed", "click", "dblclick", "drag", "dragend", "dragstart", "mousedown", "mousemove", "mouseout", "mouseup", "mouseover", "radius_changed", "rightclick"];

    Circle.prototype.defaultOverlayEvents = ["drag", "dragend", "dragstart", "drawn"];

    Circle.prototype.twoWayProperties = ["center", "radius"];

    Circle.prototype.properties = ["center", "clickable", "draggable", "editable", "fillColor", "fillOpacity", "map", "radius", "strokeColor", "strokeOpacity", "strokePosition", "strokeWeight", "visible", "zIndex"];

    Circle.prototype.getDrawnOptions = function(overlay) {
      return {
        center: overlay.getCenter(),
        radius: overlay.getRadius()
      };
    };

    return Circle;

  })(MapStick.Overlay);

  MapStick.InfoWindow = (function(superClass) {
    extend(InfoWindow, superClass);

    function InfoWindow() {
      this.setContentView = bind(this.setContentView, this);
      this.remove = bind(this.remove, this);
      this.close = bind(this.close, this);
      this.open = bind(this.open, this);
      this.isOpen = bind(this.isOpen, this);
      return InfoWindow.__super__.constructor.apply(this, arguments);
    }

    InfoWindow.prototype.overlayType = "info_window";

    InfoWindow.prototype.overlayEventNames = ["closeclick", "content_changed", "domready", "position_changed", "zindex_changed"];

    InfoWindow.prototype.twoWayProperties = ["content"];

    InfoWindow.prototype.properties = ["content", "disableAutoPan", "maxWidth", "pixelOffset", "position", "zIndex"];

    InfoWindow.prototype.isOpen = function() {
      var map;
      map = this.get("map");
      return map !== null && typeof map !== "undefined";
    };

    InfoWindow.prototype.open = function(arg) {
      var anchor, map, position, ref;
      ref = arg != null ? arg : {}, map = ref.map, anchor = ref.anchor, position = ref.position;
      if (anchor) {
        return this.overlay.open(map || (map = anchor.getMap()), anchor);
      } else if (position) {
        this.overlay.setPosition(position);
        if (map || (map = this.map)) {
          return this.overlay.open(map);
        }
      }
    };

    InfoWindow.prototype.close = function() {
      return this.overlay.close();
    };

    InfoWindow.prototype.remove = function() {
      this.close();
      return InfoWindow.__super__.remove.apply(this, arguments);
    };

    InfoWindow.prototype.setContentView = function(content_view) {
      if (content_view == null) {
        content_view = this.content_view;
      }
      content_view.render();
      return this.overlay.setContent(content_view.$el[0]);
    };

    return InfoWindow;

  })(MapStick.Overlay);

  MapStick.OverlayCollection = (function(superClass) {
    extend(OverlayCollection, superClass);

    OverlayCollection.prototype.itemType = "model";

    OverlayCollection.prototype.triggerMethod = MapStick.triggerMethod;

    OverlayCollection.prototype.viewOptions = ['collection', 'model', 'map'];

    OverlayCollection.prototype.showing = false;

    OverlayCollection.prototype.collectionEvents = {};

    function OverlayCollection(options) {
      this.closeChildren = bind(this.closeChildren, this);
      this.close = bind(this.close, this);
      this.triggerRendered = bind(this.triggerRendered, this);
      this.triggerBeforeRender = bind(this.triggerBeforeRender, this);
      this._initChildViewStorage = bind(this._initChildViewStorage, this);
      this.removeChildView = bind(this.removeChildView, this);
      this.removeItemView = bind(this.removeItemView, this);
      this.buildItemView = bind(this.buildItemView, this);
      this.addItemView = bind(this.addItemView, this);
      this.getItemView = bind(this.getItemView, this);
      this.showCollection = bind(this.showCollection, this);
      this._renderChildren = bind(this._renderChildren, this);
      this.render = bind(this.render, this);
      this.hide = bind(this.hide, this);
      this.show = bind(this.show, this);
      this.addChildView = bind(this.addChildView, this);
      this.removeListeners = bind(this.removeListeners, this);
      this.listenToCollection = bind(this.listenToCollection, this);
      this._initialEvents = bind(this._initialEvents, this);
      this._initialCollection = bind(this._initialCollection, this);
      this.options = _.extend({}, _.result(this, 'options'), _.isFunction(options) ? options.call(this) : options);
      _.extend(this, _.pick(options, this.viewOptions));
      this._initChildViewStorage();
      this._initialCollection();
      this._initialEvents();
      this.listenToCollection();
      if (_.isFunction(this.initialize)) {
        this.initialize(this.options);
      }
    }

    OverlayCollection.prototype._initialCollection = function() {
      return this.collection.each((function(_this) {
        return function(item, index) {
          var ItemView;
          if (ItemView = _this.getItemView(item)) {
            return _this.addItemView(item, ItemView, index);
          }
        };
      })(this));
    };

    OverlayCollection.prototype._initialEvents = function() {
      if (this.collection) {
        this.listenTo(this.collection, "add", this.addChildView);
        this.listenTo(this.collection, "remove", this.removeItemView);
        return this.listenTo(this.collection, "reset", this.render);
      }
    };

    OverlayCollection.prototype.listenToCollection = function() {
      if (this.collection) {
        return _.each(this.collectionEvents, (function(_this) {
          return function(function_name, event_name) {
            var method;
            if (_.isFunction(method = _this[function_name])) {
              return _this.collection.on(event_name, method);
            }
          };
        })(this));
      }
    };

    OverlayCollection.prototype.removeListeners = function() {
      if (this.collection) {
        this.stopListening(this.collection, "add");
        this.stopListening(this.collection, "remove");
        return this.stopListening(this.collection, "reset");
      }
    };

    OverlayCollection.prototype.addChildView = function(item, collection, options) {
      var ItemView;
      if (ItemView = this.getItemView(item)) {
        return this.addItemView(item, ItemView);
      }
    };

    OverlayCollection.prototype.show = function(map) {
      this.showing = true;
      if (map) {
        this.map = map;
      }
      return this.children.apply("show");
    };

    OverlayCollection.prototype.hide = function() {
      this.showing = false;
      return this.children.apply("hide");
    };

    OverlayCollection.prototype.render = function() {
      this.isClosed = false;
      this.triggerBeforeRender();
      this._renderChildren();
      this.triggerRendered();
      return this;
    };

    OverlayCollection.prototype._renderChildren = function() {
      this.closeChildren();
      return this.showCollection();
    };

    OverlayCollection.prototype.showCollection = function() {
      return this.collection.each((function(_this) {
        return function(item) {
          var ItemView;
          if (ItemView = _this.getItemView(item)) {
            return _this.addItemView(item, ItemView);
          }
        };
      })(this));
    };

    OverlayCollection.prototype.getItemView = function(item) {
      var itemView;
      itemView = MapStick.getOption(this, "itemView");
      if (!itemView) {
        console.error("An 'itemView' must be specified for class: " + this.constructor.name);
      }
      return itemView;
    };

    OverlayCollection.prototype.addItemView = function(item, ItemView, index) {
      var itemViewOptions, view;
      itemViewOptions = MapStick.getOption(this, "itemViewOptions");
      if (_.isFunction(itemViewOptions)) {
        itemViewOptions = itemViewOptions.call(this, item, index);
      }
      view = this.buildItemView(item, ItemView, itemViewOptions);
      this.triggerMethod("before:item:added", view);
      this.children.add(view);
      if (this.showing) {
        view.show();
      } else {
        view.hide();
      }
      this.triggerMethod("after:item:added", view);
      return view;
    };

    OverlayCollection.prototype.buildItemView = function(item, ItemViewType, itemViewOptions) {
      var options, view;
      options = _.extend({
        model: item,
        map: this.map
      }, itemViewOptions);
      view = new ItemViewType(options);
      return view;
    };

    OverlayCollection.prototype.removeItemView = function(item) {
      var view;
      view = this.children.findByModel(item);
      return this.removeChildView(view);
    };

    OverlayCollection.prototype.removeChildView = function(view) {
      if (view) {
        if (view.close) {
          view.close();
        } else if (view.remove) {
          view.remove();
        }
        this.stopListening(view);
        this.children.remove(view);
      }
      return this.triggerMethod("item:removed", view);
    };

    OverlayCollection.prototype._initChildViewStorage = function() {
      return this.children = new MapStick.ChildViewContainer;
    };

    OverlayCollection.prototype.triggerBeforeRender = function() {
      this.triggerMethod("before:render", this);
      return this.triggerMethod("collection:before:render", this);
    };

    OverlayCollection.prototype.triggerRendered = function() {
      this.triggerMethod("render", this);
      return this.triggerMethod("collection:rendered", this);
    };

    OverlayCollection.prototype.close = function() {
      if (this.isClosed) {
        return;
      }
      this.triggerMethod("collection:before:close");
      this.closeChildren();
      this.removeListeners();
      return this.triggerMethod("collection:closed");
    };

    OverlayCollection.prototype.closeChildren = function() {
      return this.children.each((function(_this) {
        return function(child, index) {
          return _this.removeChildView(child);
        };
      })(this));
    };

    return OverlayCollection;

  })(Backbone.View);

}).call(this);
