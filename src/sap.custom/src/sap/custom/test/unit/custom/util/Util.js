/* global QUnit */
sap.ui.define([
    "sap/custom/util/Util",
    "sap/ui/model/json/JSONModel"
], function (Util, JSONModel) {
    "use strict";

    QUnit.module("Util Test", {
        beforeEach: function () {
            // Create a mock control, here using JSONModel to simulate a control with set methods
            this.oModel = new JSONModel();
            this.oUtil = new Util(this.oModel);
        },
        afterEach: function () {
            // Cleanup after each test
            this.oModel.destroy();
        }
    });

    QUnit.test("Test setInitialOptions with supported options", function (assert) {
        // Arrange
        var oOptions = {
            sizeLimit: "1000",
            defaultBindingMode: "TwoWay"
        };
        var aSupportedKeys = ["sizeLimit"];
        const oldDefaultBindingMode = this.oModel.sDefaultBindingMode;

        // Act
        this.oUtil.setInitialOptions(this.oModel, oOptions, aSupportedKeys);

        // Assert
        assert.strictEqual(this.oModel.iSizeLimit, "1000", "Size limit was correctly set.");
        assert.strictEqual(oldDefaultBindingMode, this.oModel.sDefaultBindingMode,
            "Default binding mode was not set because it's not supported.")
    });

    QUnit.test("Test setInitialOptions with no supportedKeys parameter", function (assert) {
        // Arrange
        var oOptions = {
            sizeLimit: "500",
            defaultBindingMode: "TwoWay"
        };

        // Act
        this.oUtil.setInitialOptions(this.oModel, oOptions);

        // Assert
        assert.strictEqual(this.oModel.iSizeLimit, "500", "Size limit was correctly set.");
        assert.strictEqual(this.oModel.sDefaultBindingMode, "TwoWay", "Default binding mode was correctly set.");
    });
});
