var serviceUrl = "https://services9.arcgis.com/jHpprnXnn8Wg0pps/arcgis/rest/services/etex_projects_au/FeatureServer/0";
require(["esri/map",
    "esri/dijit/Geocoder",
    "esri/dijit/HomeButton",
    "esri/dijit/BasemapGallery",
    "esri/dijit/Search",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/PictureMarkerSymbol",
    "esri/layers/FeatureLayer",
    "esri/InfoTemplate",
    "esri/graphic",
    "esri/graphicsUtils",
    "app/clusterfeaturelayer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/renderers/ClassBreaksRenderer",
    "esri/renderers/HeatmapRenderer",
    "dojo/_base/Color",
    "dojo/on",
    "dojo/dom-style",
    "dojo/_base/fx",
    "dojo/fx/easing",
    "dojo/dom",
    "dojo/domReady!",
    "esri/tasks/query", "esri/tasks/QueryTask", "esri/request","esri/geometry/Extent"
],
    function (Map, Geocoder, HomeButton, BasemapGallery, Search, SimpleRenderer, PictureMarkerSymbol, FeatureLayer, InfoTemplate,
        Graphic, graphicsUtils, ClusterFeatureLayer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
        PictureMarkerSymbol, ClassBreaksRenderer, HeatmapRenderer, Color, on, domStyle, fx, easing, dom, domReady, Query, QueryTask,
        esriRequest,Extent) {

        // Locals
        var map,
            popup,
            clusterLayer,
            geocoder,
            infoTemplate,
            defaultSym,
            selectedSym,
            activeClusterElement, loading, strTemplate,
            dropDownName, attrinuteArr;
        var dragging = false,
            collapse = false,
            expand = true,
            collapseWidth = 0,
            expandWidth = 0,
            resultSet;
            var isFirstTime = true;
            
        // var initialExtent = new esri.geometry.Extent(-8614312, 4687051, -8536040, 4730894, new esri.SpatialReference({ wkid:102100 }));
        // Create map object
        var initialExtent = new esri.geometry.Extent({"xmin":244598,"ymin":6241389,"xmax":278995,"ymax":6264320,"spatialReference":{"wkid":102100}});
        map = new Map("mapDiv", { //
            basemap: "gray", //"dark-gray"
            center: [-227, -25],
            extent: initialExtent,
            // center: [25.2744,133.7751],
            zoom: 4,
            //minZoom: 2
            minScale: 210000000 
        });
       
        // Create Search widget
        var search = new Search({
            enableButtonMode: true, //this enables the search widget to display as a single button
            enableLabel: false,
            enableInfoWindow: true,
            showInfoWindowOnSelect: false,
            map: map //Specify created Map object
        }, "search");

        var sources = search.get("sources");
        //Push the sources used to search, by default the ArcGIS Online World geocoder is included.
        sources.push({
            featureLayer: new FeatureLayer(serviceUrl),
            searchFields: ["architect"],
            displayField: "architect",
            exactMatch: false,
            outFields: ["architect"],
            name: "Equitone Projects: architect",
            placeholder: "architect",
            maxResults: 6,
            maxSuggestions: 6,

            //Create an InfoTemplate and include three fields
            infoTemplate: new InfoTemplate("Equitone Projects: architect",
                "architect: ${architect}"
            ),
            enableSuggestions: true,
            minCharacters: 0
        });

        sources.push({
            featureLayer: new FeatureLayer(serviceUrl),
            searchFields: ["builder"],
            displayField: "builder",
            exactMatch: false,
            name: "Equitone Projects: builder",
            outFields: ["builder"],
            placeholder: "builder",
            maxResults: 6,
            maxSuggestions: 6,

            //Create an InfoTemplate

            infoTemplate: new InfoTemplate("Equitone Projects: builder",
                "builder: ${builder}"
            ),

            enableSuggestions: true,
            minCharacters: 0
        });

        sources.push({
            featureLayer: new FeatureLayer(serviceUrl),
            searchFields: ["installer"],
            displayField: "installer",
            exactMatch: false,
            name: "Equitone Projects: installer",
            outFields: ["installer"],
            placeholder: "installer",
            maxResults: 6,
            maxSuggestions: 6,

            //Create an InfoTemplate

            infoTemplate: new InfoTemplate("Equitone Projects: installer",
                "installer: ${installer}"
            ),

            enableSuggestions: true,
            minCharacters: 0
        });

        //Set the sources above to the search widget
        search.set("sources", sources);

        search.startup();

        //Create Homebutton Widget
        var home = new HomeButton({
            map: map //Specify Map object
        }, "homeButton");
        home.startup();


        //Create the basemap gallery, in this case we'll display maps from ArcGIS.com including bing maps
        var basemapGallery = new BasemapGallery({
            showArcGISBasemaps: true,
            map: map
        }, "basemapGallery");
        basemapGallery.startup();

        basemapGallery.on("selection-change", function () {
            $('#basemapPopup').hide();
        });

        basemapGallery.on("error", function (msg) {
            console.log("basemap gallery error:  ", msg);
        });


        // Add clusters 
        map.on("load", function () {
            debugger
            // Add layer
            addClusterLayer();
            addClusterLayerEvents();
            initFiltersData();
        });
        
        getAttributes(); // This will prepare fields array for dynamic popup configuration
        function getAttributes() {
            esriRequest({
                url: "https://services9.arcgis.com/jHpprnXnn8Wg0pps/arcgis/rest/services/etex_projects_au/FeatureServer/0?f=pjson",
                handleAs: 'json',

            }).then(function (r) {
                debugger;
                attrinuteArr = [];
                r.fields.forEach(function (field) {
                    attrinuteArr.push({
                        "fieldName": field.name,
                        "label": field.alias
                    });
                });

            }, function (e) {
                console.log(e);
            });
        }

        popup = map.infoWindow;
        popup.highlight = false;
        popup.titleInBody = false;
        popup.domNode.className += " light";        
        infoTemplate = new InfoTemplate("<b>Equitone Project</b>");
        
        // Option 2: Use circle markers for symbols - Red
        defaultSym = new SimpleMarkerSymbol("circle", 11,
            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([92, 92, 92, 1]), 1.00008),
            new Color([229, 100, 37, 1]));

        selectedSym = new SimpleMarkerSymbol("circle", 11,
            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([92, 92, 92, 1]), 1.00008),
            new Color([229, 100, 37, 1]));

        // Create a Cluster feature layer to get feature service
        function addClusterLayer() {
            var renderer,
                small,
                medium,
                large,
                xlarge;

            // Add cluster renderer
            clusterLayer = new ClusterFeatureLayer({
                "url": serviceUrl,
                "distance": 95,
                "id": "clusters",
                "labelColor": "#fff",
                "resolution": map.extent.getWidth() / map.width,
                "singleSymbol": defaultSym,
                "singleTemplate": infoTemplate,
                "useDefaultSymbol": false,
                "zoomOnClick": true,
                "showSingles": true,
                "objectIdField": "ObjectId",
                outFields: ["*"]
            });

            renderer = new ClassBreaksRenderer(defaultSym, "clusterCount");

            // Red Clusters
            small = new SimpleMarkerSymbol("circle", 25,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([212, 116, 60, 0.5]), 15),
                new Color([212, 116, 60, 0.75]));
            medium = new SimpleMarkerSymbol("circle", 50,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([178, 70, 37, 0.5]), 15),
                new Color([178, 70, 37, 0.75]));
            large = new SimpleMarkerSymbol("circle", 80,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([144, 24, 13, 0.5]), 15),
                new Color([144, 24, 13, 0.75]));
            xlarge = new SimpleMarkerSymbol("circle", 110,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([102, 0, 0, 0.5]), 15),
                new Color([102, 0, 0, 0.75]));

            // Break values - can adjust easily
            renderer.addBreak(2, 50, small);
            renderer.addBreak(50, 250, medium);
            renderer.addBreak(250, 1000, large);
            renderer.addBreak(1000, 50000, xlarge);

            // Providing a ClassBreakRenderer is also optional
            clusterLayer.setRenderer(renderer);
            map.addLayer(clusterLayer);

        }
        function toTitleCase(str) {
            return str.replace(/(?:^|\s)\w/g, function (match) {
                return match.toUpperCase();
            });
        }
        function searchFromArray(nameKey, prop, myArray) {
            for (var i = 0; i < myArray.length; i++) {
                if (myArray[i][prop] === nameKey) {
                    return myArray[i];
                }
            }
        }
        // Create new graphic and add to map.graphics
        function addSelectedFeature() {
            var selIndex = map.infoWindow.selectedIndex,
                selFeature;
            if (selIndex !== -1) {
                selFeature = map.infoWindow.features[selIndex];
                // Remove old feature first
                removeSelectedFeature();
               
                //Prepare dynamic popup acording to Config
                strTemplate = '<table class="table popup-data"> <tbody>';

                let photosrc = '';
                if (selFeature.attributes["photo"] == null) {
                    photosrc = '';
                }
                else {
                    photosrc = '<img src="' + selFeature.attributes["photo"] + '" onerror="this.onerror=null;this.src=\'./images/no-image.png\'"/>';
                }
                strTemplate += '        <tr>' +
                    '            <td colspan="2" style="text-align:center;font-weight:500">' + toTitleCase(searchFromArray("photo", "fieldName", attrinuteArr).label || 'Photo') + '</td>' +
                    '        </tr>' +
                    '        <tr>' +
                    '            <td scope="col" colspan="2" style="text-align:center;width:100% !important">' + photosrc + '</td>' +
                    '        </tr>';
                var value = '';
                for (var key in selFeature.attributes) {
                    if (selFeature.attributes.hasOwnProperty(key)) {
                        if (key.toLowerCase().indexOf("objectid") != -1 || key.toLowerCase().indexOf("photo") != -1)
                            continue;
                        value = selFeature.attributes[key];
                        value = (value == null) ? "" : value;
                        var title = searchFromArray(key, "fieldName", attrinuteArr); //.label || key;
                        if(title){
                            title = title.label || key;
                            if (key.toLowerCase().indexOf("link") != -1) {
                                strTemplate += '<tr>' +
                                    '            <td>' + toTitleCase(title) + ' </td>' +
                                    '            <td><a target="_blank" href=' + value + ' title=' + value + '>' + value + '</a></td>' +
                                    '        </tr>';
                            }
                            else {
                                strTemplate += ' <tr>' +
                                    '            <td>' + toTitleCase(title) + ' </td>' +
                                    '            <td>' + value + '</td>' +
                                    '        </tr>';
                            }
                        }                        
                    }
                }
                strTemplate += '</tbody></table>';
                map.infoWindow.setContent(strTemplate);
                map.infoWindow._lastSelected = new Graphic(selFeature.toJson());
                map.infoWindow._lastSelected.setSymbol(selectedSym);
                map.graphics.add(map.infoWindow._lastSelected);
            }
        }

        // Remove graphic from map.graphics
        function removeSelectedFeature() {
            if (map.infoWindow._lastSelected) {
                map.graphics.remove(map.infoWindow._lastSelected);
                map.infoWindow._lastSelected = null;
            }
        }

        // Highlight clusters
        function setActiveClusterOpacity(elem, fillOpacity, strokeOpacity) {
            var textElm;
            if (elem) {
                elem.setAttribute("fill-opacity", fillOpacity);
                elem.setAttribute("stroke-opacity", strokeOpacity);
                // Overide inherited properties for the text in the circle
                textElm = elem.nextElementSibling;
                if (textElm && textElm.nodeName === "text") {
                    textElm.setAttribute("fill-opacity", 1);
                }
            }
        }

        // Hide popup if selected feature is clustered
        function onClustersShown(clusters) {
            var i = 0,
                extent;
            if (map.infoWindow.isShowing && map.infoWindow._lastSelected) {
                for (i; i < clusters.length; i++) {
                    if (clusters[i].attributes.clusterCount > 1) {
                        extent = clusterLayer._getClusterExtent(clusters[i]);
                        if (extent.contains(map.infoWindow._lastSelected.geometry)) {
                            map.infoWindow.hide();
                            break;
                        }
                    }
                }
            }
        }
        
        // Wire cluster layer events
        function addClusterLayerEvents() {
            // Mouse over events
            clusterLayer.on("mouse-over", onMouseOverCluster);
            clusterLayer.on("mouse-out", onMouseOutCluster);            
            // Clusters drawn
            clusterLayer.on("clusters-shown", onClustersShown);
        }

        // Save the last selected graphic so we can highlight it
        map.infoWindow.on("selection-change", function () {
            addSelectedFeature();
            animateInfoWindow();
        });

        // Clear selected graphic when infoWindow is hidden
        map.infoWindow.on("hide", function () {
            // re-activate cluster
            setActiveClusterOpacity(activeClusterElement, 0.75, 0.5);
            removeSelectedFeature();
        });

        // Popup enhancements
        function onMouseOverCluster(e) {
            if (e.graphic.attributes.clusterCount === 1) {
                e.graphic._graphicsLayer.onClick(e);
            } else {
                if (e.target.nodeName === "circle") {
                    activeClusterElement = e.target;
                    setActiveClusterOpacity(activeClusterElement, 1, 1);
                } else {
                    setActiveClusterOpacity(activeClusterElement, 1, 1);
                }
            }
        }

        function onMouseOutCluster(e) {
            if (e.graphic.attributes.clusterCount > 1) {
                if (e.target.nodeName === "circle" || e.target.nodeName === "text") {
                    setActiveClusterOpacity(activeClusterElement, 0.75, 0.5);
                    setActiveClusterOpacity(e.target, 0.75, 0.5);
                }
            }
        }

        function animateInfoWindow() {
            domStyle.set(map.infoWindow.domNode, "opacity", 0);
            fx.fadeIn({
                node: map.infoWindow.domNode,
                duration: 150,
                easing: easing.quadIn
            }).play();
        }

        // Click to close
        map.on('click', function () {
            if (map.infoWindow.isShowing) {
                map.infoWindow.hide();
            }
        });

        // ESC is pressed
        map.on('key-down', function (e) {
            if (e.keyCode === 27) {
                map.infoWindow.hide();
            }
        });

        // Dynamically reposition popups when map moves
        map.on('extent-change', function () {
            if (map.infoWindow.isShowing) {
                map.infoWindow.reposition();
            }
        });

        // Auto recenter map - optional
        autoRecenter(map);

        function autoRecenter(map) {
            on(map, 'load', function (map) {
                on(window, 'resize', map, map.resize);
            });
            on(map, 'resize', function (extent, width, height) {
                map.__resizeCenter = map.extent.getCenter();
                setTimeout(function () {
                    map.centerAt(map.__resizeCenter);
                }, 100);
            });
        }

        function showLoading() {
            esri.show(loading);
            map.disableMapNavigation();
            map.hideZoomSlider();
        }

        function hideLoading(error) {
            esri.hide(loading);
            map.enableMapNavigation();
            map.showZoomSlider();
        }

        //Prepare Query for Feature layer to Bind Filter data
        function initFiltersData() {
            debugger
            var queryTask = new QueryTask(serviceUrl);
            var query = new Query();
            query.returnGeometry = true;
            query.outFields = [
                "*"
            ];
            query.where = "1=1";
            query.orderByFields = ["project"];
            debugger;
            queryTask.execute(query, showResults);
        }

        function showResults(results) {
            var resultItems = [];
            var resultCount = results.features.length;
            var category = "<option>ALL</option>";
            var categoryArr = [];
            var countryArr = [];
            var stateArr = [];
            var projectArr = [];
            var architectArr = [];
            var installerArr = [];
            var builderArr = [];
            var materialArr = [];
            var distributorArr = [];
            //Prepare Filter drop down values list
            for (var i = 0; i < resultCount; i++) {
                var featureAttributes = results.features[i].attributes;
                categoryArr.push(featureAttributes.category);
                countryArr.push(featureAttributes.country);
                stateArr.push(featureAttributes.state);
                projectArr.push(featureAttributes.project);
                architectArr.push(featureAttributes.architect);
                installerArr.push(featureAttributes.installer);
                builderArr.push(featureAttributes.builder);
                materialArr.push(featureAttributes.material_1);
                distributorArr.push(featureAttributes.distributor);
            }

            //Hide Info popup is open
            if (map.infoWindow._lastSelected) {
                map.graphics.remove(map.infoWindow._lastSelected);
                map.infoWindow._lastSelected = null;
            }
            //You have to make some condition that for the first time this line will be skipped
            //This line is centering that map.
            if(isFirstTime){
                isFirstTime = false
                }
                else{
                    map.setExtent(graphicsUtils.graphicsExtent([results.features[0]]));
                }
            // map.setExtent(graphicsUtils.graphicsExtent([results.features[0]]));
            map.infoWindow.hide();

            //Prepare Filters dropdown htmls
            switch (dropDownName) {
                case 'ddlCategory':
                    prepareDropdownHtml(countryArr, 'ddlCountry', ' <option>ALL</option>');
                    prepareDropdownHtml(stateArr, 'ddlState', '<option>ALL</option>');
                    prepareDropdownHtml(projectArr, 'ddlProject', ' <option>ALL</option>');
                    prepareDropdownHtml(architectArr, 'ddlArchitect', '<option>ALL</option>');
                    prepareDropdownHtml(installerArr, 'ddlInstaller', ' <option>ALL</option>');
                    prepareDropdownHtml(builderArr, 'ddlBuilder', '<option>ALL</option>');
                    prepareDropdownHtml(materialArr, 'ddlMaterial', ' <option>ALL</option>');
                    prepareDropdownHtml(distributorArr, 'ddlDistributor', ' <option>ALL</option>');
                    break;
                case 'ddlCountry':
                    prepareDropdownHtml(categoryArr, 'ddlCategory', '<option>ALL</option>');
                    prepareDropdownHtml(stateArr, 'ddlState', '<option>ALL</option>');
                    prepareDropdownHtml(projectArr, 'ddlProject', ' <option>ALL</option>');
                    prepareDropdownHtml(architectArr, 'ddlArchitect', '<option>ALL</option>');
                    prepareDropdownHtml(installerArr, 'ddlInstaller', ' <option>ALL</option>');
                    prepareDropdownHtml(builderArr, 'ddlBuilder', '<option>ALL</option>');
                    prepareDropdownHtml(materialArr, 'ddlMaterial', ' <option>ALL</option>');
                    prepareDropdownHtml(distributorArr, 'ddlDistributor', ' <option>ALL</option>');
                    break;
                case 'ddlState':
                    prepareDropdownHtml(categoryArr, 'ddlCategory', '<option>ALL</option>');
                    prepareDropdownHtml(countryArr, 'ddlCountry', ' <option>ALL</option>');
                    prepareDropdownHtml(projectArr, 'ddlProject', ' <option>ALL</option>');
                    prepareDropdownHtml(architectArr, 'ddlArchitect', '<option>ALL</option>');
                    prepareDropdownHtml(installerArr, 'ddlInstaller', ' <option>ALL</option>');
                    prepareDropdownHtml(builderArr, 'ddlBuilder', '<option>ALL</option>');
                    prepareDropdownHtml(materialArr, 'ddlMaterial', ' <option>ALL</option>');
                    prepareDropdownHtml(distributorArr, 'ddlDistributor', ' <option>ALL</option>');
                    break;
                case 'ddlProject':
                    prepareDropdownHtml(categoryArr, 'ddlCategory', '<option>ALL</option>');
                    prepareDropdownHtml(countryArr, 'ddlCountry', ' <option>ALL</option>');
                    prepareDropdownHtml(stateArr, 'ddlState', '<option>ALL</option>');
                    prepareDropdownHtml(architectArr, 'ddlArchitect', '<option>ALL</option>');
                    prepareDropdownHtml(installerArr, 'ddlInstaller', ' <option>ALL</option>');
                    prepareDropdownHtml(builderArr, 'ddlBuilder', '<option>ALL</option>');
                    prepareDropdownHtml(materialArr, 'ddlMaterial', ' <option>ALL</option>');
                    prepareDropdownHtml(distributorArr, 'ddlDistributor', ' <option>ALL</option>');
                    break;
                case 'ddlArchitect':
                    prepareDropdownHtml(categoryArr, 'ddlCategory', '<option>ALL</option>');
                    prepareDropdownHtml(countryArr, 'ddlCountry', ' <option>ALL</option>');
                    prepareDropdownHtml(stateArr, 'ddlState', '<option>ALL</option>');
                    prepareDropdownHtml(projectArr, 'ddlProject', ' <option>ALL</option>');
                    prepareDropdownHtml(installerArr, 'ddlInstaller', ' <option>ALL</option>');
                    prepareDropdownHtml(builderArr, 'ddlBuilder', '<option>ALL</option>');
                    prepareDropdownHtml(materialArr, 'ddlMaterial', ' <option>ALL</option>');
                    prepareDropdownHtml(distributorArr, 'ddlDistributor', ' <option>ALL</option>');
                    break;
                case 'ddlInstaller':
                    prepareDropdownHtml(categoryArr, 'ddlCategory', '<option>ALL</option>');
                    prepareDropdownHtml(countryArr, 'ddlCountry', ' <option>ALL</option>');
                    prepareDropdownHtml(stateArr, 'ddlState', '<option>ALL</option>');
                    prepareDropdownHtml(projectArr, 'ddlProject', ' <option>ALL</option>');
                    prepareDropdownHtml(architectArr, 'ddlArchitect', '<option>ALL</option>');
                    prepareDropdownHtml(builderArr, 'ddlBuilder', '<option>ALL</option>');
                    prepareDropdownHtml(materialArr, 'ddlMaterial', ' <option>ALL</option>');
                    prepareDropdownHtml(distributorArr, 'ddlDistributor', ' <option>ALL</option>');
                    break;
                case 'ddlBuilder':
                    prepareDropdownHtml(categoryArr, 'ddlCategory', '<option>ALL</option>');
                    prepareDropdownHtml(countryArr, 'ddlCountry', ' <option>ALL</option>');
                    prepareDropdownHtml(stateArr, 'ddlState', '<option>ALL</option>');
                    prepareDropdownHtml(projectArr, 'ddlProject', ' <option>ALL</option>');
                    prepareDropdownHtml(architectArr, 'ddlArchitect', '<option>ALL</option>');
                    prepareDropdownHtml(installerArr, 'ddlInstaller', ' <option>ALL</option>');
                    prepareDropdownHtml(materialArr, 'ddlMaterial', ' <option>ALL</option>');
                    prepareDropdownHtml(distributorArr, 'ddlDistributor', ' <option>ALL</option>');
                    break;
                case 'ddlMaterial':
                    prepareDropdownHtml(categoryArr, 'ddlCategory', '<option>ALL</option>');
                    prepareDropdownHtml(countryArr, 'ddlCountry', ' <option>ALL</option>');
                    prepareDropdownHtml(stateArr, 'ddlState', '<option>ALL</option>');
                    prepareDropdownHtml(projectArr, 'ddlProject', ' <option>ALL</option>');
                    prepareDropdownHtml(architectArr, 'ddlArchitect', '<option>ALL</option>');
                    prepareDropdownHtml(installerArr, 'ddlInstaller', ' <option>ALL</option>');
                    prepareDropdownHtml(builderArr, 'ddlBuilder', '<option>ALL</option>');
                    prepareDropdownHtml(distributorArr, 'ddlDistributor', ' <option>ALL</option>');
                    break;
                case 'ddlDistributor':
                    prepareDropdownHtml(categoryArr, 'ddlCategory', '<option>ALL</option>');
                    prepareDropdownHtml(countryArr, 'ddlCountry', ' <option>ALL</option>');
                    prepareDropdownHtml(stateArr, 'ddlState', '<option>ALL</option>');
                    prepareDropdownHtml(projectArr, 'ddlProject', ' <option>ALL</option>');
                    prepareDropdownHtml(architectArr, 'ddlArchitect', '<option>ALL</option>');
                    prepareDropdownHtml(installerArr, 'ddlInstaller', ' <option>ALL</option>');
                    prepareDropdownHtml(builderArr, 'ddlBuilder', '<option>ALL</option>');
                    prepareDropdownHtml(materialArr, 'ddlMaterial', ' <option>ALL</option>');
                    break;
                default:
                    prepareDropdownHtml(categoryArr, 'ddlCategory', '<option>ALL</option>');
                    prepareDropdownHtml(countryArr, 'ddlCountry', ' <option>ALL</option>');
                    prepareDropdownHtml(stateArr, 'ddlState', '<option>ALL</option>');
                    prepareDropdownHtml(projectArr, 'ddlProject', ' <option>ALL</option>');
                    prepareDropdownHtml(architectArr, 'ddlArchitect', '<option>ALL</option>');
                    prepareDropdownHtml(installerArr, 'ddlInstaller', ' <option>ALL</option>');
                    prepareDropdownHtml(builderArr, 'ddlBuilder', '<option>ALL</option>');
                    prepareDropdownHtml(materialArr, 'ddlMaterial', ' <option>ALL</option>');
                    prepareDropdownHtml(distributorArr, 'ddlDistributor', ' <option>ALL</option>');
            }
            showProjects(results);
        }
        $('.select2').select2();

        function removeDuplicate(arr) {
            var tempArr = [];
            for (var i = 0; i < arr.length; i++) {
                var temStr = arr[i];
                if (temStr != null && $.inArray(temStr, tempArr) === -1) {
                    tempArr.push(temStr);
                }
            }
            return tempArr;
        }

        function prepareDropdownHtml(arr, elmid, strTemplate) {
            arr = removeDuplicate(arr);
            arr.sort();
            for (var i = 0; i < arr.length; i++) {
                strTemplate += "<option>" + arr[i] + "</option>";
            }
            dom.byId(elmid).innerHTML = strTemplate;
        }

        //On Filter drop down change event
        $('select').on('change', function () {
            dropDownName = this.id;
            var queryTask = new QueryTask(serviceUrl);
            var query = new Query();
            query.returnGeometry = true;
            query.outFields = ["*"];
            var queryCondition = "";
            if ($('#ddlCategory').val() != 'ALL') {
                queryCondition += $('#ddlCategory').attr('name') + "='" + $('#ddlCategory').val() + "' and ";
            }
            if ($('#ddlCountry').val() != "ALL") {
                queryCondition += $('#ddlCountry').attr('name') + "='" + $('#ddlCountry').val() + "' and ";
            }
            if ($('#ddlState').val() != 'ALL') {
                queryCondition += $('#ddlState').attr('name') + "='" + $('#ddlState').val() + "' and ";
            }
            if ($('#ddlProject').val() != "ALL") {
                queryCondition += $('#ddlProject').attr('name') + "='" + $('#ddlProject').val() + "' and ";
            }
            if ($('#ddlArchitect').val() != 'ALL') {
                queryCondition += $('#ddlArchitect').attr('name') + "='" + $('#ddlArchitect').val() + "' and ";
            }
            if ($('#ddlInstaller').val() != "ALL") {
                queryCondition += $('#ddlInstaller').attr('name') + "='" + $('#ddlInstaller').val() + "' and ";
            }
            if ($('#ddlBuilder').val() != 'ALL') {
                queryCondition += $('#ddlBuilder').attr('name') + "='" + $('#ddlBuilder').val() + "' and ";
            }
            if ($('#ddlMaterial').val() != "ALL") {
                queryCondition += $('#ddlMaterial').attr('name') + "='" + $('#ddlMaterial').val() + "' and ";
            }
            if ($('#ddlDistributor').val() != "ALL") {
                queryCondition += $('#ddlDistributor').attr('name') + "='" + $('#ddlDistributor').val() + "' and ";
            }
            if (this.value != "ALL" && this.value != "ALL") {
                queryCondition = queryCondition.substring(0, queryCondition.lastIndexOf(' and '));
                query.where = queryCondition;
            } else {
                query.where = "1=1";
            }
            query.orderByFields = ["project"];
            clusterLayer.queryTask.execute(query, changeLayer);
        });

        function changeLayer(results) {
            clusterLayer._clusterData = [];
            var resultCount = results.features.length;
            for (var i = 0; i < resultCount; i++) {
                var features = results.features[i];
                clusterLayer._clusterData.push(features);
            }
            if (map.infoWindow._lastSelected) {
                map.graphics.remove(map.infoWindow._lastSelected);
                map.infoWindow._lastSelected = null;
            }
            map.setExtent(graphicsUtils.graphicsExtent([results.features[0]]));
            map.setZoom(4);
            map.infoWindow.hide();
            debugger;
            showResults(results);
            showProjects(results)
        }

        $('#basemap').on('click', function () {
            $('#basemapPopup').toggle();
        })

        function showProjects(results) {
            $('.list-group-item').remove();
            resultSet = results;
            var resultCount = results.features.length;
            for (var i = 0; i < resultCount; i++) {
                var featureAttributes = results.features[i].attributes;
                if (featureAttributes.name == null) {
                    featureAttributes.name = "";
                }
                if (featureAttributes.state == null) {
                    featureAttributes.state = "";
                }
                if (featureAttributes.category == null) {
                    featureAttributes.category = "";
                }
                $("#nav-home ul").append('<li class="list-group-item"><div class="widget-list-item"><i class="fa fa-circle dot pr-2" aria-hidden="true"></i></div><div class="projectName">' + featureAttributes.project + '<p class="list-category"> | ' + featureAttributes.state + ' | ' + featureAttributes.category + '</p></div></li>');
                if (featureAttributes.architect == null) {
                    featureAttributes.architect = "";
                }
                $("#nav-profile ul").append('<li class="list-group-item"><div class="widget-list-item"><i class="fa fa-circle dot pr-2" aria-hidden="true"></i></div><div class="architectName">' + featureAttributes.architect + '</div></li>');
            }
        }
        $('#nav-home').on('click', 'li', function () {
            $('#nav-home li.active').not(this).each(function () {
                $(this).removeClass("active");
            });
            if (!$(this).hasClass("active")) {
                var projectelem = this.querySelector('.projectName').textContent;
                var t = resultSet.features.filter(function (item) {
                    return item.attributes.project == projectelem.split(" |")[0];
                });
                map.centerAndZoom(t[0].geometry, 13);
            } else {
                var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(-230, -31));
                map.centerAndZoom(pt, 4);
            }
            $(this).toggleClass("active");           
        });

        $('#nav-profile').on('click', 'li', function () {
            $('#nav-profile li.active').not(this).each(function () {
                $(this).removeClass("active");
            });
            if (!$(this).hasClass("active")) {
                var architectelem = this.querySelector('.architectName').textContent;
                var t = resultSet.features.filter(function (item) {
                    return item.attributes.architect == architectelem.split(" |")[0];
                });
                map.centerAndZoom(t[0].geometry, 15);
            } else {
                var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(-230, -31));
                map.centerAndZoom(pt, 4);
            }
            $(this).toggleClass("active");           
        });

        function showLayer(results) {
            clusterLayer._clusterData = [];
            var resultCount = results.features.length;
            for (var i = 0; i < resultCount; i++) {
                var features = results.features[i];
                clusterLayer._clusterData.push(features);
            }
            if (map.infoWindow._lastSelected) {
                map.graphics.remove(map.infoWindow._lastSelected);
                map.infoWindow._lastSelected = null;
            }
            map.setExtent(graphicsUtils.graphicsExtent([results.features[0]]));
            map.infoWindow.hide();
        }

        $('#dragbar').mousedown(function (e) {
            e.preventDefault();
            dragging = true;
            var main = $('#mapDiv');
            var ghostbar = $('<div>', {
                id: 'ghostbar',
                css: {
                    height: main.outerHeight(),
                    top: main.offset().top,
                    left: main.offset().left
                }
            }).appendTo('body');

            $(document).mousemove(function (e) {
                ghostbar.css("left", e.pageX + 2);
                $('#toggleButton').css("visibility", "hidden");
            });

        });

        $(document).mouseup(function (e) {
            if (dragging) {
                var percentage = (e.pageX / window.innerWidth) * 100;
                percentage = percentage - 22;
                var mainPercentage = 100 - percentage;

                $('#console').text("side:" + percentage + " main:" + mainPercentage);

                $('.widget').css("width", percentage + "%");
                $('#mapDiv').css("width", mainPercentage + "%");
                $('#ghostbar').remove();
                $(document).unbind('mousemove');
                $('#toggleButton').css("visibility", "visible");
                $('#toggleButton').css("margin-left", percentage + 0.8 + "%");
                dragging = false;
            }
        });

        $('#collapseExpand').on("click", function (e) {
            var percentage = (e.pageX / window.innerWidth) * 100;
            var mainPercentage = 100 - percentage;
            var currentWidth = $(".widget").width() / window.innerWidth * 100;
            $('#toggleButton').toggleClass("toggleactive collapseactive");
            if (expand) {
                collapseWidth = currentWidth;
                expandWidth = currentWidth + mainPercentage - 1;
                $('.widget').css("width", expandWidth - 1.1 + "%");
                if ($('#toggleButton').hasClass('collapseactive')) {
                    $('#toggleButton').css("margin-left", expandWidth + "%");
                }
                collapse = true;
                expand = false;
            } else if (collapse) {
                $('.widget').css("width", collapseWidth + "%");
                collapse = false;
                expand = true;
                if ($('#toggleButton').hasClass('toggleactive')) {
                    $('#toggleButton').css("margin-left", collapseWidth + 1.1 + "%");
                }
            }

            $('#dragbar').toggle();
        })

        $('#hidePanel, #toggleButton').on('click', function () {
            var currentWidth = $(".widget").width() / window.innerWidth * 100;
            $('.widget').toggle();
            $('#mapDiv').css("width", 100 + "%");
            $('#toggleButton').find('i').toggleClass('fa fa-angle-double-down fa fa-angle-double-up');
            $('#toggleButton').toggleClass("toggleactive collapseactive");
            if ($('#toggleButton').hasClass('collapseactive')) {
                $('#toggleButton').css("margin-left", 0 + "%");
            }
            if ($('#toggleButton').hasClass('toggleactive')) {
                $('#toggleButton').css("margin-left", currentWidth + 1.1 + "%");
            }
        })
    });