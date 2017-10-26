sap.ui.define(['sap/ui/core/UIComponent'],
	function(UIComponent) {
	"use strict";

	var Component = UIComponent.extend("sap.m.sample.HeaderContainerOH.Component", {
		metadata : {
			rootView : {
				"viewName": "sap.m.sample.HeaderContainerOH.Page",
				"type": "XML",
				"async": true
			},
			dependencies : {
				libs : [ "sap.m", "sap.ui.core" ]
			},
			config : {
				sample : {
					files : [ "Page.view.xml", "Page.controller.js" ]
				}
			}
		}
	});

	return Component;
});