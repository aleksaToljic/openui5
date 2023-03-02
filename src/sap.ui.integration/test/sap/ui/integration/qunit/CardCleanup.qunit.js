/* global QUnit */

sap.ui.define([
	"sap/ui/integration/widgets/Card",
	"sap/ui/integration/util/RequestDataProvider",
	"sap/ui/integration/library"
], function (
	Card,
	RequestDataProvider,
	library
) {
	"use strict";

	var DOM_RENDER_LOCATION = "qunit-fixture";

	QUnit.module("Card cleanup", {
		beforeEach: function () {
			this.oCard = new Card({
				baseUrl: "test-resources/sap/ui/integration/qunit/testResources/"
			});
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		},
		afterEach: function () {
			this.oCard.destroy();
		}
	});

	QUnit.test("Changing from Request to JSON data provider before request is complete should reset loading state", function (assert) {
		// Arrange
		var done = assert.async();
		this.stub(RequestDataProvider.prototype, "getData").returns(new Promise(function () {}));
		var oManifestWithRequest = {
			"sap.app": {
				"id": "test.card.cleanup.loadingProvider"
			},
			"sap.card": {
				"data": {
					"request": {
						"url": "items.json"
					}
				},
				"type": "List",
				"header": {
					"title": "Available Trainings"
				},
				"content": {
					"item": {
						"title": "{title}"
					}
				}
			}
		};
		var oManifestWithJSONData = {
			"sap.app": {
				"id": "test.card.cleanup.loadingProvider"
			},
			"sap.card": {
				"data": {
					"json": []
				},
				"type": "List",
				"header": {
					"title": "Available Trainings"
				},
				"content": {
					"item": {
						"title": "{title}"
					}
				}
			}
		};

		this.oCard.attachEventOnce("manifestApplied", function () {
			// Assert
			assert.ok(this.oCard.isLoading(), "Card should be in loading state while request is pending");

			this.oCard.attachEventOnce("_ready", function () {
				// Assert
				assert.notOk(this.oCard.isLoading(), "Card shouldn't be in loading state from the previous loading provider");

				done();
			}.bind(this));

			// Act - change the manifest to use JSON data provider
			this.oCard.setManifest(oManifestWithJSONData);
		}.bind(this));

		this.oCard.setManifest(oManifestWithRequest);
	});

	QUnit.module("Cleanup of internal models", {
		beforeEach: function () {
			this.oCard = new Card({
				baseUrl: "test-resources/sap/ui/integration/qunit/testResources/"
			});
			this.oCard.placeAt(DOM_RENDER_LOCATION);
		},
		afterEach: function () {
			this.oCard.destroy();
		}
	});

	QUnit.test("Default model", function (assert) {
		var done = assert.async();
		assert.expect(3);
		assert.deepEqual(this.oCard.getModel().getData(), {}, "The default model should be empty");

		this.oCard.attachEventOnce("_ready", function () {
			// Assert
			assert.notDeepEqual(this.oCard.getModel().getData(), {}, "The default model should be populated with data");

			this.oCard.attachEventOnce("_ready", function () {
				// Assert 2
				assert.deepEqual(this.oCard.getModel().getData(), {}, "The default model should be empty");
				done();
			}.bind(this));

			// Act 2
			this.oCard.setPreviewMode(library.CardPreviewMode.Abstract);
		}.bind(this));

		// Act 1
		this.oCard.setManifest({
			"sap.app": {
				"id": "test.card.cleanup.defaultModel"
			},
			"sap.card": {
				"data": {
					"json": [{
						"title": "item 1"
					}]
				},
				"type": "List",
				"header": {
					"title": "Available Trainings"
				},
				"content": {
					"item": {
						"title": "{title}"
					}
				}
			}
		});
	});

});