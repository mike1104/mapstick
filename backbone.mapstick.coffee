# MapStick (backbone.mapstick)
# ----------------------------------
# v0.0.1
#
# Copyright (c)2014 Spanner Ltd.
# Distributed under MIT license
#
# http://spanner.org

window.MapStick = () ->
  # Borrow the Backbone `extend` method so we can use it as needed
  extend: Backbone.Model.extend

class MapStick.ChildViewContainer
  constructor: (views) ->
    @_views = {}
    @_indexByModel = {}
    @_indexByCustom = {}
    @_methods = [
      "forEach","each","map","find","detect","filter","select","reject",
      "every","all","some","any","include","contains","invoke","toArray",
      "first","initial","rest","last","without","isEmpty","pluck"
    ]

    _.each @_methods, (method) =>
      @[method] = () =>
        views = _.values(@_views)
        args = [views].concat(_.toArray(arguments))
        _[method].apply(_, args)
    @_updateLength()
    _.each(views, @add)

  # Add a view to this container. Stores the view
  # by `cid` and makes it searchable by the model
  # cid (and model itself). Optionally specify
  # a custom key to store an retrieve the view.
  add: (view, customIndex) =>
    viewCid = view.cid
    # store the view
    @_views[viewCid] = view

    # index it by model
    if model = view.model
      @_indexByModel[model.cid] = viewCid
    # index by custom
    if customIndex
      @_indexByCustom[customIndex] = viewCid
    @_updateLength()
    @

  # Find a view by the model that was attached to
  # it. Uses the model's `cid` to find it.
  findByModel: (model) =>
    @findByModelCid(model.cid)

  # Find a view by the `cid` of the model that was attached to
  # it. Uses the model's `cid` to find the view `cid` and
  # retrieve the view using it.
  findByModelCid: (modelCid) =>
    viewCid = @_indexByModel[modelCid]
    @findByCid(viewCid)

  # Find a view by a custom indexer.
  findByCustom: (index) =>
    viewCid = @_indexByCustom[index]
    @findByCid(viewCid)

  # Find by index. This is not guaranteed to be a
  # stable index.
  findByIndex: (index) =>
    _.values(@_views)[index]

  # retrieve a view by its `cid` directly
  findByCid: (cid) =>
    @_views[cid]

  # Remove a view
  remove: (view) =>
    viewCid = view.cid
    # delete model index
    if view.model
      delete @_indexByModel[view.model.cid]

    # delete custom index
    _.any @_indexByCustom, (cid, key) =>
      if cid is viewCid
        delete @_indexByCustom[key]
        true
    , @
    # remove the view from the container
    delete @_views[viewCid]
    # update the length
    @_updateLength()
    @

  # Call a method on every view in the container,
  # passing parameters to the call method one at a
  # time, like `function.call`.
  call: (method) =>
    @apply method, _.tail(arguments)

  # Apply a method on every view in the container,
  # passing parameters to the call method one at a
  # time, like `function.apply`.
  apply: (method, args) =>
    _.each @_views, (view) =>
      if _.isFunction(view[method])
        view[method].apply(view, args || [])

  # Update the `.length` attribute on this container
  _updateLength: =>
    @length = _.size(@_views)

MapStick.getOption = (target, optionName) ->
  if !target or !optionName
    null
  else if (target.options and (optionName in target.options) and (target.options[optionName] isnt undefined))
    target.options[optionName]
  else
    target[optionName]

MapStick.triggerMethod = ->
  # split the event name on the ":"
  splitter = /(^|:)(\w)/gi

  # take the event section ("section1:section2:section3")
  # and turn it in to uppercase name
  getEventName(match, prefix, eventName) ->
    eventName.toUpperCase()

  # actual triggerMethod implementation
  triggerMethod = (event) =>
    # get the method name from the event name
    methodName = 'on' + event.replace(splitter, getEventName)
    method = @[methodName]

    # trigger the event, if a trigger method exists
    if _.isFunction(@trigger)
      @trigger.apply(@, arguments)

    # call the onMethodName if it exists
    if _.isFunction(method)
      # pass all arguments, except the event name
      method.apply(@, _.tail(arguments))

  triggerMethod

# Mix in methods from Underscore, for iteration, and other
# collection related features.
# Borrowing this code from Backbone.Collection:
# http://backbonejs.org/docs/backbone.html#section-106
MapStick.actAsCollection = (object, listProperty) ->
  methods = ['forEach', 'each', 'map', 'find', 'detect', 'filter',
    'select', 'reject', 'every', 'all', 'some', 'any', 'include',
    'contains', 'invoke', 'toArray', 'first', 'initial', 'rest',
    'last', 'without', 'isEmpty', 'pluck']

  _.each methods, (method) =>
    object[method] = () =>
      list = _.values(_.result(@, listProperty))
      args = [list].concat(_.toArray(arguments))
      _[method].apply(_, args)

# convert encoded string into MVCArray of latlngs
MapStick.decodePathString = (string) ->
  if google.maps.geometry
    if string and _.isString(string) and string isnt ""
      google.maps.geometry.encoding.decodePath string
    else
      []
  else
    console.error "please include google.maps.geometry library"

# convert array or MVCArray of latlngs into encoded string
MapStick.encodePathString = (array) ->
  if google.maps.geometry
    google.maps.geometry.encoding.encodePath(array) if array
  else
    console.error "please include google.maps.geometry library"

# check for direction of a path. true if clockwise
MapStick.isClockwise = (path) ->
  path = path.getArray() unless _.isArray(path)
  path.push path[0]
  l = 0
  r = 0
  previous_lat = null
  previous_lng = null
  _.each path, (latlng) ->
    lng = latlng.lng()
    lat = latlng.lat()
    if previous_lng and previous_lat
      l += lng * previous_lat
      r += lat * previous_lng
    previous_lng = lng
    previous_lat = lat
  l-r>0

## MapStick.Overlay
# generic view for binding to a google.maps.overlay
class MapStick.Overlay extends Backbone.View
  overlayType: "overlay_view"
  googleOverlayType: =>
    @overlayType.split("_").map((string) -> string.charAt(0).toUpperCase() + string.slice(1)).join("")
  googleDrawingOverlayType: =>
    google.maps.drawing.OverlayType["#{@overlayType.split("_").map((string) -> string.toUpperCase()).join("")}"]
  defaultOptions: {}
  properties: []
  overlayEvents: {}
  viewOptions: ['model', 'events', 'map']
  bindings: {}
  # bindings:
  #   overlay_attribute:
  #     attributes: ["model_attribute"]
  #     modelChanged: "modelChanged"
  #     overlayChanged: "overlayChanged"
  #   position:
  #     lat: "lat_attribute"
  #     lng: "lng_attribute"
  defaultOverlayEvents: []
  modelEvents: {}
  triggerMethod: Marionette.triggerMethod
  showing: false

  # build a google.maps overlay with the initial options
  buildOverlay: (options) =>
    new google.maps[@googleOverlayType()](options)

  constructor: (options={}) ->
    @cid = _.uniqueId('overlay')
    @options = _.extend({}, _.result(@, 'options'), if _.isFunction(options) then options.call(@) else options)
    @overlayOptions = _.pick options, @properties
    _.defaults @overlayOptions, @defaultOptions

    @[@overlayType] = @overlay = @buildOverlay(@overlayOptions)

    _.extend @, _.pick(options, @viewOptions)

    @attachOverlayEvents()
    @listenToModel()
    @setBindings()
    @initialize(@options) if _.isFunction(@initialize)
    @model.on "destroy", @remove
    @model.on "draw", @draw

  # listen for all events on google.maps.overlay and trigger event on the
  # Overlay
  attachOverlayEvents: =>
    _.each @overlayEventNames, (event_name) =>
      google.maps.event.addListener @overlay, event_name, (e) =>
        if _.isFunction(@trigger)
          @trigger event_name, e
        @triggerOverlayEvent event_name, e

  #listen for user defined events on the model and call named function in the
  # Overlay.
  listenToModel: =>
    if @model
      _.each @modelEvents, (function_name, event_name) =>
        if _.isFunction(method = @[function_name])
          @model.on event_name, method

  # Very much work in progress.
  # Bindings to behave like 'stickit'.
  # Bind model attributes to overlay options.
  setBindings: =>
    _.each @bindings, (opts, overlay_attribute) =>
      # overlay_attribute = overlay option
      # opts = `model attribute` string or hash of options
      if _.isString opts
        opts = {attribute: opts, overlayChanged: true}
      if _.isObject opts
        opts.overlay_attribute = overlay_attribute
        if overlay_attribute is "position" and _.isString(opts.lat) and _.isString(opts.lng)
          @bindPosition opts
        else if model_attributes = opts.attributes or opts.attribute
          # Accept single argument as string. Convert to array.
          opts.attributes = model_attributes = [model_attributes] if _.isString model_attributes
          # set the initial bound attributes from the model on the overlay
          @setBoundOverlayAttributes opts
          @listenToBoundModelChanges opts
          @listenToBoundOverlayEvents opts

  bindPosition: (opts={}) =>
    lat_attr = opts.lat
    lng_attr = opts.lng
    setLatLng = =>
      if @model.has(lat_attr) and @model.has(lng_attr)
        @set {position: new google.maps.LatLng(@model.get(lat_attr), @model.get(lng_attr))}
    setLatLng()
    @model.on "change:#{lat_attr} change:#{lng_attr}", (model, value, {mapstickChange:m_change}={}) =>
      setLatLng() unless m_change
    overlay_events = opts.overlayEvents or @defaultOverlayEvents
    _.each overlay_events, (event_name) =>
      google.maps.event.addListener @overlay, event_name, (e) =>
        if pos = @get("position")
          latlng = {}
          latlng[lat_attr] = pos.lat()
          latlng[lng_attr] = pos.lng()
          @model.set(latlng, mapstickChange: true)

  listenToBoundModelChanges: (opts={}) =>
    model_attributes = opts.attributes
    observers = model_attributes.map((ob) -> "change:#{ob}").join(" ")
    # listen for changes to any of the model 'attributes'
    @model.on observers, (model, value, {mapstickChange:m_change}={}) =>
      # update the overlay
      @setBoundOverlayAttributes(opts) unless m_change

  listenToBoundOverlayEvents: (opts={}) =>
    overlay_attribute = opts.overlay_attribute
    if events = opts.overlayEvents
      events = [events] if _.isString events
    else
      events or= @defaultOverlayEvents
    _.each events, (event_name) =>
      # listen to the overlay for each of the 'overlayEvents'
      google.maps.event.addListener @overlay, event_name, (e) =>
        if event_name is "drawn"
          if overlay_attribute is "paths"
            @_listenToPaths opts
          else if overlay_attribute is "path"
            @_listenToPath opts
        @setBoundModelAttributes opts, e

  setBoundModelAttributes: (opts={}, e) =>
    if opts.overlayChanged
      overlay_attribute = opts.overlay_attribute
      model_attributes = opts.attributes
      # get the attribute from the overlay

      if overlay_attribute is "paths"
        data = @overlay.getPaths()
      else if overlay_attribute is "path"
        data = @overlay.getPath()
      else
        data = @get(overlay_attribute)

      result = {}
      on_set = opts.overlayChanged
      if _.isFunction on_set
        # give event to function
        result = on_set(data, e)
      else if _.isString(on_set) and _.isFunction(@[on_set])
        # find function and give it the event
        result = @[on_set](data, e)
      # set the result on the model
      else if on_set is true and model_attributes.length is 1
        result[model_attributes[0]] = data
      @model.set(result, mapstickChange: true)

  setBoundOverlayAttributes: (opts={}) =>
    model_attributes = opts.attributes
    overlay_attribute = opts.overlay_attribute
    model_data = {}
    _.each model_attributes, (attr) =>
      model_data[attr] = @model.get(attr)
    overlay_options = {}
    # if user provided function for manipulating result
    if on_get = opts.modelChanged
      result = null
      if _.isFunction on_get
        result = on_get(model_data)
      else if _.isFunction(@[on_get])
        result = @[on_get](model_data)
      overlay_options[overlay_attribute] = result

    else if model_attributes.length is 1
      overlay_options[overlay_attribute] = @model.get(model_attributes[0])

    # set the options on the overlay
    @set overlay_options

    # if the path(s) has been set by the model the path listeners have been lost. refresh them.
    if overlay_attribute is "paths"
      @_listenToPaths opts
    else if overlay_attribute is "path"
      @_listenToPath opts

  triggerOverlayEvent: (event_name, e) =>
    if event = @overlayEvents[event_name]
      method = @[event]
      if _.isFunction(method)
        method(e)
      else
        console.error "no such handler for event: '#{event_name}'"
    # call 'onEventName' method
    method = @["on#{event_name.split("_").map((string) -> string.charAt(0).toUpperCase() + string.slice(1)).join("")}"]
    if _.isFunction(method)
      method(e)

  # get `attribute` from the overlay
  get: (attribute) =>
    @overlay.get(attribute)

  # set `attribute(s)` on overlay
  set: (attribute, value) =>
    if _.isObject(attribute)
      @overlay.setOptions attribute
    else if _.isString(attribute)
      @overlay.set attribute, value
    else
      console.error "can't set that"

  show: (map) =>
    @showing = true
    @map = map if map
    @set "map", @map

  hide: =>
    @showing = false
    @set "map", null

  remove: =>
    @clearListeners()
    @set "map", null

  # stop listening for events on the google.maps.overlay
  clearListeners: =>
    google.maps.event.clearListeners(@overlay) if @overlay

  render: =>
    if @showing
      @overlay.setMap @map

  # use the google.maps.drawing.DrawingManager to build a temporary overlay
  # and draw it on the map
  draw: (map) =>
    map ?= @map
    if google.maps.drawing
      MapStick.drawingManager ?= new google.maps.drawing.DrawingManager
        map: map
        drawingControl: false

      MapStick.drawingManager.setDrawingMode @overlayType

      google.maps.event.clearInstanceListeners MapStick.drawingManager
      google.maps.event.addListener MapStick.drawingManager, "overlaycomplete", (e) =>
        @finishDrawing e.overlay
    else
      console.error "please include google.maps.drawing library"

  # use the temporary overlay to update the main overlay
  # hide the temporary overlay and drawingManager
  finishDrawing: (overlay) =>
    @updateFromDrawn overlay
    overlay.setMap null
    MapStick.drawingManager.setDrawingMode null

  getDrawnOptions: (overlay) =>
    {}

  # get properties from the temporary overlay and apply to main overlay
  updateFromDrawn: (overlay) =>
    @overlay.setOptions @getDrawnOptions(overlay)
    @model.trigger "overlay:drawn"
    google.maps.event.trigger @overlay, "drawn"

class MapStick.Marker extends MapStick.Overlay
  overlayType: "marker"
  overlayEventNames: [
    "animation_changed","click","clickable_changed","cursor_changed",
    "dblclick","drag","dragend","draggable_changed","dragstart",
    "flat_changed","icon_changed","mousedown","mouseout","mouseover",
    "mouseup","position_changed","rightclick","shape_changed",
    "title_changed","visible_changed","zindex_changed"
  ]
  defaultOverlayEvents: [
    "drag","dragend","dragstart","drawn"
  ]
  properties: [
    "anchorPoint","animation","clickable","crossOnDrag","cursor",
    "draggable","icon","map","opacity","optimized","position","shape",
    "title","visible","zIndex"
  ]

  getDrawnOptions: (overlay) =>
    {position: overlay.getPosition()}

class MapStick.OverlayWithPath extends MapStick.Overlay
  defaultOptions:
    path: new google.maps.MVCArray

  getEncodedPathFromOverlay: =>
    MapStick.encodePathString @overlay.getPath()

  setOverlayPathFromEncodedString: (string) =>
    @overlay.setPath MapStick.decodePathString(string)

  getDrawnOptions: (overlay) =>
    {path: overlay.getPath()}

  # listen for changes to the path and retrieve encoded string of path
  _listenToPath: (opts={}) =>
    path = @overlay.getPath()
    _.each ["insert_at","remove_at","set_at"], (event_name) =>
      google.maps.event.addListener path, event_name, (e) =>
        @setBoundModelAttributes opts, e

class MapStick.Polyline extends MapStick.OverlayWithPath
  overlayType: "polyline"
  overlayEventNames: [
    "click","dblclick","drag","dragend","dragstart","mousedown","mousemove",
    "mouseout","mouseover","mouseup","rightclick"
  ]
  defaultOverlayEvents: [
    "drag","dragend","drawn"
  ]
  properties: [
    "clickable","draggable","editable","geodesic","icons","map","path",
    "strokeColor","strokeOpacity","strokeWeight","visible","zIndex"
  ]
  defaultOptions:
    path: new google.maps.MVCArray

class MapStick.Polygon extends MapStick.OverlayWithPath
  overlayType: "polygon"
  overlayEventNames: [
    "click","dblclick","drag","dragend","dragstart","mousedown","mousemove",
    "mouseout","mouseover","mouseup","rightclick"
  ]
  defaultOverlayEvents: [
    "drag","dragend","drawn"
  ]
  properties: [
    "zIndex","visible","strokeWeight","strokePosition","strokeOpacity",
    "strokeColor","paths","map","geodesic","fillOpacity","fillColor",
    "editable","draggable","clickable"
  ]

  drawExclusion: =>
    if google.maps.drawing
      MapStick.drawingManager ?= new google.maps.drawing.DrawingManager
        map: @map
        drawingControl: false

      MapStick.drawingManager.setDrawingMode "polygon"

      google.maps.event.clearInstanceListeners MapStick.drawingManager
      google.maps.event.addListener MapStick.drawingManager, "polygoncomplete", (polygon) =>
        @finishExclusion polygon
    else
      console.error "please include google.maps.drawing library"

  finishExclusion: (polygon) =>
    path = polygon.getPath()
    # make sure exclusion path has opposite direction to main path
    if MapStick.isClockwise(path) is MapStick.isClockwise(@overlay.getPath())
      path = new google.maps.MVCArray path.getArray().reverse()
    paths = @overlay.getPaths()
    paths.push path
    @overlay.setPaths paths
    polygon.setMap null
    MapStick.drawingManager.setDrawingMode null
    google.maps.event.trigger @overlay, "drawn"

  getEncodedPathsFromOverlay: =>
    _.collect @overlay.getPaths().getArray(), (path) =>
      MapStick.encodePathString path

  setOverlayPathsFromEncodedStrings: (paths) =>
    if _.isString paths
      paths = paths.split(",")
    paths = _.collect paths, (string) =>
      MapStick.decodePathString(string)
    @overlay.setPaths paths

  # listen for changes to the path and retrieve encoded string of path
  _listenToPaths: (opts={}) =>
    paths = @overlay.getPaths()
    _.each ["insert_at","remove_at","set_at"], (event_name) =>
      paths.forEach (path) =>
        google.maps.event.addListener path, event_name, (e) =>
          @setBoundModelAttributes opts

class MapStick.Rectangle extends MapStick.Overlay
  overlayType: "rectangle"
  overlayEventNames: [
    "bounds_changed","click","dblclick","drag","dragend","dragstart",
    "mousedown","mousemove","mouseout","mouseover","mouseup","rightclick"
  ]
  defaultOverlayEvents: [
    "drag","dragend","dragstart","drawn"
  ]
  properties: [
    "bounds","clickable","draggable","editable","fillColor","fillOpacity","map",
    "strokeColor","strokeOpacity","strokePosition","strokeWeight","visible",
    "zIndex"
  ]

  getDrawnOptions: (overlay) =>
    {bounds: overlay.getBounds()}

class MapStick.Circle extends MapStick.Overlay
  overlayType: "circle"
  overlayEventNames: [
    "center_changed","click","dblclick","drag","dragend","dragstart",
    "mousedown","mousemove","mouseout","mouseup","mouseover","radius_changed",
    "rightclick"
  ]
  defaultOverlayEvents: [
    "drag","dragend","dragstart","drawn"
  ]
  properties: [
    "center","clickable","draggable","editable","fillColor","fillOpacity","map",
    "radius","strokeColor","strokeOpacity","strokePosition","strokeWeight",
    "visible","zIndex"
  ]

  getDrawnOptions: (overlay) =>
    {
      center: overlay.getCenter()
      radius: overlay.getRadius()
    }

class MapStick.InfoWindow extends MapStick.Overlay
  overlayType: "info_window"
  overlayEventNames: [
    "closeclick","content_changed","domready","position_changed","zindex_changed"
  ]
  properties: [
    "content","disableAutoPan","maxWidth","pixelOffset","position","zIndex"
  ]

  initialize: ({content_view:@content_view}={}) ->
    super
    @setContentView() if @content_view

  isOpen: =>
    map = @get "map"
    map isnt null and typeof map isnt "undefined"

  open: ({map:map,anchor:anchor,position:position}={}) =>
    if anchor
      @overlay.open map or= anchor.getMap(), anchor
    else if position
      @overlay.setPosition position
      if map or= @map
        @overlay.open map

  close: =>
    @overlay.close()

  setContentView: (content_view) =>
    content_view ?= @content_view
    content_view.render()
    @overlay.setContent content_view.$el[0]

# MapStick.CollectionView manages the relationship between a collection of
# models and a collection of views
class MapStick.CollectionView extends Backbone.View
  itemView: MapStick.Overlay
  itemType: "model"
  triggerMethod: Marionette.triggerMethod
  viewOptions: ['collection', 'model', 'map']
  showing: false
  collectionEvents: {}

  constructor: (options) ->
    @options = _.extend({}, _.result(@, 'options'), if _.isFunction(options) then options.call(@) else options)
    _.extend @, _.pick(options, @viewOptions)

    @_initChildViewStorage()
    @_initialCollection()
    @_initialEvents()
    @listenToCollection()
    @initialize(@options) if _.isFunction(@initialize)

  # Create a view for each model in the collection
  _initialCollection: =>
    @collection.each (item, index) =>
      ItemView = @getItemView(item)
      @addItemView(item, ItemView, index)

  # Configured the initial events that the collection view
  # binds to.
  _initialEvents: =>
    if @collection
      @listenTo @collection, "add", @addChildView
      @listenTo @collection, "remove", @removeItemView
      @listenTo @collection, "reset", @render

  #listen for user defined events on the collection and call named function in
  # the collectionview.
  listenToCollection: =>
    if @collection
      _.each @collectionEvents, (function_name, event_name) =>
        if _.isFunction(method = @[function_name])
          @collection.on event_name, method

  # Deconfigured the initial events that the collection view
  # binds to.
  removeListeners: =>
    if @collection
      @stopListening @collection, "add"
      @stopListening @collection, "remove"
      @stopListening @collection, "reset"

  addChildView: (item, collection, options) =>
    ItemView = @getItemView(item)
    @addItemView(item, ItemView)

  # When the collection view is shown, show its children
  show: (map) =>
    @showing = true
    @map = map if map
    @children.apply "show"

  # When the collection view is hidden, hide its children
  hide: =>
    @showing = false
    @children.apply "hide"

  # Render the collection of items. Override this method to
  # provide your own implementation of a render function for
  # the collection view.
  render: =>
    @isClosed = false
    @triggerBeforeRender()
    @_renderChildren()
    @triggerRendered()
    @

  # Remove all the child views then add them again
  _renderChildren: () =>
    @closeChildren()
    @showCollection()

  # Internal method to loop through each item in the
  # collection view and show it
  showCollection: =>
    @collection.each (item) =>
      ItemView = @getItemView(item)
      @addItemView(item, ItemView)

  # get the type of view
  getItemView: (item) =>
    itemView = MapStick.getOption @, "itemView"

    unless itemView
      throwError("An `itemView` must be specified", "NoItemViewError")
    itemView

  addItemView: (item, ItemView, index) =>
    # get the itemViewOptions if any were specified
    itemViewOptions = MapStick.getOption(@, "itemViewOptions")
    if _.isFunction(itemViewOptions)
      itemViewOptions = itemViewOptions.call(@, item, index)

    # build the view
    view = @buildItemView item, ItemView, itemViewOptions

    # set up the child view event forwarding
    # @addChildViewEventForwarding view

    # this view is about to be added
    @triggerMethod "before:item:added", view

    # Store the child view itself so we can properly
    # remove and/or close it later
    @children.add view

    # show it if the collection is being shown
    if @showing
      view.show()
    else
      view.hide()

    # this view was added
    @triggerMethod("after:item:added", view)

    view

  # Build an `itemView` for every model in the collection.
  buildItemView: (item, ItemViewType, itemViewOptions) =>
    options = _.extend({model: item, map: @map}, itemViewOptions)
    view = new ItemViewType(options)
    view

  # get the child view by item it holds, and remove it
  removeItemView: (item) =>
    view = @children.findByModel(item)
    @removeChildView(view)

  # Remove the child view and close it
  removeChildView: (view) =>
    # shut down the child view properly,
    # including events that the collection has from it
    if view
      # call 'close' or 'remove', depending on which is found
      if view.close
        view.close()
      else if view.remove
        view.remove()

      @stopListening(view)
      @children.remove(view)

    @triggerMethod("item:removed", view)

  _initChildViewStorage: =>
    @children = new MapStick.ChildViewContainer

  # Internal method to trigger the before render callbacks
  # and events
  triggerBeforeRender: () =>
    @triggerMethod "before:render", @
    @triggerMethod "collection:before:render", @

  # Internal method to trigger the rendered callbacks and
  # events
  triggerRendered: () =>
    @triggerMethod "render", @
    @triggerMethod "collection:rendered", @

  # Handle cleanup and other closing needs for
  # the collection of views.
  close: () =>
    if @isClosed
      return

    @triggerMethod("collection:before:close")
    @closeChildren()
    @removeListeners()
    @triggerMethod("collection:closed")

    # Marionette.View.prototype.close.apply(@, arguments)

  # Close the child views that this collection view
  # is holding on to, if any
  closeChildren: () =>
    @children.each (child, index) =>
      @removeChildView(child)
