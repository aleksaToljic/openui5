/* global QUnit, sinon */

sap.ui.define([
	"sap/ui/core/Core",
	"sap/ui/mdc/Chart",
	"sap/ui/mdc/chart/Item",
	"sap/ui/core/UIComponent",
	"sap/ui/core/ComponentContainer",
    "sap/ui/core/library",
    "sap/chart/Chart",
	"sap/m/Button",
	"sap/ui/mdc/actiontoolbar/ActionToolbarAction",
	"sap/ui/mdc/enum/ActionToolbarActionAlignment",
	"sap/m/ToolbarSeparator"
],
function(
	Core,
	Chart,
	Item,
	UIComponent,
	ComponentContainer,
    CoreLibrary,
    InnerChart,
	Button,
	ActionToolbarAction,
	Alignment,
	ToolbarSeparator
) {
    "use strict";

	// shortcut for sap.ui.core.TitleLevel
	var TitleLevel = CoreLibrary.TitleLevel;

    var sDelegatePath = "test-resources/sap/ui/mdc/delegates/ChartDelegate";

	QUnit.module("sap.ui.mdc.Chart: Simple Properties", {

		beforeEach: function() {
			var TestComponent = UIComponent.extend("test", {
				metadata: {
					manifest: {
						"sap.app": {
							"id": "",
							"type": "application"
						}
					}
				},
				createContent: function() {
					return new Chart("IDChart", {delegate: {
                        name: sDelegatePath,
					    payload: {
						collectionPath: "/testPath"
						}},
						propertyInfo: [{name: "name1"}, {name: "name2"}]
					});
				}
			});
			this.oUiComponent = new TestComponent("IDComponent");
			this.oUiComponentContainer = new ComponentContainer({
				component: this.oUiComponent,
				async: false
			});
            this.oMDCChart = this.oUiComponent.getRootControl();

			this.oUiComponentContainer.placeAt("qunit-fixture");
			Core.applyChanges();
		},
		afterEach: function() {
			this.oUiComponentContainer.destroy();
			this.oUiComponent.destroy();
		}

    });

	QUnit.test("Test exists", function(assert) {
		assert.ok(true);
	});


	QUnit.test("Instantiate", function(assert) {
		assert.ok(this.oMDCChart);
		assert.ok(this.oMDCChart.isA("sap.ui.mdc.IxState"));

    });

	QUnit.test("PropertyHelperMixin relevant parts are part of MDC Chart", function(assert) {
		assert.ok(this.oMDCChart.isPropertyHelperFinal);
		assert.ok(this.oMDCChart._getPropertyByNameAsync);
    });

	QUnit.test("PropertyHelper not finalized on startup", function(assert) {
		assert.ok(this.oMDCChart.isPropertyHelperFinal() == false);
    });

	QUnit.test("Init", function(assert) {
		var done = assert.async();

		this.oMDCChart.initialized().then(function() {
			assert.ok(this.oMDCChart, "The chart is created");

			done();
		}.bind(this));

	});

	QUnit.test("_loadDelegate", function(assert) {
		var done = assert.async();

		this.oMDCChart._loadDelegate().then(function(oDelegate){
			assert.ok(oDelegate, "Delegate loaded");
			done();
		});
	});

	QUnit.test("MDC Chart rebind", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			assert.ok(this.oMDCChart.getControlDelegate(), "Control delegate is initialized");
			this.oMDCChart.getControlDelegate().setInnerChartBoundTest(true); //Mock value for inner chart bound

			var getBindingInfoSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "_getBindingInfo");
			var updateBindingInfoSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "updateBindingInfo");
			var rebindSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "rebind");

			this.oMDCChart.rebind();

			assert.ok(this.oMDCChart.getBusy(), "MDC Chart is set busy");
			assert.ok(getBindingInfoSpy.calledOnce, "getBindingInfo called on delegate");
			assert.ok(updateBindingInfoSpy.calledOnce, "updateBindingInfo called on delegate");
			assert.ok(rebindSpy.calledOnce, "rebind called on delegate");

			done();
		}.bind(this));
	});

	QUnit.test("_getToolbar", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			this.oMDCChart.getAggregation("_toolbar").destroy();
			this.oMDCChart.setAggregation("_toolbar", undefined);
			assert.ok(this.oMDCChart.getAggregation("_toolbar") == undefined, "Toolbar aggregation is empty");

			this.oMDCChart._getToolbar();
			assert.ok(this.oMDCChart.getAggregation("_toolbar"), "Toolbar was created");
			assert.ok(this.oMDCChart.getAggregation("_toolbar").isA("sap.ui.mdc.chart.ChartToolbar"), "Toolbar is instance of sap.ui.mdc.chart.ChartToolbar");

			done();

		}.bind(this));
	});

	QUnit.test("_updateToolbar", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			var toolbarSpy = sinon.spy(this.oMDCChart.getAggregation("_toolbar"), "updateToolbar");

			this.oMDCChart._updateToolbar();
			assert.ok(toolbarSpy.calledOnce, "_updateToolbar was called on toolbar");

			done();

		}.bind(this));
	});

	QUnit.test("_getInnerChart", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			var delegateSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "getInnerChart");

			this.oMDCChart._getInnerChart();
			assert.ok(delegateSpy.calledOnce, "getInnerChart was called on innerChart");

			done();

		}.bind(this));
	});

	QUnit.test("zoomIn", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			var zoomInSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "zoomIn");

			this.oMDCChart.zoomIn();
			assert.ok(zoomInSpy.calledOnce, "Zoom in was called on delegate");
			done();
		}.bind(this));
	});

	QUnit.test("zoomOut", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			var zoomOutSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "zoomOut");

			this.oMDCChart.zoomOut();
			assert.ok(zoomOutSpy.calledOnce, "Zoom out was called on delegate");
			done();
		}.bind(this));
	});

	QUnit.test("getZoomState", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			var zoomSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "getZoomState");

			this.oMDCChart.getZoomState();
			assert.ok(zoomSpy.calledOnce, "Zoom status was called on delegate");
			done();
		}.bind(this));
	});

	QUnit.test("setLegendVisible", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			var legendSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "setLegendVisible");
			assert.ok(this.oMDCChart.getLegendVisible() == true, "Property is in initial state");

			this.oMDCChart.setLegendVisible(false);
			assert.ok(legendSpy.calledOnce, "setLegendVisible was called on delegate");
			assert.ok(this.oMDCChart.getLegendVisible() == false, "Property was updated");
			done();

		}.bind(this));
	});

	QUnit.test("setShowChartTooltip", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			assert.ok(this.oMDCChart.getShowChartTooltip(), "Initial value of property is true");
			var tooltipSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "setChartTooltipVisibility");

			this.oMDCChart.setShowChartTooltip(false);
			assert.ok(tooltipSpy.calledOnce, "delegate function was called");
			assert.ok(!this.oMDCChart.getShowChartTooltip(), "Property was set");

			done();
		}.bind(this));
	});

	QUnit.test("MDC Chart _propagatePropertiesToInnerChart", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			var legendSpy = sinon.spy(this.oMDCChart, "setLegendVisible");
			var tooltipSpy = sinon.spy(this.oMDCChart, "setShowChartTooltip");
			var typeSpy = sinon.spy(this.oMDCChart, "setChartType");

			this.oMDCChart._propagatePropertiesToInnerChart();
			assert.ok(legendSpy.calledOnce, "setLegendVisible was called");
			assert.ok(tooltipSpy.calledOnce, "setShowChartTooltip was called");
			assert.ok(typeSpy.calledOnce, "setChartType was called");

			done();
		}.bind(this));
	});

	QUnit.test("getChartTypeInfo", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			var delegateSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "getChartTypeInfo");

			var info = this.oMDCChart.getChartTypeInfo();
			assert.ok(delegateSpy.calledOnce, "getChartTypeInfo was called on delegate");
			assert.ok(info, "charttypeinfo is present");

			done();
		}.bind(this));
	});

	QUnit.test("getAvailableChartTypes", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			var delegateSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "getAvailableChartTypes");

			this.oMDCChart.getAvailableChartTypes();
			assert.ok(delegateSpy.calledOnce, "getAvailableChartTypes was called on delegate");
			done();
		}.bind(this));
	});

	QUnit.test("setChartType", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			var delegateSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "setChartType");

			this.oMDCChart.setChartType();
			assert.ok(delegateSpy.calledOnce, "setChartType was called on delegate");
			done();
		}.bind(this));
	});

	QUnit.test("getCurrentState", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			var oState = this.oMDCChart.getCurrentState();
			assert.ok(oState, "p13n state object was returned");
			assert.ok(!oState.items, "p13n state contains no items");
			assert.ok(!oState.sorters, "p13n state contains no sorters");

			this.oMDCChart.setP13nMode(["Sort"]);
			oState = this.oMDCChart.getCurrentState();
			assert.ok(oState.sorters, "p13n state contains sorters");

			this.oMDCChart.setP13nMode(["Item"]);
			oState = this.oMDCChart.getCurrentState();
			assert.ok(oState.items, "p13n state contains items");

			done();
		}.bind(this));
	});

	QUnit.test("_getVisibleProperties", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			var oMDCItem = new Item("testItem1", {name: "testName", role: "testRole"});
			this.oMDCChart.insertItem(oMDCItem, 0);

			var aVisibleItems = this.oMDCChart._getVisibleProperties();
			assert.ok(aVisibleItems.length === 1, "Visible Properties contain 1 item");
			assert.ok(aVisibleItems[0].name === "testName", "Item has correct name");
			assert.ok(aVisibleItems[0].role === "testRole", "Item has correct role");

			done();
		}.bind(this));
	});

	QUnit.test("_getPropertyData", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			var delegateSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "fetchProperties");

			this.oMDCChart._getPropertyData();
			assert.ok(delegateSpy.calledOnce, "fetchProperties was called on delegate");

			this.oMDCChart._getPropertyData();
			assert.ok(delegateSpy.calledOnce, "fetchProperties was not called again on delegate");
			done();
		}.bind(this));
	});

	QUnit.test("_renderOverlay", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){

			this.oMDCChart._renderOverlay(true);
			var oOverlay = this.oMDCChart.getControlDelegate().getInnerChart().$().find(".sapUiMdcChartOverlay");
			assert.ok(oOverlay, "Overlay was added to inner chart");

			this.oMDCChart._renderOverlay(false);
			oOverlay = this.oMDCChart.getControlDelegate().getInnerChart().$().find(".sapUiMdcChartOverlay");
			assert.ok(oOverlay, "Overlay was removed from inner chart");
			done();
		}.bind(this));
	});


	QUnit.test("_propagateItemChangeToInnerChart", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			//Arrange
			var oMockItem = new Item({name: "testName", label:"testLabel", type:"groupable", role:"category"});
			var oMockChange = {mutation : "insert", child: oMockItem};
			var oMockBreadcrumbs = {updateDrillBreadcrumbs : function(){}};
			this.oMDCChart._oBreadcrumbs = oMockBreadcrumbs;

			this.oMDCChart.addItem(new Item({name: "testName1", label:"testLabel1", type:"groupable", role:"category"}));
			this.oMDCChart.addItem(new Item({name: "testName2", label:"testLabel2", type:"aggregatable", role:"category"}));
			this.oMDCChart.addItem(oMockItem);

			var oInsertItemSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "insertItemToInnerChart");

			//Act
			this.oMDCChart._propagateItemChangeToInnerChart(oMockChange);

			//Assert
			assert.ok(oInsertItemSpy.calledWithExactly(this.oMDCChart, oMockItem, 1), "Item was inserted with correct index");
			done();
		}.bind(this));

	});

		QUnit.test("setNoDataText", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){
			var delegateSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "setNoDataText");

			this.oMDCChart.setNoDataText("Test Text 12345");
			assert.ok(delegateSpy.calledOnce, "setNoDataText was called on delegate");
			assert.equal(this.oMDCChart.getNoDataText(), "Test Text 12345", "No data text was updated");

			done();
		}.bind(this));
	});

    /**
     * Not implemented yet
     */
    QUnit.test("setP13nMode", function(assert){
        assert.ok(true);
    });

    QUnit.test("_updateAdaption", function(assert){
        assert.ok(true);
    });

    QUnit.test("isFilteringEnabled", function(assert){
        assert.ok(true);
    });

    QUnit.test("setFilterConditions", function(assert){
        assert.ok(true);
    });

    QUnit.test("getConditions", function(assert){
        assert.ok(true);
    });

    QUnit.test("_registerInnerFilter", function(assert){
        assert.ok(true);
    });

    QUnit.test("applySettings", function(assert){
        assert.ok(true);
    });

    QUnit.test("_initInnerControls", function(assert){
        assert.ok(true);
    });

    QUnit.test("_createContentFromPropertyInfos", function(assert){
        assert.ok(true);
    });

    QUnit.test("_createBreadcrumbs", function(assert){
        assert.ok(true);
    });

    QUnit.test("getAdaptionUI", function(assert){
        assert.ok(true);
    });

    QUnit.test("_rebind", function(assert){
        assert.ok(true);
    });

    QUnit.test("_addItems", function(assert){
        assert.ok(true);
    });

    QUnit.test("getCollectionModel", function(assert){
        assert.ok(true);
    });

    QUnit.test("initialized", function(assert){
        assert.ok(true);
    });

    QUnit.test("innerChartBound", function(assert){
        assert.ok(true);
    });

    QUnit.test("getSelectionHandler", function(assert){
        assert.ok(true);
    });

    QUnit.test("getChartTypeLayoutConfig", function(assert){
        assert.ok(true);
    });

    QUnit.test("getAllowedRolesForKinds", function(assert){
        assert.ok(true);
    });

    QUnit.test("destroy", function(assert){
        assert.ok(true);
    });

    QUnit.test("_showDrillDown", function(assert){
        assert.ok(true);
    });

    QUnit.test("getManagedObjectModel", function(assert){
        assert.ok(true);
    });

    QUnit.test("_innerChartDataLoadComplete", function(assert){
		//Arrange
		var oMockDelegate = {requestToolbarUpdate: function(){return;}, getInnerChart: function(){return;}};
		this.oMDCChart.getControlDelegate = function(){return oMockDelegate;};
		var setBusySpy = sinon.spy(this.oMDCChart, "setBusy");
		var _checkStyleClassesForDimensionsSpy = sinon.spy(this.oMDCChart, "_checkStyleClassesForDimensions");
		var _renderOverlaySpy = sinon.spy(this.oMDCChart, "_renderOverlay");
		var requestToolbarUpdateSpy = sinon.spy(this.oMDCChart.getControlDelegate(), "requestToolbarUpdate");

		//Act
		this.oMDCChart._innerChartDataLoadComplete({});

		//Assert
		assert.ok(setBusySpy.calledOnceWith(false), "SetBusy called");
		assert.ok(_checkStyleClassesForDimensionsSpy.calledOnce, "_checkStyleClassesForDimensionsSpy called");
		assert.ok(_renderOverlaySpy.calledOnceWith(false), "_renderOverlaySpy called");
		assert.ok(requestToolbarUpdateSpy.calledOnce, "requestToolbarUpdateSpy called");

    });

	QUnit.test("_checkStyleClassesForDimensions w/o dimension", function(assert){
		//Arrange
		this.oMDCChart.removeAllItems([]);
		this.oMDCChart.addStyleClass("sapUiMDCChartGrid");

		var addStyleClassSpy = sinon.spy(this.oMDCChart, "addStyleClass");
		var removeStyleClassSpy = sinon.spy(this.oMDCChart, "removeStyleClass");

		//Act
		this.oMDCChart._checkStyleClassesForDimensions();

		//Assert
		assert.ok(addStyleClassSpy.calledOnceWith("sapUiMDCChartGridNoBreadcrumbs"), "sapUiMDCChartGridNoBreadcrumbs added");
		assert.ok(removeStyleClassSpy.calledOnceWith("sapUiMDCChartGrid"), "sapUiMDCChartGrid removed");
		assert.ok(this.oMDCChart.hasStyleClass("sapUiMDCChartGridNoBreadcrumbs"), "Styleclass in DOM");
		assert.ok(!this.oMDCChart.hasStyleClass("sapUiMDCChartGrid"), "Styleclass not in DOM");
	});

	QUnit.test("_checkStyleClassesForDimensions with dimension after removal", function(assert){
		//Arrange
		this.oMDCChart.removeAllItems();
		this.oMDCChart.addStyleClass("sapUiMDCChartGrid");
		this.oMDCChart._checkStyleClassesForDimensions();
		this.oMDCChart.addItem(new Item({name: "Test1", type:"groupable"}));

		var addStyleClassSpy = sinon.spy(this.oMDCChart, "addStyleClass");
		var removeStyleClassSpy = sinon.spy(this.oMDCChart, "removeStyleClass");

		//Act
		this.oMDCChart._checkStyleClassesForDimensions();

		//Assert
		assert.ok(addStyleClassSpy.calledOnceWith("sapUiMDCChartGrid"), "sapUiMDCChartGrid added");
		assert.ok(removeStyleClassSpy.calledOnceWith("sapUiMDCChartGridNoBreadcrumbs"), "sapUiMDCChartGridNoBreadcrumbs removed");
		assert.ok(this.oMDCChart.hasStyleClass("sapUiMDCChartGrid"), "Styleclass in DOM");
		assert.ok(!this.oMDCChart.hasStyleClass("sapUiMDCChartGridNoBreadcrumbs"), "Styleclass not in DOM");
	});

    QUnit.test("_getSortedProperties", function(assert){
        assert.ok(true);
    });

    QUnit.test("_getTypeBtnActive", function(assert){
        assert.ok(true);
    });

    QUnit.test("_onFiltersChanged", function(assert){
        assert.ok(true);
    });

    QUnit.test("setVariant", function(assert){
        assert.ok(true);
    });

    QUnit.test("addAction", function(assert){
        assert.ok(true);
    });

	QUnit.module("sap.ui.mdc.Chart: Toolbar Actions", {

		beforeEach: function() {
			var TestComponent = UIComponent.extend("test", {
				metadata: {
					manifest: {
						"sap.app": {
							"id": "",
							"type": "application"
						}
					}
				},
				createContent: function() {

					return new Chart("IDChart", {delegate: {
							name: sDelegatePath,
							payload: {
							collectionPath: "/testPath" }},
						actions: [new ActionToolbarAction( {
							action: new Button("testButton", {text: "testButtonText"}),
							layoutInformation: {  aggregationName: "end",alignment: Alignment.End }
						})]
					});
				}
			});
			this.oUiComponent = new TestComponent("IDComponent");
			this.oUiComponentContainer = new ComponentContainer({
				component: this.oUiComponent,
				async: false
			});
            this.oMDCChart = this.oUiComponent.getRootControl();

			this.oUiComponentContainer.placeAt("qunit-fixture");
			Core.applyChanges();
		},
		afterEach: function() {
			this.oUiComponentContainer.destroy();
			this.oUiComponent.destroy();
		}

    });

	QUnit.test("MDC Chart Initial Action is added to toolbar with the correct layout", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){

			assert.ok(this.oMDCChart.getAggregation("_toolbar"), "Toolbar exists");
			assert.equal(this.oMDCChart.getAggregation("_toolbar").getActions().length, 1, "Toolbar has correct amount of actions in actions aggregation");
			assert.equal(this.oMDCChart.getAggregation("_toolbar").getActions()[0].getAction().getText(), "testButtonText", "Action from constructor property is correctly aligned");

			done();
		}.bind(this));
	});

	QUnit.test("setHeight", function(assert){
		var done = assert.async();

		this.oMDCChart.initialized().then(function(){

			var toolbarSpy = sinon.spy(this.oMDCChart.getAggregation("_toolbar"), "_setHeaderLevel");

			assert.ok(this.oMDCChart.setHeaderLevel(TitleLevel.H3));

			assert.ok(toolbarSpy.calledOnce, "setHeaderLevel called on toolbar");
			assert.equal(this.oMDCChart.getAggregation("_toolbar")._oTitle.getLevel(), sap.ui.core.TitleLevel.H3, "Level set on title");

			done();
		}.bind(this));
	});

});