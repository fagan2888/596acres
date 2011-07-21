var LotMap = {

    epsg4326: new OpenLayers.Projection("EPSG:4326"),
    epsg900913: new OpenLayers.Projection("EPSG:900913"),

    init: function(options, elem) {
        var t = this;
        this.options = $.extend({}, this.options, options);

        this.elem = elem;
        this.$elem = $(elem);

        this.olMap = new OpenLayers.Map(this.$elem.attr('id'), {
            controls: [
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.Attribution(),
                new OpenLayers.Control.LoadingPanel(),
                new OpenLayers.Control.ZoomPanel(),
            ],
            restrictedExtent: this.createBBox(-74.319, 40.948, -73.584, 40.476), 
            zoomToMaxExtent: function() {
                this.setCenter(t.options.center, t.options.initialZoom);
            },
            isValidZoomLevel: function(zoomLevel) {
                return (zoomLevel > 9 && zoomLevel < this.getNumZoomLevels());
            }
        });

        var cloudmade = new OpenLayers.Layer.CloudMade("CloudMade", {
            key: '781b27aa166a49e1a398cd9b38a81cdf',
            styleId: '15434',
            transitionEffect: 'resize',
        });
        this.olMap.addLayer(cloudmade);

        this.olMap.zoomToMaxExtent();

        this.lot_layer = this.getLayer('lots', this.options.url + this.options.queryString, this.styles['default']);
        this.lot_layer.events.on({
            'loadend': function() {
                if (t.lot_layer.features.length == 1) {
                    var feature = t.lot_layer.features[0];
                    t.centerOnFeature(t.lot_layer, feature.fid);
                    t.options.onLoad(feature);
                }
                else {
                    t.addControls([t.lot_layer]);
                }
            },
        });

        this.search_layer = new OpenLayers.Layer.Vector('search', {
            projection: this.olMap.displayProjection,
            styleMap: new OpenLayers.StyleMap({
                'default': {
                    pointRadius: '10',
                    fillColor: '#3f3f3f',
                    fillOpacity: '0.6',
                    strokeWidth: 1,
                    strokeColor: '#000000',
                },
            }),
        });
        this.olMap.addLayer(this.search_layer);

        return this;
    },

    options: {
        center: new OpenLayers.LonLat(-8234102.434993, 4960767.039686),
        initialZoom: 11,
        addContentToPopup: function(popup, feature) { ; },
        type: null, 
        url: '/lots/geojson?',
        queryString: '',
        onLoad: function(feature) {},
        onFeatureUnselect: function(feature) {},
    },

    createBBox: function(lon1, lat1, lon2, lat2) {
        var b = new OpenLayers.Bounds();
        b.extend(this.getTransformedLonLat(lon1, lat1));
        b.extend(this.getTransformedLonLat(lon2, lat2));
        return b;
    },

    styles: {
        'default': {
            pointRadius: '3',
            fillColor: '#3f9438',
            fillOpacity: '0.8',
            strokeWidth: 0,
        },
        'single': { 
            pointRadius: '6', 
            fillColor: '#f9ff51', 
            fillOpacity: '0.6',
        },
    },

    getStyles: function(style) {
        return new OpenLayers.StyleMap({'default': style, 'select': {pointRadius: 15}, 'temporary': {pointRadius: 10}});
    },

    getLayer: function(name, url, style) {
        var layer = new OpenLayers.Layer.Vector(name, {
            projection: this.olMap.displayProjection,
            strategies: [new OpenLayers.Strategy.Fixed()],
            styleMap: this.getStyles(style),
            protocol: new OpenLayers.Protocol.HTTP({
                url: url,
                format: new OpenLayers.Format.GeoJSON()
            })
        });
        this.olMap.addLayer(layer);
        return layer;
    },

    addControls: function(layers) {
        this.getControlHoverFeature(layers);
        this.selectControl = this.getControlSelectFeature(layers);
    },

    getControlSelectFeature: function(layers) {
        var selectControl = new OpenLayers.Control.SelectFeature(layers);
        var t = this;

        $.each(layers, function(i, layer) {
            layer.events.on({
                "featureselected": function(event) {
                    var feature = event.feature;
                    var popup = t.createAndOpenPopup(feature);
                    t.options.addContentToPopup(popup, feature);
                },
                "featureunselected": function(event) {
                    var feature = event.feature;
                    if(feature.popup) {
                        t.olMap.removePopup(feature.popup);
                        t.options.onFeatureUnselect(feature);
                        feature.popup.destroy();
                        delete feature.popup;
                    }
                },
            });
        });

        this.olMap.addControl(selectControl);
        selectControl.activate();   
        return selectControl;
    },

    createAndOpenPopup: function(feature) {
        var content = "<div style=\"min-width: 250px; min-height: 250px;\"></div>";
        var t = this;

        var popup = new OpenLayers.Popup.Anchored("chicken", 
                                    feature.geometry.getBounds().getCenterLonLat(),
                                    new OpenLayers.Size(300, 300),
                                    content,
                                    null, 
                                    true, 
                                    function(event) { t.selectControl.unselectAll(); });
        popup.panMapIfOutOfView = true;
        feature.popup = popup;
        this.olMap.addPopup(popup);

        // don't let the close box add whitespace to the popup
        var new_width = $('.olPopupContent').width() + $('.olPopupCloseBox').width();
        $('.olPopupContent').width(new_width);
        return $('#chicken_contentDiv');
    },

    getControlHoverFeature: function(layers) {
        var selectControl = new OpenLayers.Control.SelectFeature(layers, {
            hover: true,
            highlightOnly: true,
            renderIntent: 'temporary'
        });
        this.olMap.addControl(selectControl);
        selectControl.activate();   
        return selectControl;
    },

    hideLayer: function(name) {
        var layers = this.olMap.getLayersByName(name);
        if (layers.length == 0) return;
        layers[0].setVisibility(false);
    },

    showLayer: function(name) {
        var layers = this.olMap.getLayersByName(name);
        if (layers.length == 0) {
            this.loadLayer(name);
        }
        else {
            layers[0].setVisibility(true);
        }
    },

    layerUrls: {
        'City Councils': "/media/geojson/nycc.geojson",
        'City Council Labels': "/media/geojson/nycc_centroids.geojson",
        'Community Districts': "/media/geojson/nycd.geojson",
        'Community District Labels': "/media/geojson/nycd_centroids.geojson",
        'Boroughs': "/media/geojson/boroughs.geojson",
        'Borough Labels': "/media/geojson/borough_centroids.geojson",
    },

    loadLayer: function(name) {
        var layer = new OpenLayers.Layer.Vector(name, {
            projection: this.olMap.displayProjection,
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url: this.layerUrls[name],
                format: new OpenLayers.Format.GeoJSON(),
            }),
            styleMap: new OpenLayers.StyleMap({
                'default': {
                    'strokeWidth': 3,
                    'strokeColor': '#A4788C',
                    'fillOpacity': 0,
                },
            }),
        });
        this.olMap.addLayer(layer);
    },

    hideLabelLayer: function(name) {
        var layers = this.olMap.getLayersByName(name);
        if (layers.length == 0) return;
        layers[0].setVisibility(false);
    },

    showLabelLayer: function(name) {
        var layers = this.olMap.getLayersByName(name);
        if (layers.length == 0) {
            this.loadLabelLayer(name);
        }
        else {
            layers[0].setVisibility(true);
        }
    },

    loadLabelLayer: function(name) {
        var layer = new OpenLayers.Layer.Vector(name, {
            projection: this.olMap.displayProjection,
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url: this.layerUrls[name],
                format: new OpenLayers.Format.GeoJSON(),
            }),
            styleMap: new OpenLayers.StyleMap({
                'default': {
                    'label': '${label}',
                    'fontColor': '#7E2A70',
                    'fontSize': '18px',
                },
            }),
        });
        this.olMap.addLayer(layer);
    },

    centerOnFeature: function(layer, fid) {
        var feature = layer.getFeatureByFid(fid);
        if (!feature) return;

        var l = new OpenLayers.LonLat(feature.geometry.x, feature.geometry.y);
        this.olMap.setCenter(l, 15);
    },

    setSearchFeature: function(lonLat) {
        this.search_layer.removeAllFeatures();
        var feature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(lonLat.lon, lonLat.lat));
        this.search_layer.addFeatures([feature]);
    },

    getTransformedLonLat: function(longitude, latitude) {
        return new OpenLayers.LonLat(longitude, latitude).transform(this.epsg4326, this.epsg900913);
    },

    getInverseLonLat: function(longitude, latitude) {
        return new OpenLayers.LonLat(longitude, latitude).transform(this.epsg900913, this.epsg4326);
    },

    restrictByArea: function(min, max) {
        var ruleMin = new OpenLayers.Rule({
            filter: new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LESS_THAN,
                property: 'area',
                value: min,
            }),
            symbolizer: { 
                display: "none", 
            },
        });
        var ruleMax = new OpenLayers.Rule({
            filter: new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.GREATER_THAN,
                property: 'area',
                value: max,
            }),
            symbolizer: { 
                display: "none", 
            },
        });
        var ruleElse = new OpenLayers.Rule({
            elseFilter: true,
            symbolizer: {
                display: "true",
            },
        });
        this.lot_layer.styleMap.styles['default'].rules.length = 0;
        this.lot_layer.styleMap.styles['default'].addRules([ruleMin, ruleMax, ruleElse]);
        this.lot_layer.redraw();
    }
};

$.plugin('lotmap', LotMap);
