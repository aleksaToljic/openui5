/*global QUnit, oTable, oTreeTable */

sap.ui.define([
	"sap/ui/table/qunit/TableQUnitUtils",
	"sap/ui/qunit/QUnitUtils",
	"sap/ui/qunit/utils/nextUIUpdate",
	"sap/ui/Device",
	"sap/ui/table/extensions/Pointer",
	"sap/ui/table/utils/TableUtils",
	"sap/ui/table/library",
	"sap/ui/table/rowmodes/Fixed",
	"sap/ui/thirdparty/jquery",
	"sap/ui/core/Core"
], function(
	TableQUnitUtils,
	qutils,
	nextUIUpdate,
	Device,
	PointerExtension,
	TableUtils,
	tableLibrary,
	FixedRowMode,
	jQuery,
	oCore
) {
	"use strict";

	const oModel = window.oModel;
	const aFields = window.aFields;
	const createTables = window.createTables;
	const destroyTables = window.destroyTables;
	const getCell = window.getCell;
	const getColumnHeader = window.getColumnHeader;
	const getRowHeader = window.getRowHeader;
	const getRowAction = window.getRowAction;
	const iNumberOfRows = window.iNumberOfRows;
	const initRowActions = window.initRowActions;
	const checkFocus = window.checkFocus;
	const fakeSumRow = window.fakeSumRow;

	function createPointerEvent(sEventType) {
		return new window.PointerEvent(sEventType, {
			bubbles: true,
			cancelable: true
		});
	}

	QUnit.module("Lifecycle", {
		beforeEach: function() {
			this.oTable = TableQUnitUtils.createTable();
		},
		afterEach: function() {
			this.oTable.destroy();
		}
	});

	QUnit.test("Initialization", function(assert) {
		const oExtension = this.oTable._getPointerExtension();
		let iDelegateCount = 0;

		assert.ok(oExtension, "Extension available in table");

		for (let i = 0; i < this.oTable.aDelegates.length; i++) {
			if (this.oTable.aDelegates[i].oDelegate === oExtension._delegate) {
				iDelegateCount++;
			}
		}

		assert.equal(iDelegateCount, 1, "Pointer delegate registered");
	});

	QUnit.test("Destruction", function(assert) {
		const oExtension = this.oTable._getPointerExtension();

		this.oTable.destroy();
		assert.ok(!oExtension.getTable(), "Reference to table removed");
		assert.ok(!oExtension._delegate, "Delegate cleared");
	});

	QUnit.module("Column Resizing", {
		beforeEach: async function() {
			this.bOriginalSystemDesktop = Device.system.desktop;

			createTables();

			// Ensure that the last column is "streched" and the others have their defined size
			const oLastColumn = oTable.getColumns()[oTable.getColumns().length - 1];
			oLastColumn.setWidth(null);

			// Ensure bigger cell content for the column with index 1
			const aRows = oModel.getData().rows;
			for (let i = 0; i < aRows.length; i++) {
				aRows[i][aFields[1]] = "AAAAAAAAAAAAAAAAAAAAAAAAA" + i;
			}
			oModel.refresh(true);

			this.oColumn = oTable.getColumns()[1];
			this.oColumn.setResizable(false);

			await nextUIUpdate();

			// Extend auto resize logic to know about the test control
			PointerExtension._fnCheckTextBasedControl = function(oControl) {
				return oControl.getMetadata().getName() === "TestControl";
			};
		},
		afterEach: function() {
			Device.system.desktop = this.bOriginalSystemDesktop;

			destroyTables();
			PointerExtension._fnCheckTextBasedControl = null;
		}
	});

	function moveResizer(oColumn, assert, bExpect, iIndex) {
		qutils.triggerEvent("mousemove", oColumn.getId(), {
			clientX: Math.floor(oColumn.getDomRef().getBoundingClientRect().left + 10),
			clientY: Math.floor(oColumn.getDomRef().getBoundingClientRect().top + 100)
		});

		if (assert) {
			const iDistance = oTable.getDomRef("rsz").getBoundingClientRect().left - oColumn.getDomRef().getBoundingClientRect().right;
			const bCorrect = Math.abs(iDistance) < 5;
			assert.ok(bExpect && bCorrect || !bExpect && !bCorrect, "Position of Resizer");
			assert.equal(oTable._iLastHoveredVisibleColumnIndex, iIndex, "Index of last hovered resizable table");
		}
	}

	QUnit.test("Moving Resizer", function(assert) {
		const aVisibleColumns = oTable._getVisibleColumns();
		moveResizer(aVisibleColumns[0], assert, true, 0);
		moveResizer(aVisibleColumns[1], assert, false, 0);
		assert.ok(Math.abs(oTable.getDomRef("rsz").getBoundingClientRect().left - aVisibleColumns[0].getDomRef().getBoundingClientRect().right) < 5,
			"Position of Resizer still on column 0");
		moveResizer(aVisibleColumns[2], assert, true, 2);
	});

	QUnit.test("Moving Resizer with padding on the root element", function(assert) {
		oTable.getDomRef().style.padding = "1rem";
		const aVisibleColumns = oTable._getVisibleColumns();
		moveResizer(aVisibleColumns[0], assert, true, 0);
		moveResizer(aVisibleColumns[1], assert, false, 0);
		assert.ok(Math.abs(oTable.getDomRef("rsz").getBoundingClientRect().left - aVisibleColumns[0].getDomRef().getBoundingClientRect().right) < 5,
			"Position of Resizer still on column 0");
		moveResizer(aVisibleColumns[2], assert, true, 2);
	});

	QUnit.test("Automatic Column Resize via Double Click", function(assert) {
		Device.system.desktop = true;

		function triggerDoubleClick(bExpect, iIndex) {
			const oResizer = oTable.getDomRef("rsz");

			// Move resizer to correct column
			moveResizer(oColumn, assert, bExpect, iIndex);

			// Simulate double click on resizer
			return new Promise(function(resolve) {
				oResizer.dispatchEvent(createPointerEvent("mousedown"));
				oResizer.dispatchEvent(createPointerEvent("mouseup"));
				oResizer.dispatchEvent(createPointerEvent("click"));
				setTimeout(resolve, 50);
			}).then(function() {
				return new Promise(function(resolve) {
					oResizer.dispatchEvent(createPointerEvent("mousedown"));
					oResizer.dispatchEvent(createPointerEvent("mouseup"));
					oResizer.dispatchEvent(createPointerEvent("click"));
					oResizer.dispatchEvent(createPointerEvent("dblclick"));
					setTimeout(resolve, 50);
				});
			});
		}

		const oColumn = this.oColumn;
		let iWidth = oColumn.$().width();

		assert.ok(Math.abs(iWidth - 100) < 10, "check column width before resize: " + iWidth);

		return triggerDoubleClick(false, 0).then(async function() {
			assert.equal(oColumn.$().width(), iWidth, "check column width after resize: " + iWidth);
			oColumn.setAutoResizable(true);
			await nextUIUpdate();
			assert.ok(oColumn.getAutoResizable(), "Column is autoresizable");
			assert.ok(!oColumn.getResizable(), "Column is not yet resizable");
			return triggerDoubleClick(false, 0);
		}).then(async function() {
			assert.equal(oColumn.$().width(), iWidth, "check column width after resize: " + iWidth);
			oColumn.setResizable(true);
			await nextUIUpdate();
			assert.ok(oColumn.getAutoResizable(), "Column is autoresizable");
			assert.ok(oColumn.getResizable(), "Column is resizable");
			Device.system.desktop = false;
			return triggerDoubleClick(true, 1);
		}).then(function() {
			assert.equal(oColumn.$().width(), iWidth, "check column width after resize: " + iWidth);

			Device.system.desktop = true;
			return triggerDoubleClick(true, 1);
		}).then(function() {
			iWidth = oColumn.$().width();
			assert.ok(Math.abs(iWidth - 270) < 40, "check column width after resize: " + iWidth);
		});
	});

	QUnit.test("Automatic Column Resize via API", function(assert) {
		const done = assert.async();
		const oColumn = this.oColumn;
		let iWidth = oColumn.$().width();

		assert.ok(Math.abs(iWidth - 100) < 10, "check column width before resize: " + iWidth);
		oTable.autoResizeColumn(1);

		setTimeout(async function() {
			assert.equal(oColumn.$().width(), iWidth, "check column width after resize: " + iWidth);
			oColumn.setAutoResizable(true);
			await nextUIUpdate();
			assert.ok(oColumn.getAutoResizable(), "Column is autoresizable");
			assert.ok(!oColumn.getResizable(), "Column is not yet resizable");
			oTable.autoResizeColumn(1);

			setTimeout(async function() {
				assert.equal(oColumn.$().width(), iWidth, "check column width after resize: " + iWidth);
				oColumn.setResizable(true);
				await nextUIUpdate();
				assert.ok(oColumn.getAutoResizable(), "Column is autoresizable");
				assert.ok(oColumn.getResizable(), "Column is resizable");
				oTable.autoResizeColumn(1);

				setTimeout(function() {
					iWidth = oColumn.$().width();
					assert.ok(Math.abs(iWidth - 270) < 40, "check column width after resize: " + iWidth);
					done();
				}, 50);
			}, 50);
		}, 50);
	});

	QUnit.test("Resize via Drag&Drop", async function(assert) {
		const oColumn = this.oColumn;
		let $Resizer = oTable.$("rsz");

		// resizer should be way out of screen when the table gets rendered
		const nLeft = oTable.$("rsz").position().left;
		assert.equal(nLeft, "-5", "Resizer is at the correct initial position");

		const iWidth = oColumn.$().width();
		assert.ok(Math.abs(iWidth - 100) < 10, "check column width before resize: " + iWidth);

		// Resizer moved to the correct position when column is resizable
		moveResizer(oColumn, assert, false, 0);
		oColumn.setAutoResizable(true);
		await nextUIUpdate();
		moveResizer(oColumn, assert, false, 0);
		oColumn.setResizable(true);
		await nextUIUpdate();
		moveResizer(oColumn, assert, true, 1);

		return new Promise(function(resolve) {
			oTable.attachEventOnce("rowsUpdated", resolve);
		}).then(function() {
			// drag resizer to resize column
			$Resizer = oTable.$("rsz");
			const iResizeHandlerTop = Math.floor(oColumn.getDomRef().getBoundingClientRect().top + 100);
			const iResizeHandlerLeft = $Resizer.offset().left;

			qutils.triggerMouseEvent($Resizer, "mousedown", 1, 1, iResizeHandlerLeft, iResizeHandlerTop, 0);
			qutils.triggerMouseEvent($Resizer, "mousemove", 1, 1, iResizeHandlerLeft + 90, iResizeHandlerTop, 0);
			qutils.triggerMouseEvent($Resizer, "mousemove", 1, 1, iResizeHandlerLeft + 90 + 40, iResizeHandlerTop, 0);
			qutils.triggerMouseEvent($Resizer, "mouseup", 1, 1, iResizeHandlerLeft + 90 + 40, iResizeHandlerTop, 0);

			return new Promise(function(resolve) {
				oTable.attachEventOnce("rowsUpdated", resolve);
			});
		}).then(function() {
			const iNewWidth = oColumn.getDomRef().offsetWidth;
			assert.ok(Math.abs(iNewWidth - iWidth - 90 - 40) < 5, "check column width after resize: " + iNewWidth);
		});
	});

	/**
	 * @deprecated As of version 1.117
	 */
	QUnit.test("Resize via Resize Button", function(assert) {
		const done = assert.async();
		const oColumn = this.oColumn;
		const oColumnDomRef = oColumn.getDomRef();
		let iWidthBeforeResize;

		function resize() {
			const $Resizer = oTable.$("rsz");
			const $Column = oColumn.$();

			iWidthBeforeResize = oColumnDomRef.offsetWidth;
			oColumn._openHeaderMenu(oColumnDomRef);
			return TableQUnitUtils.wait(0).then(function() {
				const $ResizeButton = $Column.find(".sapUiTableColResizer");
				const $ResizeButtonOffset = $ResizeButton.offset();
				const oResizeButton = $ResizeButton[0];
				const iResizeHandlerTop = Math.floor($ResizeButtonOffset.top + (oResizeButton.offsetHeight / 2));
				const iResizeButtonLeft = Math.floor($ResizeButtonOffset.left + (oResizeButton.offsetWidth / 2));

				qutils.triggerMouseEvent($ResizeButton, "mousedown", 1, 1, iResizeButtonLeft, iResizeHandlerTop, 0);
				qutils.triggerMouseEvent($Resizer, "mousemove", 1, 1, iResizeButtonLeft + 90, iResizeHandlerTop, 0);
				qutils.triggerMouseEvent($Resizer, "mousemove", 1, 1, iResizeButtonLeft + 90 + 40, iResizeHandlerTop, 0);
				qutils.triggerMouseEvent($Resizer, "mouseup", 1, 1, iResizeButtonLeft + 90 + 40, iResizeHandlerTop, 0);

				return new Promise(function(resolve) {
					oTable.attachEventOnce("rowsUpdated", resolve);
				});
			});
		}

		oColumn.attachEventOnce("columnMenuOpen", function() {
			oColumn.getMenu().close();
			this.stub(Device.system, "desktop").value(false);
			oColumn.setResizable(true);
			oCore.applyChanges();

			resize().then(function() {
				const iExpectedWidth = iWidthBeforeResize + 110;
				assert.ok(Math.abs(oColumn.getDomRef().offsetWidth - iExpectedWidth) < 5,
					"The column was resized to the correct width: " + iExpectedWidth);
			}).then(function() {
				oTable.getColumns()[0].setVisible(false);
				oCore.applyChanges();

				return new Promise(function(resolve) {
					oTable.attachEventOnce("rowsUpdated", resolve);
				});
			}).then(resize).then(function() {
				const iExpectedWidth = iWidthBeforeResize + 110;
				assert.ok(Math.abs(oColumn.getDomRef().offsetWidth - iExpectedWidth) < 5,
					"With invisible columns - The column was resized to the correct width: " + iExpectedWidth);

				done();
			});
		}.bind(this));

		oColumn.setSortProperty("dummy");
		oColumn._openHeaderMenu(oColumnDomRef);
	});

	QUnit.test("Skip trigger resize when resizing already started", function(assert) {
		oTable._getPointerExtension()._debug();
		const ColumnResizeHelper = oTable._getPointerExtension()._ColumnResizeHelper;
		oTable._bIsColumnResizerMoving = true;
		assert.ok(!oTable.$().hasClass("sapUiTableResizing"), "Before Trigger");
		ColumnResizeHelper.initColumnResizing(oTable);
		assert.ok(!oTable.$().hasClass("sapUiTableResizing"), "After Trigger");
	});

	QUnit.module("Menus", {
		beforeEach: function() {
			createTables();
			this.oPointerExtension = oTable._getPointerExtension();
			this.oPointerExtension._debug();
		},
		afterEach: function() {
			destroyTables();
		},

		/**
		 * Triggers a mouse down event on the passed element simulating the specified button.
		 *
		 * @param {jQuery|HTMLElement} oElement The target of the event.
		 * @param {int} iButton 0 = Left mouse button,
		 *                      1 = Middle mouse button,
		 *                      2 = Right mouse button
		 */
		triggerMouseDownEvent: function(oElement, iButton) {
			qutils.triggerMouseEvent(oElement, "mousedown", null, null, null, null, iButton);
		}
	});

	/**
	 * @deprecated As of version 1.117
	 */
	QUnit.test("Column header", function(assert) {
		const done = assert.async();
		let oElem = getColumnHeader(0, true);
		let oColumn = oTable.getColumns()[0];
		const oContextMenuEvent = this.spy(this.oPointerExtension._delegate, "oncontextmenu");
		let oContextMenuEventArgument;
		let bFirstItemHovered;

		oColumn.attachEventOnce("columnMenuOpen", function() {
			let oColumnMenu = oColumn.getMenu();
			oColumnMenu.close();

			// Open the menu with the left mouse button.
			this.triggerMouseDownEvent(oElem, 0);
			qutils.triggerMouseEvent(oElem, "click");
			assert.ok(oColumnMenu.isOpen(), "Menu is opened");
			bFirstItemHovered = oColumnMenu.$().find("li:first").hasClass("sapUiMnuItmHov");
			assert.strictEqual(bFirstItemHovered, true, "The first item in the menu is hovered");

			// Close the menu with the left mouse button.
			this.triggerMouseDownEvent(oElem, 0);
			qutils.triggerMouseEvent(oElem, "click");
			assert.ok(!oColumnMenu.isOpen(), "Menu is closed");
			checkFocus(oElem, assert);

			// Open the menu with the right mouse button.
			this.triggerMouseDownEvent(oElem, 2);
			jQuery(oElem).trigger("contextmenu");
			assert.ok(oColumnMenu.isOpen(), "Menu is opened");
			bFirstItemHovered = oColumnMenu.$().find("li:first").hasClass("sapUiMnuItmHov");
			assert.strictEqual(bFirstItemHovered, true, "The first item in the menu is hovered");
			oContextMenuEventArgument = oContextMenuEvent.args[0][0];
			oContextMenuEvent.resetHistory();
			assert.ok(oContextMenuEventArgument.isDefaultPrevented(), "Opening of the default context menu was prevented");

			// Close the menu with the right mouse button.
			this.triggerMouseDownEvent(oElem, 2);
			jQuery(oElem).trigger("contextmenu");
			assert.ok(!oColumnMenu.isOpen(), "Menu is closed");
			checkFocus(oElem, assert);
			oContextMenuEventArgument = oContextMenuEvent.args[0][0];
			oContextMenuEvent.resetHistory();
			assert.ok(oContextMenuEventArgument.isDefaultPrevented(), "Opening of the default context menu was prevented");

			// Open the menu with the left mouse button.
			this.triggerMouseDownEvent(oElem, 0);
			qutils.triggerMouseEvent(oElem, "click");
			assert.ok(oColumnMenu.isOpen(), "Menu is opened");
			bFirstItemHovered = oColumnMenu.$().find("li:first").hasClass("sapUiMnuItmHov");
			assert.strictEqual(bFirstItemHovered, true, "The first item in the menu is hovered");

			// Close the menu with the right mouse button.
			this.triggerMouseDownEvent(oElem, 2);
			jQuery(oElem).trigger("contextmenu");
			assert.ok(!oColumnMenu.isOpen(), "Menu is closed");
			checkFocus(oElem, assert);
			oContextMenuEventArgument = oContextMenuEvent.args[0][0];
			oContextMenuEvent.resetHistory();
			assert.ok(oContextMenuEventArgument.isDefaultPrevented(), "Opening of the default context menu was prevented");

			oColumn.setVisible(false);
			oCore.applyChanges();
			oColumn = oTable.getColumns()[oTable.getColumns().length - 1];
			oColumn.setSortProperty("dummy");
			oElem = getColumnHeader(oTable._getVisibleColumns().indexOf(oColumn), true);
			this.triggerMouseDownEvent(oElem, 0);
			qutils.triggerMouseEvent(oElem, "click");
			oColumnMenu = oColumn.getMenu();
			assert.ok(oColumnMenu.isOpen(), "Menu is opened if there are invisible columns in the aggregation before this column");

			oColumn = oTable.getColumns()[1];
			oElem = getColumnHeader(1, true);
			// Try to open the menu with the left mouse button.
			this.triggerMouseDownEvent(oElem, 0);
			qutils.triggerMouseEvent(oElem, "click");
			oColumnMenu = oColumn.getMenu();
			assert.ok(!oColumnMenu, "No column menu");
			checkFocus(oElem, assert);

			// Try to open the menu with the right mouse button.
			this.triggerMouseDownEvent(oElem, 2);
			jQuery(oElem).trigger("contextmenu");
			assert.ok(!oColumnMenu, "No column menu");
			checkFocus(oElem, assert);

			oContextMenuEvent.resetHistory();
			done();
		}.bind(this));

		oColumn.setSortProperty("dummy");
		oColumn._openHeaderMenu(oColumn.getDomRef());
	});

	/**
	 * @deprecated As of version 1.117
	 */
	QUnit.test("Column header if first row is a summary", function(assert) {
		return fakeSumRow(0, oTable).then(function() {
			const done = assert.async();
			const oElem = getColumnHeader(0, true);
			const oColumn = oTable.getColumns()[0];

			oColumn.attachEventOnce("columnMenuOpen", function() {
				const oColumnMenu = oColumn.getMenu();
				oColumnMenu.close();

				this.triggerMouseDownEvent(oElem, 0);
				qutils.triggerMouseEvent(oElem, "click");
				assert.ok(oColumnMenu.isOpen(), "Menu is opened");
				done();
			}.bind(this));

			oColumn.setSortProperty("dummy");
			oColumn._openHeaderMenu(oColumn.getDomRef());
		}.bind(this));
	});

	QUnit.test("Data cell", function(assert) {
		const oElem = getCell(0, 0);
		const oColumn = oTable.getColumns()[0];
		const oContextMenuEvent = this.spy(this.oPointerExtension._delegate, "oncontextmenu");
		let oContextMenuEventArgument;

		// Try to open the menu with the left mouse button.
		this.triggerMouseDownEvent(oElem, 0);
		qutils.triggerMouseEvent(oElem, "click");
		assert.equal(oTable._oCellContextMenu, null, "Menu is not yet created");
		checkFocus(oElem, assert);

		// Try to open the menu with the right mouse button.
		this.triggerMouseDownEvent(oElem, 2);
		jQuery(oElem).trigger("contextmenu");
		assert.notEqual(oTable._oCellContextMenu, null, "Menu is created");
		oContextMenuEventArgument = oContextMenuEvent.args[0][0];
		oContextMenuEvent.resetHistory();
		assert.ok(!oContextMenuEventArgument.isDefaultPrevented(), "Opening of the default context menu was not prevented");
		checkFocus(oElem, assert);

		TableUtils.Menu.cleanupDefaultContentCellContextMenu(oTable);
		oTable.setEnableCellFilter(true);
		this.stub(oColumn, "isFilterableByMenu").returns(true);

		// Try to open the menu with the left mouse button.
		this.triggerMouseDownEvent(oElem, 0);
		qutils.triggerMouseEvent(oElem, "click");
		assert.equal(oTable._oCellContextMenu, null, "Menu is not yet created");
		checkFocus(oElem, assert);

		// Open the menu with the right mouse button.
		this.triggerMouseDownEvent(oElem, 2);
		jQuery(oElem).trigger("contextmenu");
		assert.ok(oTable._oCellContextMenu.isOpen(), "Menu is opened");
		const bFirstItemHovered = oTable._oCellContextMenu.$().find("li:first").hasClass("sapUiMnuItmHov");
		assert.strictEqual(bFirstItemHovered, true, "The first item in the menu is hovered");
		oContextMenuEventArgument = oContextMenuEvent.args[0][0];
		oContextMenuEvent.resetHistory();
		assert.ok(oContextMenuEventArgument.isDefaultPrevented(), "Opening of the default context menu was prevented");

		// Open the menu with the right mouse button on the same element.
		this.triggerMouseDownEvent(oElem, 2);
		jQuery(oElem).trigger("contextmenu");
		assert.ok(oTable._oCellContextMenu.isOpen(), "Menu is opened");
		oContextMenuEventArgument = oContextMenuEvent.args[0][0];
		oContextMenuEvent.resetHistory();
		assert.ok(oContextMenuEventArgument.isDefaultPrevented(), "Opening of the default context menu was prevented");

		// If an interactive/clickable element inside a data cell was clicked, open the default context menu instead of the column or cell context
		// menu.
		const aKnownClickableControls = this.oPointerExtension._KNOWNCLICKABLECONTROLS;
		const $CellContent = oTable.getRows()[0].getCells()[0].$();

		for (let i = 0; i < aKnownClickableControls.length; i++) {
			$CellContent.toggleClass(aKnownClickableControls[i], true);
			this.triggerMouseDownEvent($CellContent, 2);
			jQuery($CellContent).trigger("contextmenu");
			assert.ok(!oTable._oCellContextMenu.isOpen(), "Menu is closed");
			oContextMenuEventArgument = oContextMenuEvent.args[0][0];
			oContextMenuEvent.resetHistory();
			assert.ok(!oContextMenuEventArgument.isDefaultPrevented(), "Opening of the default context menu was not prevented");
			$CellContent.toggleClass(aKnownClickableControls[i], false);
		}
	});

	QUnit.module("Mousedown", {
		beforeEach: function() {
			createTables();
		},
		afterEach: function() {
			destroyTables();
		}
	});

	/**
	 * @deprecated As of version 1.117
	 */
	QUnit.test("Column header", function(assert) {
		const done = assert.async();
		const oColumn = oTable._getVisibleColumns()[3];
		let bColumnReorderingTriggered = false;
		const oPointerExtension = oTable._getPointerExtension();
		const oOpenContextMenuSpy = this.spy(TableUtils.Menu, "openContextMenu");

		oColumn.setSortProperty('dummy');

		oPointerExtension.doReorderColumn = function() {
			bColumnReorderingTriggered = true;
		};

		qutils.triggerMouseEvent(getColumnHeader(3), "mousedown", 1, 1, 1, 1, 0);
		assert.ok(oPointerExtension._bShowMenu, "Show Menu flag set to be used in onSelect later");
		qutils.triggerMouseEvent(getColumnHeader(3), "click", 1, 1, 1, 1, 0);
		assert.ok(oOpenContextMenuSpy.calledOnce, "openContextMenu is called");
		setTimeout(function() {
			assert.ok(!oPointerExtension._bShowMenu, "ShowMenu flag reset again");
			assert.ok(bColumnReorderingTriggered, "Column Reordering triggered");

			assert.ok(oColumn.getMenu().isOpen(), "Menu is open");
			oTable.setEnableColumnReordering(false);
			oCore.applyChanges();
			bColumnReorderingTriggered = false;
			oOpenContextMenuSpy.resetHistory();

			qutils.triggerMouseEvent(getColumnHeader(3), "mousedown", 1, 1, 1, 1, 0);
			assert.ok(!oPointerExtension._bShowMenu, "Menu was opened -> _bShowMenu is false");
			qutils.triggerMouseEvent(getColumnHeader(3), "click", 1, 1, 1, 1, 0);
			assert.ok(oOpenContextMenuSpy.notCalled, "Menu was opened -> openContextMenu is not called");
			setTimeout(function() {
				assert.ok(!bColumnReorderingTriggered, "Column Reordering not triggered (enableColumnReordering == false)");
				done();
			}, 250);
		}, 250);
	});

	QUnit.test("Scrollbar", function(assert) {
		let oEvent = jQuery.Event({type: "mousedown"});
		oEvent.target = oTable._getScrollExtension().getHorizontalScrollbar();
		oEvent.button = 0;
		jQuery(oEvent.target).trigger(oEvent);
		assert.ok(oEvent.isDefaultPrevented(), "Prevent Default of mousedown on horizontal scrollbar");
		oEvent = jQuery.Event({type: "mousedown"});
		oEvent.target = oTable._getScrollExtension().getVerticalScrollbar();
		oEvent.button = 0;
		jQuery(oEvent.target).trigger(oEvent);
		assert.ok(oEvent.isDefaultPrevented(), "Prevent Default of mousedown on vertical scrollbar");
	});

	QUnit.module("Click", {
		beforeEach: function() {
			createTables();
		},
		afterEach: function() {
			destroyTables();
		}
	});

	QUnit.test("Tree Icon", function(assert) {
		const done = assert.async();
		const oExtension = oTreeTable._getPointerExtension();
		oExtension._debug();

		assert.equal(oTreeTable._getTotalRowCount(), iNumberOfRows, "Row count before expand");
		assert.ok(!oTreeTable.getBinding().isExpanded(0), "!Expanded");
		oExtension._ExtensionHelper.__handleClickSelection = oExtension._ExtensionHelper._handleClickSelection;
		oExtension._ExtensionHelper._handleClickSelection = function() {
			assert.ok(false, "_doSelect was not called");
		};

		const fnHandler = function() {
			oCore.applyChanges();
			assert.equal(oTreeTable._getTotalRowCount(), iNumberOfRows + 1, "Row count after expand");
			assert.ok(oTreeTable.getBinding().isExpanded(0), "Expanded");
			oExtension._ExtensionHelper._handleClickSelection = oExtension._ExtensionHelper.__handleClickSelection;
			oExtension._ExtensionHelper.__handleClickSelection = null;
			done();
		};

		oTreeTable.attachEventOnce("rowsUpdated", fnHandler);
		const oTreeIcon = oTreeTable.getRows()[0].getDomRef("col0").querySelector(".sapUiTableTreeIcon");
		qutils.triggerMouseEvent(oTreeIcon, "tap");
	});

	QUnit.test("Group Header", async function(assert) {
		const done = assert.async();
		const oExtension = oTreeTable._getPointerExtension();
		oExtension._debug();

		oTreeTable.setUseGroupMode(true);
		await nextUIUpdate();
		oExtension._ExtensionHelper.__handleClickSelection = oExtension._ExtensionHelper._handleClickSelection;
		oExtension._ExtensionHelper._handleClickSelection = function() {
			assert.ok(false, "_doSelect was not called");
		};

		assert.equal(oTreeTable._getTotalRowCount(), iNumberOfRows, "Row count before expand");
		assert.ok(!oTreeTable.getBinding().isExpanded(0), "!Expanded");

		const fnHandler = function() {
			oCore.applyChanges();
			assert.equal(oTreeTable._getTotalRowCount(), iNumberOfRows + 1, "Row count after expand");
			assert.ok(oTreeTable.getBinding().isExpanded(0), "Expanded");
			oExtension._ExtensionHelper._handleClickSelection = oExtension._ExtensionHelper.__handleClickSelection;
			oExtension._ExtensionHelper.__handleClickSelection = null;
			done();
		};

		oTreeTable.attachEventOnce("rowsUpdated", fnHandler);
		const oGroupHeader = oTreeTable.getRows()[0].getDomRef("groupHeader");
		qutils.triggerMouseEvent(oGroupHeader, "tap");
	});

	QUnit.test("Analytical Table Sum", function(assert) {
		const oExtension = oTreeTable._getPointerExtension();
		oExtension._debug();

		let bSelected = false;
		oExtension._ExtensionHelper.__handleClickSelection = oExtension._ExtensionHelper._handleClickSelection;
		oExtension._ExtensionHelper._handleClickSelection = function() {
			bSelected = true;
		};

		return fakeSumRow(0, oTreeTable).then(function() {
			qutils.triggerMouseEvent(oTreeTable.getDomRef("rowsel0"), "tap");
			assert.ok(!bSelected, "Selection was not performed");

			oExtension._ExtensionHelper._handleClickSelection = oExtension._ExtensionHelper.__handleClickSelection;
			oExtension._ExtensionHelper.__handleClickSelection = null;
		});
	});

	QUnit.test("Mobile Group Menu Button", function(assert) {
		const oExtension = oTreeTable._getPointerExtension();
		oExtension._debug();

		let bSelected = false;
		oExtension._ExtensionHelper.__handleClickSelection = oExtension._ExtensionHelper._handleClickSelection;
		oExtension._ExtensionHelper._handleClickSelection = function() {
			bSelected = true;
		};

		const oOpenContextMenu = this.spy(TableUtils.Menu, "openContextMenu");
		const $FakeButton = TableUtils.getRowColCell(oTreeTable, 0, 0).cell.$();

		$FakeButton.addClass("sapUiTableGroupMenuButton");
		qutils.triggerMouseEvent($FakeButton, "tap");
		assert.ok(!bSelected, "Selection was not performed");
		assert.ok(oOpenContextMenu.calledOnce, "Context Menu was opened");

		oExtension._ExtensionHelper._handleClickSelection = oExtension._ExtensionHelper.__handleClickSelection;
		oExtension._ExtensionHelper.__handleClickSelection = null;

		oOpenContextMenu.restore();
	});

	QUnit.test("Cell + Cell Click Event", function(assert) {
		let oExtension = oTreeTable._getPointerExtension();
		oExtension._debug();

		let iSelectCount = 0;
		oExtension._ExtensionHelper.__handleClickSelection = oExtension._ExtensionHelper._handleClickSelection;
		oExtension._ExtensionHelper._handleClickSelection = function() {
			iSelectCount++;
		};

		let fnClickHandler; let bClickHandlerCalled;

		function initCellClickHandler(fnHandler) {
			if (fnClickHandler) {
				oTreeTable.detachCellClick(fnClickHandler);
				fnClickHandler = null;
			}
			bClickHandlerCalled = false;
			if (fnHandler) {
				oTreeTable.attachCellClick(fnHandler);
				fnClickHandler = fnHandler;
			}
		}

		const oRowColCell = TableUtils.getRowColCell(oTreeTable, 1, 2);
		initCellClickHandler(function(oEvent) {
			bClickHandlerCalled = true;
			assert.ok(oEvent.getParameter("cellControl") === oRowColCell.cell, "Cell Click Event: Parameter cellControl");
			assert.ok(oEvent.getParameter("cellDomRef") === document.getElementById(oTreeTable.getId() + "-rows-row1-col2"),
				"Cell Click Event: Parameter cellDomRef");
			assert.equal(oEvent.getParameter("rowIndex"), 1, "Cell Click Event: Parameter rowIndex");
			assert.equal(oEvent.getParameter("columnIndex"), 2, "Cell Click Event: Parameter columnIndex");
			assert.equal(oEvent.getParameter("columnId"), oRowColCell.column.getId(), "Cell Click Event: Parameter columnId");
			assert.ok(oEvent.getParameter("rowBindingContext") === oRowColCell.row.getBindingContext(),
				"Cell Click Event: Parameter rowBindingContext");
		});
		let $Cell = oRowColCell.cell.$();
		qutils.triggerMouseEvent($Cell, "tap"); // Should increase the counter
		assert.equal(iSelectCount, 1, iSelectCount + " selections performed");
		assert.ok(bClickHandlerCalled, "Cell Click Event handler called");

		initCellClickHandler(function(oEvent) {
			oEvent.preventDefault();
			bClickHandlerCalled = true;
		});
		qutils.triggerMouseEvent($Cell, "tap");
		assert.equal(iSelectCount, 1, iSelectCount + " selections performed");
		assert.ok(bClickHandlerCalled, "Cell Click Event handler called");

		initCellClickHandler(function(oEvent) {
			bClickHandlerCalled = true;
		});
		$Cell = oTreeTable.getRows()[0].$("col0");
		qutils.triggerMouseEvent($Cell, "tap"); // Should increase the counter
		assert.equal(iSelectCount, 2, iSelectCount + " selections performed");
		assert.ok(bClickHandlerCalled, "Cell Click Event handler called");

		bClickHandlerCalled = false;
		const oEvent = jQuery.Event({type: "tap"});
		oEvent.setMarked();
		$Cell.trigger(oEvent);
		assert.equal(iSelectCount, 2, iSelectCount + " selections performed");
		assert.ok(!bClickHandlerCalled, "Cell Click Event handler not called");

		qutils.triggerMouseEvent(oTreeTable.getDomRef("rowsel0"), "tap"); // Should increase the counter
		assert.equal(iSelectCount, 3, iSelectCount + " selections performed");
		assert.ok(!bClickHandlerCalled, "Cell Click Event handler not called");

		qutils.triggerMouseEvent(oTable._getVisibleColumns()[0].getDomRef(), "tap");
		assert.equal(iSelectCount, 3, iSelectCount + " selections performed");
		assert.ok(!bClickHandlerCalled, "Cell Click Event handler not called");

		// Prevent Click on interactive controls

		oExtension = oTable._getPointerExtension();
		oExtension._debug();
		const aKnownClickableControls = oExtension._KNOWNCLICKABLECONTROLS;

		$Cell = oRowColCell.cell.$();
		for (let i = 0; i < aKnownClickableControls.length; i++) {
			$Cell.toggleClass(aKnownClickableControls[i], true);
			qutils.triggerMouseEvent($Cell, "tap");
			assert.equal(iSelectCount, 3, iSelectCount + " selections performed");
			assert.ok(!bClickHandlerCalled, "Cell Click Event handler not called");
			$Cell.toggleClass(aKnownClickableControls[i], false);
		}

		oRowColCell.cell.getEnabled = function() { return false; };
		$Cell = oRowColCell.cell.$();
		const iStartCount = iSelectCount;
		for (let i = 0; i < aKnownClickableControls.length; i++) {
			$Cell.toggleClass(aKnownClickableControls[i], true);
			qutils.triggerMouseEvent($Cell, "tap");
			assert.equal(iSelectCount, iStartCount + i + 1, iSelectCount + " selections performed");
			assert.ok(bClickHandlerCalled, "Cell Click Event handler called");
			$Cell.toggleClass(aKnownClickableControls[i], false);
		}

		oExtension._ExtensionHelper._handleClickSelection = oExtension._ExtensionHelper.__handleClickSelection;
		oExtension._ExtensionHelper.__handleClickSelection = null;
	});

	QUnit.test("Single Selection", async function(assert) {
		oTable.clearSelection();
		oTable.setSelectionBehavior(tableLibrary.SelectionBehavior.Row);
		oTable.setSelectionMode(tableLibrary.SelectionMode.Single);
		initRowActions(oTable, 2, 2);
		await nextUIUpdate();

		assert.ok(!oTable.isIndexSelected(0), "First row is not selected");

		qutils.triggerMouseEvent(getCell(0, 0), "tap");
		assert.ok(oTable.isIndexSelected(0), "Click on data cell in first row -> First row selected");

		qutils.triggerMouseEvent(getRowHeader(0), "tap");
		assert.ok(!oTable.isIndexSelected(0), "Click on row header cell in first row -> First row  not selected");

		qutils.triggerMouseEvent(getRowAction(0), "tap");
		assert.ok(oTable.isIndexSelected(0), "Click on row action cell in first row -> First row selected");

		qutils.triggerMouseEvent(getCell(1, 0), "tap");
		assert.deepEqual(oTable.getSelectedIndices(), [1], "Click on data cell in second row -> Second row selected");
	});

	/**
	 * @deprecated As of version 1.115
	 */
	QUnit.test("Single Selection - legacyMultiSelection", function(assert) {
		oTable.clearSelection();
		oTable.setSelectionBehavior(tableLibrary.SelectionBehavior.Row);
		oTable.setSelectionMode(tableLibrary.SelectionMode.Single);
		initRowActions(oTable, 2, 2);
		oCore.applyChanges();

		oTable._enableLegacyMultiSelection();
		qutils.triggerEvent("tap", getCell(0, 0), {metaKey: true, ctrlKey: true});
		assert.deepEqual(oTable.getSelectedIndices(), [0],
			"Ctrl+Click on data cell in first row with legacy multi selection enabled -> First row selected");
	});

	QUnit.test("MultiToggle Selection - Range", async function(assert) {
		oTable.clearSelection();
		oTable.setSelectionBehavior(tableLibrary.SelectionBehavior.Row);
		initRowActions(oTable, 2, 2);
		await nextUIUpdate();

		qutils.triggerMouseEvent(getCell(0, 0), "tap");
		assert.ok(oTable.isIndexSelected(0), "Click on first row -> Row selected");

		oTable.setFirstVisibleRow(3); // Scroll down 3 rows
		await nextUIUpdate();
		qutils.triggerEvent("tap", getCell(2, 0), {shiftKey: true});
		assert.deepEqual(oTable.getSelectedIndices(), [0, 1, 2, 3, 4, 5], "Range selection with Shift + Click selected the correct rows");
		assert.strictEqual(window.getSelection().toString(), "", "Range selection with Shift + Click did not select text");

		qutils.triggerMouseEvent(getCell(0, 0), "tap"); // Deselect row with index 3
		qutils.triggerMouseEvent(getCell(0, 0), "tap"); // Select row with index 3
		qutils.triggerMouseEvent(getCell(0, 0), "tap"); // Deselect row with index 3
		qutils.triggerEvent("tap", getCell(2, 0), {shiftKey: true});
		assert.deepEqual(oTable.getSelectedIndices(), [0, 1, 2, 4, 5], "Range selection with Shift + Click did not deselect");
	});

	/**
	 * @deprecated As of version 1.115
	 */
	QUnit.test("MultiToggle Selection - Range - legacyMultiSelection", function(assert) {
		oTable.clearSelection();
		oTable.setSelectionBehavior(tableLibrary.SelectionBehavior.Row);
		initRowActions(oTable, 2, 2);
		oCore.applyChanges();

		oTable._enableLegacyMultiSelection();
		oTable.setFirstVisibleRow(0);
		oCore.applyChanges();
		qutils.triggerMouseEvent(getCell(0, 0), "tap"); // Select row with index 5
		qutils.triggerEvent("tap", getCell(2, 0), {shiftKey: true, ctrlKey: true});
		assert.deepEqual(oTable.getSelectedIndices(), [0, 1, 2],
			"Range selection with Shift + Click selected the correct rows,"
			+ "even though Ctrl was also pressed and legacy multi selection was enabled");
		assert.strictEqual(window.getSelection().toString(), "",
			"Range selection with Shift + Click did not select text");
	});

	QUnit.test("MultiToggle Selection - Toggle", async function(assert) {
		oTable.clearSelection();
		oTable.setSelectionBehavior(tableLibrary.SelectionBehavior.Row);
		initRowActions(oTable, 2, 2);
		await nextUIUpdate();

		qutils.triggerMouseEvent(getCell(0, 0), "tap");
		assert.deepEqual(oTable.getSelectedIndices(), [0], "Click on unselected row with index 0");

		qutils.triggerMouseEvent(getCell(1, 0), "tap");
		assert.deepEqual(oTable.getSelectedIndices(), [0, 1], "Click on unselected row with index 1");

		qutils.triggerMouseEvent(getCell(0, 0), "tap");
		assert.deepEqual(oTable.getSelectedIndices(), [1], "Click on selected row with index 0");
	});

	/**
	 * @deprecated As of version 1.115
	 */
	QUnit.test("Legacy Multi Selection", function(assert) {
		oTable.clearSelection();
		oTable.setSelectionBehavior(tableLibrary.SelectionBehavior.Row);
		initRowActions(oTable, 2, 2);
		oCore.applyChanges();

		oTable._enableLegacyMultiSelection();

		qutils.triggerMouseEvent(getCell(0, 0), "tap");
		assert.deepEqual(oTable.getSelectedIndices(), [0], "Click on unselected row with index 0");

		qutils.triggerMouseEvent(getCell(1, 0), "tap");
		assert.deepEqual(oTable.getSelectedIndices(), [1], "Click on unselected row with index 1");

		qutils.triggerEvent("tap", getCell(2, 0), {metaKey: true, ctrlKey: true});
		assert.deepEqual(oTable.getSelectedIndices(), [1, 2], "Ctrl + Click on unselected row with index 2");

		qutils.triggerEvent("tap", getCell(0, 0), {metaKey: true, ctrlKey: true});
		assert.deepEqual(oTable.getSelectedIndices(), [0, 1, 2], "Ctrl + Click on unselected row with index 0");

		qutils.triggerEvent("tap", getCell(1, 0), {metaKey: true, ctrlKey: true});
		assert.deepEqual(oTable.getSelectedIndices(), [0, 2], "Ctrl + Click on selected row with index 1");

		qutils.triggerMouseEvent(getCell(2, 0), "tap");
		assert.deepEqual(oTable.getSelectedIndices(), [2], "Click on selected row with index 2");
	});

	QUnit.module("Selection plugin", {
		beforeEach: function() {
			this.oTable = TableQUnitUtils.createTable({
				rowMode: new FixedRowMode({
					rowCount: 5
				}),
				rows: {path: "/"},
				models: TableQUnitUtils.createJSONModel(8),
				columns: [
					TableQUnitUtils.createTextColumn(),
					TableQUnitUtils.createTextColumn()
				],
				dependents: [new TableQUnitUtils.TestSelectionPlugin()]
			});

			return this.oTable.qunit.whenRenderingFinished();
		},
		afterEach: function() {
			this.oTable.destroy();
		}
	});

	QUnit.test("Single Selection", function(assert) {
		const oTable = this.oTable;
		const oSelectionPlugin = oTable.getDependents()[0];
		const oSpyIsSelected = this.spy(oSelectionPlugin, "isSelected");
		const oSpySetSelected = this.spy(oSelectionPlugin, "setSelected");

		function testSelection(oRow, oTarget) {
			qutils.triggerMouseEvent(oTarget, "tap");
			assert.ok(oSpyIsSelected.calledOnceWithExactly(oRow), "isSelected is called once with the correct parameter");
			assert.ok(oSpySetSelected.calledOnceWithExactly(oRow, !oSpyIsSelected.returnValues[0]),
					"setSelected is called once with the correct parameters");
			oSpyIsSelected.resetHistory();
			oSpySetSelected.resetHistory();
		}

		// default selectionBehavior is RowSelection
		testSelection(oTable.getRows()[0], oTable.qunit.getRowHeaderCell(0));
		testSelection(oTable.getRows()[0], oTable.qunit.getRowHeaderCell(0));
		testSelection(oTable.getRows()[1], oTable.qunit.getRowHeaderCell(1));

		oTable.setSelectionBehavior("Row");
		testSelection(oTable.getRows()[1], oTable.qunit.getDataCell(1, 0));
		testSelection(oTable.getRows()[2], oTable.qunit.getRowHeaderCell(2));

		oTable.setSelectionBehavior("RowOnly");
		testSelection(oTable.getRows()[2], oTable.qunit.getDataCell(2, 1));
		testSelection(oTable.getRows()[3], oTable.qunit.getDataCell(3, 1));

		oSpyIsSelected.restore();
		oSpySetSelected.restore();
	});

	QUnit.test("Range Selection", function(assert) {
		const oTable = this.oTable;
let bSelected;
		const oSelectionPlugin = oTable.getDependents()[0];
		const oSpySetSelected = this.spy(oSelectionPlugin, "setSelected");

		function testSelectRow(oRow, oTarget) {
			qutils.triggerEvent("tap", oTarget);
			assert.ok(oSpySetSelected.calledOnceWithExactly(oRow, true),
					"setSelected is called once with the correct parameters");
			oSpySetSelected.resetHistory();
		}

		function testRangeSelection(oRow, oTarget) {
			bSelected = oSelectionPlugin.isSelected(oRow);
			qutils.triggerEvent("tap", oTarget, {shiftKey: true});
			assert.ok(oSpySetSelected.calledOnceWithExactly(oRow, !bSelected, {range: true}),
					"setSelected is called once with the correct parameters");
			oSpySetSelected.resetHistory();
		}

		// default selectionBehavior is RowSelector
		testSelectRow(oTable.getRows()[0], oTable.qunit.getRowHeaderCell(0));
		testRangeSelection(oTable.getRows()[2], oTable.qunit.getRowHeaderCell(2));
		testSelectRow(oTable.getRows()[4], oTable.qunit.getRowHeaderCell(4));
		testRangeSelection(oTable.getRows()[3], oTable.qunit.getRowHeaderCell(3));

		oTable.setSelectionBehavior("Row");
		oSelectionPlugin.clearSelection();
		testSelectRow(oTable.getRows()[1], oTable.qunit.getDataCell(1, 0));
		testRangeSelection(oTable.getRows()[2], oTable.qunit.getRowHeaderCell(2));
		testSelectRow(oTable.getRows()[4], oTable.qunit.getRowHeaderCell(4));
		testRangeSelection(oTable.getRows()[0], oTable.qunit.getDataCell(0, 0));

		oTable.setSelectionBehavior("RowOnly");
		oSelectionPlugin.clearSelection();
		testSelectRow(oTable.getRows()[3], oTable.qunit.getDataCell(3, 0));
		testRangeSelection(oTable.getRows()[2], oTable.qunit.getDataCell(2, 0));
		testSelectRow(oTable.getRows()[0], oTable.qunit.getDataCell(0, 0));
		testRangeSelection(oTable.getRows()[4], oTable.qunit.getDataCell(4, 0));

		oSpySetSelected.restore();
	});

	QUnit.test("SelectAll/DeselectAll", function(assert) {
		const oTable = this.oTable;
		const oSelectionPlugin = oTable._getSelectionPlugin();
		const oSpyHeaderSelectorPress = this.spy(oSelectionPlugin, "onHeaderSelectorPress");

		qutils.triggerMouseEvent(oTable.qunit.getSelectAllCell(), "tap");
		assert.ok(oSpyHeaderSelectorPress.calledOnce, "onHeaderSelectorPress is called once");
		oSpyHeaderSelectorPress.restore();
	});

	QUnit.module("Column Reordering", {
		beforeEach: function() {
			createTables();
		},
		afterEach: function() {
			destroyTables();
		}
	});

	function computeSettingsForReordering(oTable, iIndex, bIncreaseIndex) {
		const oSettings = {
			column: oTable._getVisibleColumns()[iIndex],
			relatedColumn: oTable._getVisibleColumns()[bIncreaseIndex ? iIndex + 1 : iIndex - 1]
		};

		const initialXPos = 2; //Move mouse 2px from left onto the column

		oSettings.top = Math.floor(oSettings.column.getDomRef().getBoundingClientRect().top);
		oSettings.left = Math.floor(oSettings.column.getDomRef().getBoundingClientRect().left) + initialXPos;
		oSettings.breakeven = (bIncreaseIndex ? oSettings.column.$().outerWidth() : 0) - initialXPos + oSettings.relatedColumn.$().outerWidth() / 2;

		return oSettings;
	}

	QUnit.test("Reordering via Drag&Drop - increase Index", function(assert) {
		const done = assert.async();
		const oSettings = computeSettingsForReordering(oTable, 2, true);
		const oColumn = oSettings.column;
		const iLeft = oSettings.left + oSettings.breakeven;

		assert.equal(oTable.indexOfColumn(oColumn), 2, "Initial index of column");

		qutils.triggerMouseEvent(oColumn.$(), "mousedown", 1, 1, oSettings.left, oSettings.top, 0);
		setTimeout(function() {
			qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft - 30, oSettings.top, 0);
			qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft - 20, oSettings.top, 0);
			qutils.triggerMouseEvent(oColumn.$(), "mouseup", 1, 1, iLeft - 20, oSettings.top, 0);
			setTimeout(async function() {
				await nextUIUpdate();
				assert.equal(oTable.indexOfColumn(oColumn), 2, "Index of column not changed because not dragged enough");

				qutils.triggerMouseEvent(oColumn.$(), "mousedown", 1, 1, oSettings.left, oSettings.top, 0);
				setTimeout(async function() {
					qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft - 20, oSettings.top, 0);
					qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft + 20, oSettings.top, 0);
					qutils.triggerMouseEvent(oColumn.$(), "mouseup", 1, 1, iLeft + 20, oSettings.top, 0);
					assert.equal(oTable.indexOfColumn(oColumn), 3, "Index of column changed");

					await nextUIUpdate();
					assert.strictEqual(document.activeElement, oColumn.getDomRef(), "Focused element");
					assert.strictEqual(oTable._getKeyboardExtension()._itemNavigation.getFocusedDomRef(), oColumn.getDomRef(),
						"Focused element in item navigation");
					done();
				}, 250);
			}, 100);
		}, 250);
	});

	QUnit.test("Reordering via Drag&Drop - decrease Index", function(assert) {
		const done = assert.async();
		const oSettings = computeSettingsForReordering(oTable, 2, false);
		const oColumn = oSettings.column;
		const iLeft = oSettings.left - oSettings.breakeven;

		assert.equal(oTable.indexOfColumn(oColumn), 2, "Initial index of column");

		qutils.triggerMouseEvent(oColumn.$(), "mousedown", 1, 1, oSettings.left, oSettings.top, 0);
		setTimeout(function() {
			qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft + 30, oSettings.top, 0);
			qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft + 20, oSettings.top, 0);
			qutils.triggerMouseEvent(oColumn.$(), "mouseup", 1, 1, iLeft + 20, oSettings.top, 0);
			setTimeout(async function() {
				await nextUIUpdate();
				assert.equal(oTable.indexOfColumn(oColumn), 2, "Index of column not changed because not dragged enough");

				qutils.triggerMouseEvent(oColumn.$(), "mousedown", 1, 1, oSettings.left, oSettings.top, 0);
				setTimeout(async function() {
					qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft + 20, oSettings.top, 0);
					qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft - 20, oSettings.top, 0);
					qutils.triggerMouseEvent(oColumn.$(), "mouseup", 1, 1, iLeft - 20, oSettings.top, 0);
					assert.equal(oTable.indexOfColumn(oColumn), 1, "Index of column changed");

					await nextUIUpdate();
					assert.strictEqual(document.activeElement, oColumn.getDomRef(), "Focused element");
					assert.strictEqual(oTable._getKeyboardExtension()._itemNavigation.getFocusedDomRef(), oColumn.getDomRef(),
						"Focused element in item navigation");
					done();
				}, 250);
			}, 100);
		}, 250);
	});

	QUnit.test("No Reordering of fixed columns (within fixed)", async function(assert) {
		const done = assert.async();
		oTable.setFixedColumnCount(4);
		await nextUIUpdate();

		const oSettings = computeSettingsForReordering(oTable, 2, true);
		const oColumn = oSettings.column;
		const iLeft = oSettings.left + oSettings.breakeven;

		assert.equal(oTable.indexOfColumn(oColumn), 2, "Initial index of column");

		qutils.triggerMouseEvent(oColumn.$(), "mousedown", 1, 1, oSettings.left, oSettings.top, 0);
		setTimeout(function() {
			qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft - 30, oSettings.top, 0);
			qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft + 20, oSettings.top, 0);
			qutils.triggerMouseEvent(oColumn.$(), "mouseup", 1, 1, iLeft + 20, oSettings.top, 0);
			setTimeout(function() {
				oCore.applyChanges();
				assert.equal(oTable.indexOfColumn(oColumn), 2, "Index of column not changed");
				done();
			}, 100);
		}, 250);
	});

	QUnit.test("No Reordering of fixed columns (fixed to not fixed)", async function(assert) {
		const done = assert.async();
		oTable.setFixedColumnCount(3);
		await nextUIUpdate();

		const oSettings = computeSettingsForReordering(oTable, 2, true);
		const oColumn = oSettings.column;
		const iLeft = oSettings.left + oSettings.breakeven;

		assert.equal(oTable.indexOfColumn(oColumn), 2, "Initial index of column");

		qutils.triggerMouseEvent(oColumn.$(), "mousedown", 1, 1, oSettings.left, oSettings.top, 0);
		setTimeout(function() {
			qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft - 30, oSettings.top, 0);
			qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft + 20, oSettings.top, 0);
			qutils.triggerMouseEvent(oColumn.$(), "mouseup", 1, 1, iLeft + 20, oSettings.top, 0);
			setTimeout(function() {
				oCore.applyChanges();
				assert.equal(oTable.indexOfColumn(oColumn), 2, "Index of column not changed");
				done();
			}, 100);
		}, 250);
	});

	QUnit.test("No Reordering of fixed columns (not fixed to fixed)", async function(assert) {
		const done = assert.async();
		oTable.setFixedColumnCount(2);
		await nextUIUpdate();

		const oSettings = computeSettingsForReordering(oTable, 2, false);
		const oColumn = oSettings.column;
		const iLeft = oSettings.left - oSettings.breakeven;

		assert.equal(oTable.indexOfColumn(oColumn), 2, "Initial index of column");

		qutils.triggerMouseEvent(oColumn.$(), "mousedown", 1, 1, oSettings.left, oSettings.top, 0);
		setTimeout(function() {
			qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft + 30, oSettings.top, 0);
			qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft - 20, oSettings.top, 0);
			qutils.triggerMouseEvent(oColumn.$(), "mouseup", 1, 1, iLeft - 20, oSettings.top, 0);
			setTimeout(function() {
				oCore.applyChanges();
				assert.equal(oTable.indexOfColumn(oColumn), 2, "Index of column not changed");
				done();
			}, 100);
		}, 250);
	});

	QUnit.test("TreeTable - No Reordering via Drag&Drop of first column - increase index", async function(assert) {
		const done = assert.async();
		oTreeTable.setFixedColumnCount(0);
		await nextUIUpdate();

		const oSettings = computeSettingsForReordering(oTreeTable, 0, true);
		const oColumn = oSettings.column;
		const iLeft = oSettings.left + oSettings.breakeven;

		assert.equal(oTreeTable.indexOfColumn(oColumn), 0, "Initial index of column");

		qutils.triggerMouseEvent(oColumn.$(), "mousedown", 1, 1, oSettings.left, oSettings.top, 0);
		setTimeout(function() {
			qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft - 30, oSettings.top, 0);
			qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft - 20, oSettings.top, 0);
			qutils.triggerMouseEvent(oColumn.$(), "mouseup", 1, 1, iLeft - 20, oSettings.top, 0);
			setTimeout(async function() {
				await nextUIUpdate();
				assert.equal(oTreeTable.indexOfColumn(oColumn), 0, "Index of column not changed because not dragged enough");

				qutils.triggerMouseEvent(oColumn.$(), "mousedown", 1, 1, oSettings.left, oSettings.top, 0);
				setTimeout(function() {
					qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft - 30, oSettings.top, 0);
					qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft + 20, oSettings.top, 0);
					qutils.triggerMouseEvent(oColumn.$(), "mouseup", 1, 1, iLeft + 20, oSettings.top, 0);
					setTimeout(async function() {
						await nextUIUpdate();
						assert.equal(oTreeTable.indexOfColumn(oColumn), 0, "Index of column not changed");
						done();
					}, 100);
				}, 250);

			}, 100);
		}, 250);
	});

	QUnit.test("TreeTable - No Reordering via Drag&Drop of first column - decrease index", async function(assert) {
		const done = assert.async();
		oTreeTable.setFixedColumnCount(0);
		await nextUIUpdate();

		const oSettings = computeSettingsForReordering(oTreeTable, 1, false);
		const oColumn = oSettings.column;
		const iLeft = oSettings.left - oSettings.breakeven;

		assert.equal(oTreeTable.indexOfColumn(oColumn), 1, "Initial index of column");

		qutils.triggerMouseEvent(oColumn.$(), "mousedown", 1, 1, oSettings.left, oSettings.top, 0);
		setTimeout(function() {
			qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft + 30, oSettings.top, 0);
			qutils.triggerMouseEvent(oColumn.$(), "mousemove", 1, 1, iLeft - 20, oSettings.top, 0);
			qutils.triggerMouseEvent(oColumn.$(), "mouseup", 1, 1, iLeft - 20, oSettings.top, 0);
			setTimeout(async function() {
				await nextUIUpdate();
				assert.equal(oTreeTable.indexOfColumn(oColumn), 1, "Index of column not changed");
				done();
			}, 100);
		}, 250);
	});

	QUnit.module("Row Hover Effect", {
		beforeEach: async function() {
			createTables();
			oTable.setSelectionBehavior("Row");
			oTable.invalidate();
			await nextUIUpdate();
		},
		afterEach: function() {
			destroyTables();
		}
	});

	QUnit.test("RowHeader", function(assert) {
		assert.ok(!getRowHeader(0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on row header");
		assert.ok(!getCell(0, 0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on fixed part of row");
		assert.ok(!getCell(0, 2).parent().hasClass("sapUiTableRowHvr"), "No hover effect on scroll part of row");
		getRowHeader(0).trigger("mouseover");
		assert.ok(getRowHeader(0).parent().hasClass("sapUiTableRowHvr"), "Hover effect on row header");
		assert.ok(getCell(0, 0).parent().hasClass("sapUiTableRowHvr"), "Hover effect on fixed part of row");
		assert.ok(getCell(0, 2).parent().hasClass("sapUiTableRowHvr"), "Hover effect on scroll part of row");
		getRowHeader(0).trigger("mouseout");
		assert.ok(!getRowHeader(0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on row header");
		assert.ok(!getCell(0, 0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on fixed part of row");
		assert.ok(!getCell(0, 2).parent().hasClass("sapUiTableRowHvr"), "No hover effect on scroll part of row");
	});

	QUnit.test("Fixed column area", function(assert) {
		assert.ok(!getRowHeader(0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on row header");
		assert.ok(!getCell(0, 0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on fixed part of row");
		assert.ok(!getCell(0, 2).parent().hasClass("sapUiTableRowHvr"), "No hover effect on scroll part of row");
		getCell(0, 0).trigger("mouseover");
		assert.ok(getRowHeader(0).parent().hasClass("sapUiTableRowHvr"), "Hover effect on row header");
		assert.ok(getCell(0, 0).parent().hasClass("sapUiTableRowHvr"), "Hover effect on fixed part of row");
		assert.ok(getCell(0, 2).parent().hasClass("sapUiTableRowHvr"), "Hover effect on scroll part of row");
		getCell(0, 0).trigger("mouseout");
		assert.ok(!getRowHeader(0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on row header");
		assert.ok(!getCell(0, 0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on fixed part of row");
		assert.ok(!getCell(0, 2).parent().hasClass("sapUiTableRowHvr"), "No hover effect on scroll part of row");
	});

	QUnit.test("Scroll column area", function(assert) {
		assert.ok(!getRowHeader(0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on row header");
		assert.ok(!getCell(0, 0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on fixed part of row");
		assert.ok(!getCell(0, 2).parent().hasClass("sapUiTableRowHvr"), "No hover effect on scroll part of row");
		getCell(0, 2).trigger("mouseover");
		assert.ok(getRowHeader(0).parent().hasClass("sapUiTableRowHvr"), "Hover effect on row header");
		assert.ok(getCell(0, 0).parent().hasClass("sapUiTableRowHvr"), "Hover effect on fixed part of row");
		assert.ok(getCell(0, 2).parent().hasClass("sapUiTableRowHvr"), "Hover effect on scroll part of row");
		getCell(0, 2).trigger("mouseout");
		assert.ok(!getRowHeader(0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on row header");
		assert.ok(!getCell(0, 0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on fixed part of row");
		assert.ok(!getCell(0, 2).parent().hasClass("sapUiTableRowHvr"), "No hover effect on scroll part of row");
	});

	QUnit.test("Row Hover Effect depending on SelectionMode and SelectionBehavior", async function(assert) {
		oTable.setSelectionMode("None");
		oTable.invalidate();
		await nextUIUpdate();
		getCell(0, 2).trigger("mouseover");
		assert.ok(!getRowHeader(0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on row header");
		assert.ok(!getCell(0, 0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on fixed part of row");
		assert.ok(!getCell(0, 2).parent().hasClass("sapUiTableRowHvr"), "No hover effect on scroll part of row");
		getCell(0, 2).trigger("mouseout");
		oTable.setSelectionBehavior("RowOnly");
		oTable.invalidate();
		await nextUIUpdate();
		getCell(0, 2).trigger("mouseover");
		assert.ok(!getRowHeader(0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on row header");
		assert.ok(!getCell(0, 0).parent().hasClass("sapUiTableRowHvr"), "No hover effect on fixed part of row");
		assert.ok(!getCell(0, 2).parent().hasClass("sapUiTableRowHvr"), "No hover effect on scroll part of row");
		getCell(0, 2).trigger("mouseout");
		oTable.setSelectionMode("MultiToggle");
		oTable.setSelectionBehavior("Row");
		oTable.invalidate();
		await nextUIUpdate();
		getCell(0, 2).trigger("mouseover");
		assert.ok(getRowHeader(0).parent().hasClass("sapUiTableRowHvr"), "Hover effect on row header");
		assert.ok(getCell(0, 0).parent().hasClass("sapUiTableRowHvr"), "Hover effect on fixed part of row");
		assert.ok(getCell(0, 2).parent().hasClass("sapUiTableRowHvr"), "Hover effect on scroll part of row");
		getCell(0, 2).trigger("mouseout");
		oTable.setSelectionBehavior("RowOnly");
		oTable.invalidate();
		await nextUIUpdate();
		getCell(0, 2).trigger("mouseover");
		assert.ok(getRowHeader(0).parent().hasClass("sapUiTableRowHvr"), "Hover effect on row header");
		assert.ok(getCell(0, 0).parent().hasClass("sapUiTableRowHvr"), "Hover effect on fixed part of row");
		assert.ok(getCell(0, 2).parent().hasClass("sapUiTableRowHvr"), "Hover effect on scroll part of row");
		getCell(0, 2).trigger("mouseout");
		oTable.setSelectionMode("None");
		oTable.setSelectionBehavior("RowSelector");
		oTable.invalidate();
		await nextUIUpdate();
		oTable.attachCellClick(function() {});
		getCell(0, 2).trigger("mouseover");
		assert.ok(getRowHeader(0).parent().hasClass("sapUiTableRowHvr"), "Hover effect on row header");
		assert.ok(getCell(0, 0).parent().hasClass("sapUiTableRowHvr"), "Hover effect on fixed part of row");
		assert.ok(getCell(0, 2).parent().hasClass("sapUiTableRowHvr"), "Hover effect on scroll part of row");
	});

	QUnit.module("Helpers", {
		beforeEach: function() {
			createTables();
		},
		afterEach: function() {
			destroyTables();
		}
	});

	QUnit.test("_debug()", function(assert) {
		const oExtension = oTable._getPointerExtension();
		assert.ok(!oExtension._ExtensionHelper, "_ExtensionHelper: No debug mode");
		assert.ok(!oExtension._ColumnResizeHelper, "_ColumnResizeHelper: No debug mode");
		assert.ok(!oExtension._ReorderHelper, "_ReorderHelper: No debug mode");
		assert.ok(!oExtension._ExtensionDelegate, "_ExtensionDelegate: No debug mode");
		assert.ok(!oExtension._RowHoverHandler, "_RowHoverHandler: No debug mode");
		assert.ok(!oExtension._KNOWNCLICKABLECONTROLS, "_KNOWNCLICKABLECONTROLS: No debug mode");

		oExtension._debug();
		assert.ok(!!oExtension._ExtensionHelper, "_ExtensionHelper: Debug mode");
		assert.ok(!!oExtension._ColumnResizeHelper, "_ColumnResizeHelper: Debug mode");
		assert.ok(!!oExtension._ReorderHelper, "_ReorderHelper: Debug mode");
		assert.ok(!!oExtension._ExtensionDelegate, "_ExtensionDelegate: Debug mode");
		assert.ok(!!oExtension._RowHoverHandler, "_RowHoverHandler: Debug mode");
		assert.ok(!!oExtension._KNOWNCLICKABLECONTROLS, "_KNOWNCLICKABLECONTROLS: Debug mode");
	});

	QUnit.test("_getEventPosition()", function(assert) {
		oTable._getPointerExtension()._debug();
		const oExtensionHelper = oTable._getPointerExtension()._ExtensionHelper;
		let oEvent;
		let oPos;
		const x = 15;
		const y = 20;
		const oCoord = {pageX: x, pageY: y};

		oEvent = jQuery.extend({originalEvent: {}}, oCoord);

		oPos = oExtensionHelper._getEventPosition(oEvent, oTable);
		assert.equal(oPos.x, x, "MouseEvent - X");
		assert.equal(oPos.y, y, "MouseEvent - Y");

		oEvent = {
			targetTouches: [oCoord],
			originalEvent: {
				touches: []
			}
		};

		oPos = oExtensionHelper._getEventPosition(oEvent, oTable);
		assert.equal(oPos.x, x, "TouchEvent - X");
		assert.equal(oPos.y, y, "TouchEvent - Y");

		oEvent = {
			touches: [oCoord],
			originalEvent: {
				touches: [],
				targetTouches: [oCoord]
			}
		};

		oPos = oExtensionHelper._getEventPosition(oEvent, oTable);
		assert.equal(oPos.x, x, "TouchEvent (wrapped) - X");
		assert.equal(oPos.y, y, "TouchEvent (wrapped) - Y");
	});
});